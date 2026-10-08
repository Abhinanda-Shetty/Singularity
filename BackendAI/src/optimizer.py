"""
optimizer.py - PuLP-based redistribution optimizer.

Given a set of surplus hospitals (donors) and deficit hospitals (recipients)
for a specific medicine, computes the optimal transfer plan that:

    1. Minimises total shortage (primary objective)
    2. Respects donor safety stock and available transferable surplus
    3. Respects recipient maximum requirement (shortage_quantity)
    4. Enforces expiry feasibility: transfer_time < days_until_expiry
    5. Enforces transport time feasibility (optional OSRM distance lookup)
    6. Prioritises higher-priority recipients through a weighted objective

Outputs a list of TransferRecommendation records, one per feasible donor->recipient
pairing where a non-zero transfer was recommended.

Dependencies
------------
    pip install pulp

OSRM (optional)
---------------
    If an OSRM endpoint is configured, road distance + ETA is queried for each
    donor-recipient pair and used as a feasibility constraint.

Example usage
-------------
    from optimizer import run_redistribution
    from forecasting import forecast_demand, to_pulp_input

    forecasts   = forecast_demand(new_records)
    pulp_input  = to_pulp_input(forecasts)
    transfers   = run_redistribution(
        deficits   = pulp_input["deficits"],
        surpluses  = pulp_input["surpluses"],
        # expiry_records = assess_expiry_risk(batch_data),   # optional
    )
    for t in transfers:
        print(t)
"""
from __future__ import annotations

import math
import logging
from dataclasses import dataclass, field
from typing import Optional

log = logging.getLogger(__name__)

try:
    import pulp  # type: ignore
    _PULP_AVAILABLE = True
except ImportError:
    _PULP_AVAILABLE = False
    log.warning("PuLP not installed.  Install with: pip install pulp")

try:
    import requests  # type: ignore
    _REQUESTS_AVAILABLE = True
except ImportError:
    _REQUESTS_AVAILABLE = False

# -- Constants -----------------------------------------------------------------

DEFAULT_SPEED_KMH        = 60.0    # fallback road speed when OSRM unavailable
DEFAULT_EXPIRY_BUFFER    = 1.2     # safety factor: transport_time × 1.2 < days_until_expiry
DEFAULT_OSRM_BASE_URL    = "http://router.project-osrm.org"
DEFAULT_MIN_TRANSFER_QTY = 10      # ignore transfers below this threshold (units)
PRIORITY_WEIGHT          = 0.01    # weight applied to priority_score in objective


# -- Data classes --------------------------------------------------------------

@dataclass
class TransferRecommendation:
    """A recommended stock transfer from one hospital to another."""

    # Donor
    donor_hospital_id:   str   = ""
    donor_hospital_name: str   = ""
    donor_latitude:      float = 0.0
    donor_longitude:     float = 0.0
    donor_surplus:       float = 0.0

    # Recipient
    recipient_hospital_id:   str   = ""
    recipient_hospital_name: str   = ""
    recipient_latitude:      float = 0.0
    recipient_longitude:     float = 0.0
    recipient_priority_score: float = 0.0

    # Medicine
    medicine_id:         int   = 0
    medicine_name:       str   = ""
    medicine_category:   str   = ""

    # Transfer details
    transfer_qty:        float = 0.0
    distance_km:         float = 0.0
    transport_time_days: float = 0.0
    expiry_days:         float = 9999.0
    is_expiry_feasible:  bool  = True

    # Explanation
    reason:              str   = ""
    notes:               list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "donor_hospital_id":       self.donor_hospital_id,
            "donor_hospital_name":     self.donor_hospital_name,
            "recipient_hospital_id":   self.recipient_hospital_id,
            "recipient_hospital_name": self.recipient_hospital_name,
            "medicine_id":             self.medicine_id,
            "medicine_name":           self.medicine_name,
            "medicine_category":       self.medicine_category,
            "transfer_qty":            round(self.transfer_qty, 2),
            "distance_km":             round(self.distance_km, 2),
            "transport_time_days":     round(self.transport_time_days, 3),
            "expiry_days":             round(self.expiry_days, 2),
            "is_expiry_feasible":      self.is_expiry_feasible,
            "donor_surplus":           round(self.donor_surplus, 2),
            "recipient_priority_score": self.recipient_priority_score,
            "reason":                  self.reason,
            "notes":                   self.notes,
        }

    def __str__(self) -> str:
        return (
            f"{self.donor_hospital_id} -> {self.recipient_hospital_id} : "
            f"{self.transfer_qty:.0f} units of {self.medicine_name} "
            f"({self.distance_km:.1f} km, {self.transport_time_days:.1f} d)"
        )


# -- OSRM helper ---------------------------------------------------------------

def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Straight-line distance between two coordinates (km)."""
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi  = math.radians(lat2 - lat1)
    dlam  = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def _osrm_distance(
    lat1: float, lon1: float,
    lat2: float, lon2: float,
    base_url: str = DEFAULT_OSRM_BASE_URL,
    timeout: int  = 5,
) -> tuple[float, float]:
    """
    Query OSRM for road distance (km) and duration (hours).

    Returns (distance_km, duration_hours).  Falls back to Haversine + default
    speed on any error.
    """
    if not _REQUESTS_AVAILABLE:
        d = _haversine_km(lat1, lon1, lat2, lon2) * 1.3   # road factor
        return d, d / DEFAULT_SPEED_KMH

    url = (
        f"{base_url}/route/v1/driving/"
        f"{lon1},{lat1};{lon2},{lat2}"
        f"?overview=false"
    )
    try:
        resp = requests.get(url, timeout=timeout)
        resp.raise_for_status()
        data = resp.json()
        route = data["routes"][0]
        dist_km   = route["distance"] / 1000.0
        dur_hours = route["duration"] / 3600.0
        return dist_km, dur_hours
    except Exception as exc:
        log.debug("OSRM query failed (%s). Using Haversine fallback.", exc)
        d = _haversine_km(lat1, lon1, lat2, lon2) * 1.3
        return d, d / DEFAULT_SPEED_KMH


# -- Core optimizer ------------------------------------------------------------

def _build_transfer_matrix(
    donors:      list[dict],
    recipients:  list[dict],
    expiry_map:  dict,          # {donor_hospital_id: days_until_expiry}
    use_osrm:    bool,
    osrm_url:    str,
    expiry_buffer: float,
) -> dict:
    """
    Pre-compute (distance_km, transport_time_days, is_expiry_feasible)
    for every donor-recipient pair.
    """
    matrix: dict = {}
    for d in donors:
        for r in recipients:
            if d["hospital_id"] == r["hospital_id"]:
                continue  # no self-transfers

            if use_osrm:
                dist_km, dur_h = _osrm_distance(
                    d["latitude"], d["longitude"],
                    r["latitude"], r["longitude"],
                    base_url=osrm_url,
                )
            else:
                dist_km = _haversine_km(
                    d["latitude"], d["longitude"],
                    r["latitude"], r["longitude"],
                ) * 1.3
                dur_h   = dist_km / DEFAULT_SPEED_KMH

            transport_days = dur_h / 24.0

            # Expiry feasibility
            exp_days = expiry_map.get(d["hospital_id"], 9999.0)
            feasible = (transport_days * expiry_buffer) < exp_days

            matrix[(d["hospital_id"], r["hospital_id"])] = {
                "distance_km":         dist_km,
                "transport_time_days": transport_days,
                "expiry_days":         exp_days,
                "is_expiry_feasible":  feasible,
            }
    return matrix


def _run_pulp(
    donors:       list[dict],
    recipients:   list[dict],
    matrix:       dict,
    min_qty:      int,
) -> dict:
    """
    Solve a linear program to maximise total shortage satisfied, weighted
    by recipient priority score.

    Decision variables: x[d_id, r_id] = units transferred

    Objective (maximise):
        Σ (priority_weight * priority_score_r + 1) * x[d, r]

    Subject to:
        1. x[d, r] ≥ 0
        2. Σ_r x[d, r] ≤ donor_surplus[d]      (donor capacity)
        3. Σ_d x[d, r] ≤ shortage_qty[r]       (recipient requirement)
        4. x[d, r] = 0 if not feasible          (expiry / route)
    """
    if not _PULP_AVAILABLE:
        raise RuntimeError(
            "PuLP is required for redistribution optimization.\n"
            "Install it with: pip install pulp"
        )

    prob = pulp.LpProblem("MedicalRedistribution", pulp.LpMaximize)

    # Decision variables
    xvars: dict = {}
    feasible_pairs: list = []
    for d in donors:
        for r in recipients:
            key = (d["hospital_id"], r["hospital_id"])
            if key not in matrix:
                continue
            if not matrix[key]["is_expiry_feasible"]:
                continue
            var = pulp.LpVariable(
                f"x_{d['hospital_id']}_{r['hospital_id']}",
                lowBound=0,
                cat="Continuous",
            )
            xvars[key] = var
            feasible_pairs.append(key)

    if not feasible_pairs:
        log.warning("No feasible donor-recipient pairs found after expiry filtering.")
        return {}

    # Objective
    priority_scores = {r["hospital_id"]: r.get("priority_score", 0) for r in recipients}
    prob += pulp.lpSum(
        (1.0 + PRIORITY_WEIGHT * priority_scores.get(r_id, 0)) * xvars[(d_id, r_id)]
        for (d_id, r_id) in feasible_pairs
    )

    # Donor capacity constraints
    donor_surplus_map = {d["hospital_id"]: max(0.0, float(d.get("surplus", 0))) for d in donors}
    for d in donors:
        d_id = d["hospital_id"]
        related = [xvars[(d_id, r_id)] for (dd, r_id) in feasible_pairs if dd == d_id]
        if related:
            prob += pulp.lpSum(related) <= donor_surplus_map[d_id]

    # Recipient requirement constraints
    shortage_map = {r["hospital_id"]: max(0.0, float(r.get("shortage_quantity", 0))) for r in recipients}
    for r in recipients:
        r_id = r["hospital_id"]
        related = [xvars[(d_id, r_id)] for (d_id, rr) in feasible_pairs if rr == r_id]
        if related:
            prob += pulp.lpSum(related) <= shortage_map[r_id]

    # Solve
    solver = pulp.PULP_CBC_CMD(msg=0)
    status = prob.solve(solver)
    log.info("PuLP solver status: %s", pulp.LpStatus[prob.status])

    results = {}
    if pulp.LpStatus[prob.status] in ("Optimal", "Feasible"):
        for key, var in xvars.items():
            val = pulp.value(var) or 0.0
            if val >= min_qty:
                results[key] = round(val, 2)

    return results


def _build_recommendations(
    solution:    dict,
    donors:      list[dict],
    recipients:  list[dict],
    matrix:      dict,
    medicine:    dict,
) -> list[TransferRecommendation]:
    """Convert PuLP solution dict into TransferRecommendation objects."""
    donor_map     = {d["hospital_id"]: d for d in donors}
    recipient_map = {r["hospital_id"]: r for r in recipients}

    recommendations: list[TransferRecommendation] = []
    for (d_id, r_id), qty in solution.items():
        d   = donor_map[d_id]
        r   = recipient_map[r_id]
        geo = matrix.get((d_id, r_id), {})

        rec = TransferRecommendation(
            donor_hospital_id        = d_id,
            donor_hospital_name      = str(d.get("hospital_name", d_id)),
            donor_latitude           = float(d.get("latitude", 0)),
            donor_longitude          = float(d.get("longitude", 0)),
            donor_surplus            = float(d.get("surplus", 0)),
            recipient_hospital_id    = r_id,
            recipient_hospital_name  = str(r.get("hospital_name", r_id)),
            recipient_latitude       = float(r.get("latitude", 0)),
            recipient_longitude      = float(r.get("longitude", 0)),
            recipient_priority_score = float(r.get("priority_score", 0)),
            medicine_id              = int(medicine.get("medicine_id", 0)),
            medicine_name            = str(medicine.get("medicine_name", "")),
            medicine_category        = str(medicine.get("medicine_category", "")),
            transfer_qty             = qty,
            distance_km              = float(geo.get("distance_km", 0)),
            transport_time_days      = float(geo.get("transport_time_days", 0)),
            expiry_days              = float(geo.get("expiry_days", 9999)),
            is_expiry_feasible       = bool(geo.get("is_expiry_feasible", True)),
            reason=(
                f"PuLP recommends transferring {qty:.0f} units of "
                f"{medicine.get('medicine_name', '')} from "
                f"{d.get('hospital_name', d_id)} to "
                f"{r.get('hospital_name', r_id)} "
                f"({geo.get('distance_km', 0):.1f} km, "
                f"{geo.get('transport_time_days', 0) * 24:.1f} h)."
            ),
        )

        if geo.get("expiry_days", 9999) < 30:
            rec.notes.append(
                f"⏳ Donor batch expires in {geo.get('expiry_days', 0):.0f} d - expedite transfer."
            )
        if r.get("outbreak_indicator", 0):
            rec.notes.append("🦠 Recipient hospital has active outbreak signal.")

        recommendations.append(rec)

    recommendations.sort(
        key=lambda x: (x.recipient_priority_score, x.transfer_qty),
        reverse=True,
    )
    return recommendations


# -- Public API ----------------------------------------------------------------

def run_redistribution(
    deficits:    list[dict],
    surpluses:   list[dict],
    medicine_id: Optional[int]  = None,
    expiry_map:  Optional[dict] = None,
    use_osrm:    bool           = False,
    osrm_url:    str            = DEFAULT_OSRM_BASE_URL,
    expiry_buffer: float        = DEFAULT_EXPIRY_BUFFER,
    min_transfer_qty: int       = DEFAULT_MIN_TRANSFER_QTY,
) -> list[TransferRecommendation]:
    """
    Run the full redistribution optimization for a given medicine.

    Parameters
    ----------
    deficits : list[dict]
        Deficit records from PrioritRecord.to_dict() or to_pulp_input()["deficits"].
        Must include: hospital_id, hospital_name, latitude, longitude,
                      shortage_quantity, priority_score.
    surpluses : list[dict]
        Surplus records from to_pulp_input()["surpluses"].
        Must include: hospital_id, hospital_name, latitude, longitude,
                      current_stock, safety_stock, predicted_future_demand.
        ``surplus`` key is auto-computed as:
            current_stock − safety_stock − predicted_future_demand
    medicine_id : int, optional
        Filter both lists to this medicine_id.
    expiry_map : dict, optional
        ``{donor_hospital_id: days_until_expiry}`` for expiry feasibility.
    use_osrm : bool
        If True, query OSRM for road distances.  If False, use Haversine × 1.3.
    osrm_url : str
        OSRM base URL.
    expiry_buffer : float
        Safety factor: transport_time_days × expiry_buffer must be < expiry_days.
    min_transfer_qty : int
        Ignore transfer variables below this value.

    Returns
    -------
    list[TransferRecommendation]
        Sorted by recipient priority score descending.
    """
    if not _PULP_AVAILABLE:
        raise RuntimeError("PuLP is not installed. Run: pip install pulp")

    # Filter by medicine
    if medicine_id is not None:
        deficits  = [r for r in deficits  if int(r.get("medicine_id", 0)) == medicine_id]
        surpluses = [r for r in surpluses if int(r.get("medicine_id", 0)) == medicine_id]

    if not deficits or not surpluses:
        log.info("No feasible donors or recipients for medicine_id=%s.", medicine_id)
        return []

    # Compute available surplus (can be donated without breaching safety stock)
    donors: list[dict] = []
    for s in surpluses:
        transferable = (
            float(s.get("current_stock", 0))
            - float(s.get("safety_stock", 0))
            - float(s.get("predicted_future_demand", 0))
        )
        if transferable > min_transfer_qty:
            donors.append({**s, "surplus": transferable})

    if not donors:
        log.info("No donors have transferable surplus (> %d units).", min_transfer_qty)
        return []

    recipients = deficits  # already has shortage_quantity

    # Build expiry map
    _expiry_map = expiry_map or {}

    # Pre-compute transport matrix
    matrix = _build_transfer_matrix(
        donors, recipients,
        expiry_map=_expiry_map,
        use_osrm=use_osrm,
        osrm_url=osrm_url,
        expiry_buffer=expiry_buffer,
    )

    # Solve
    solution = _run_pulp(donors, recipients, matrix, min_qty=min_transfer_qty)

    # Detect medicine metadata from first deficit record
    ref = deficits[0]
    medicine = {
        "medicine_id":       ref.get("medicine_id", 0),
        "medicine_name":     ref.get("medicine_name", ""),
        "medicine_category": ref.get("medicine_category", ""),
    }

    return _build_recommendations(solution, donors, recipients, matrix, medicine)


def run_redistribution_all_medicines(
    pulp_input:     dict,
    expiry_map:     Optional[dict] = None,
    use_osrm:       bool           = False,
    osrm_url:       str            = DEFAULT_OSRM_BASE_URL,
    expiry_buffer:  float          = DEFAULT_EXPIRY_BUFFER,
    min_transfer_qty: int          = DEFAULT_MIN_TRANSFER_QTY,
) -> dict[int, list[TransferRecommendation]]:
    """
    Run redistribution for every unique medicine ID present in pulp_input.

    Parameters
    ----------
    pulp_input : dict
        Output of ``forecasting.to_pulp_input()``.
    expiry_map : dict, optional
        ``{(hospital_id, medicine_id): days_until_expiry}``
        Will be converted to ``{hospital_id: min_days}`` per medicine run.

    Returns
    -------
    dict[medicine_id, list[TransferRecommendation]]
    """
    results: dict[int, list[TransferRecommendation]] = {}

    medicine_ids: set[int] = set()
    for r in pulp_input.get("deficits", []) + pulp_input.get("surpluses", []):
        medicine_ids.add(int(r.get("medicine_id", 0)))

    for mid in sorted(medicine_ids):
        # Build per-medicine donor expiry map
        per_med_expiry: dict[str, float] = {}
        if expiry_map:
            for (h_id, m_id), days in expiry_map.items():
                if m_id == mid:
                    prev = per_med_expiry.get(h_id, float("inf"))
                    per_med_expiry[h_id] = min(prev, days)

        transfers = run_redistribution(
            deficits          = pulp_input.get("deficits", []),
            surpluses         = pulp_input.get("surpluses", []),
            medicine_id       = mid,
            expiry_map        = per_med_expiry,
            use_osrm          = use_osrm,
            osrm_url          = osrm_url,
            expiry_buffer     = expiry_buffer,
            min_transfer_qty  = min_transfer_qty,
        )
        if transfers:
            results[mid] = transfers

    return results
