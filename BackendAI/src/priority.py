"""
priority.py - Priority Engine for deficit hospital-medicine pairs.

Determines which deficit (shortage) situations should be addressed first,
combining multiple clinical and operational signals into a single
priority score (0-100, higher = more urgent).

Scoring factors
---------------
1. Stock-out urgency    - days_to_stockout relative to lead time / safety horizon
2. Patient load         - normalised patient_load
3. Emergency demand     - emergency_demand present or predicted
4. Outbreak indicator   - active outbreak boosts priority
5. Medicine criticality - life-critical medicines rank higher (configurable)
6. Region type          - remote/rural facilities get a small boost (last-mile)
7. Expiry risk          - nearby expiry in a surplus donor raises urgency to act fast

Each factor contributes a weighted sub-score; the final score is the
weighted sum clamped to [0, 100].

Example usage
-------------
    from priority import score_deficits, PriorityRecord
    from stockout import assess_stockout_risk, RISK_CRITICAL, RISK_HIGH

    risk_records = assess_stockout_risk(forecasts)
    deficits = [r for r in risk_records if r.risk_tier in (RISK_CRITICAL, RISK_HIGH)]
    prioritised = score_deficits([r.to_dict() for r in deficits])
    for p in prioritised[:5]:
        print(p)
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

# -- Default criticality map ---------------------------------------------------
# Medicine categories considered life-critical; score multiplier applied.
# Extend or override at runtime via the `criticality_map` parameter.

DEFAULT_CRITICAL_CATEGORIES: set[str] = {
    "Antibiotic",
    "Antidiabetic",
    "Antihypertensive",
    "Anticoagulant",
    "Cardiac",
    "Anticonvulsant",
    "Insulin",
    "Oncology",
    "Antifungal",
    "Emergency",
}

# -- Region boost map ----------------------------------------------------------
# Remote / rural facilities receive a small last-mile urgency boost.

REGION_BOOST: dict[str, float] = {
    "rural":      8.0,
    "semi-urban": 4.0,
    "urban":      0.0,
}

# -- Factor weights (sum to 100) -----------------------------------------------

WEIGHTS = {
    "stockout_urgency":   35.0,
    "patient_load":       20.0,
    "emergency_demand":   15.0,
    "outbreak":           10.0,
    "criticality":        10.0,
    "region":              5.0,
    "expiry_donor":        5.0,
}

# Sanity check
assert abs(sum(WEIGHTS.values()) - 100.0) < 1e-6, "Priority weights must sum to 100"


# -- Data class ----------------------------------------------------------------

@dataclass
class PriorityRecord:
    """
    A deficit record enriched with a priority score and factor breakdown.
    """

    # Identity
    hospital_id:        str   = ""
    hospital_name:      str   = ""
    medicine_id:        int   = 0
    medicine_name:      str   = ""
    medicine_category:  str   = ""
    region_type:        str   = ""
    latitude:           float = 0.0
    longitude:          float = 0.0

    # Inventory / forecast
    current_stock:              int   = 0
    safety_stock:               int   = 0
    predicted_future_demand:    float = 0.0
    predicted_daily_demand:     float = 0.0
    days_to_stockout:           float = 0.0
    shortage_quantity:          float = 0.0
    lead_time_days:             int   = 7

    # Clinical signals (raw)
    patient_load:       int   = 0
    emergency_demand:   int   = 0
    outbreak_indicator: int   = 0

    # Expiry context from surplus donors (optional)
    donor_expiry_days:  float = 9999.0   # smallest days_until_expiry among donors

    # Priority output
    priority_score:     float = 0.0      # 0-100
    score_breakdown:    dict  = field(default_factory=dict)
    priority_rank:      int   = 0        # set by score_deficits()
    is_critical_medicine: bool = False
    notes:              list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "priority_rank":            self.priority_rank,
            "hospital_id":              self.hospital_id,
            "hospital_name":            self.hospital_name,
            "medicine_id":              self.medicine_id,
            "medicine_name":            self.medicine_name,
            "medicine_category":        self.medicine_category,
            "region_type":              self.region_type,
            "latitude":                 self.latitude,
            "longitude":                self.longitude,
            "current_stock":            self.current_stock,
            "safety_stock":             self.safety_stock,
            "predicted_future_demand":  self.predicted_future_demand,
            "predicted_daily_demand":   self.predicted_daily_demand,
            "days_to_stockout":         self.days_to_stockout,
            "shortage_quantity":        self.shortage_quantity,
            "lead_time_days":           self.lead_time_days,
            "patient_load":             self.patient_load,
            "emergency_demand":         self.emergency_demand,
            "outbreak_indicator":       self.outbreak_indicator,
            "donor_expiry_days":        self.donor_expiry_days,
            "is_critical_medicine":     self.is_critical_medicine,
            "priority_score":           self.priority_score,
            "score_breakdown":          self.score_breakdown,
            "notes":                    self.notes,
        }


# -- Scoring logic -------------------------------------------------------------

def _score_stockout_urgency(
    days_to_stockout: float,
    lead_time_days:   int,
    safety_horizon:   int = 14,
) -> float:
    """
    Urgency sub-score [0-1] based on how close the stock-out is.
    1.0 if already out / within lead time; 0.0 if > 2× safety horizon.
    """
    max_days = safety_horizon * 2
    if days_to_stockout <= 0:
        return 1.0
    if days_to_stockout <= lead_time_days:
        return 0.95
    if days_to_stockout <= safety_horizon:
        return 0.5 + 0.45 * (1.0 - days_to_stockout / safety_horizon)
    return max(0.0, 1.0 - days_to_stockout / max_days)


def _score_patient_load(patient_load: int, max_observed: int = 400) -> float:
    """Normalise patient_load to [0-1]."""
    return min(1.0, patient_load / max(max_observed, 1))


def _score_emergency(emergency_demand: int, daily_demand: float) -> float:
    """High emergency demand relative to daily forecast -> higher sub-score."""
    if daily_demand <= 0:
        return 1.0 if emergency_demand > 0 else 0.0
    ratio = emergency_demand / daily_demand
    return min(1.0, ratio * 0.5)


def _score_outbreak(outbreak_indicator: int) -> float:
    return 1.0 if outbreak_indicator else 0.0


def _score_criticality(medicine_category: str, critical_categories: set[str]) -> float:
    return 1.0 if medicine_category in critical_categories else 0.3


def _score_region(region_type: str) -> float:
    return REGION_BOOST.get(region_type.lower(), 0.0) / 10.0   # normalise to [0-1]


def _score_donor_expiry(donor_expiry_days: float, wastage_horizon: int = 30) -> float:
    """
    Higher sub-score when a potential donor's batch is close to expiry -
    urgency to act before that stock also becomes wastage.
    """
    if donor_expiry_days >= wastage_horizon:
        return 0.0
    return max(0.0, 1.0 - donor_expiry_days / wastage_horizon)


def _compute_priority_score(
    rec: PriorityRecord,
    critical_categories: set[str],
    safety_horizon: int,
    wastage_horizon: int,
    max_patient_load: int,
) -> tuple[float, dict]:
    """Return (priority_score, score_breakdown dict)."""

    sub: dict[str, float] = {
        "stockout_urgency": _score_stockout_urgency(
            rec.days_to_stockout, rec.lead_time_days, safety_horizon),
        "patient_load":     _score_patient_load(rec.patient_load, max_patient_load),
        "emergency_demand": _score_emergency(rec.emergency_demand, rec.predicted_daily_demand),
        "outbreak":         _score_outbreak(rec.outbreak_indicator),
        "criticality":      _score_criticality(rec.medicine_category, critical_categories),
        "region":           _score_region(rec.region_type),
        "expiry_donor":     _score_donor_expiry(rec.donor_expiry_days, wastage_horizon),
    }

    score = sum(sub[k] * WEIGHTS[k] for k in WEIGHTS)
    score = round(min(100.0, score), 2)

    # Scale breakdown to contribution in final score
    breakdown = {k: round(sub[k] * WEIGHTS[k], 2) for k in WEIGHTS}
    return score, breakdown


# -- Public API ----------------------------------------------------------------

def score_deficits(
    deficit_records: list[dict],
    critical_categories:  Optional[set[str]] = None,
    safety_horizon:       int = 14,
    wastage_horizon:      int = 30,
    max_patient_load:     int = 400,
    donor_expiry_lookup:  Optional[dict] = None,
) -> list[PriorityRecord]:
    """
    Score and rank deficit records by clinical and operational urgency.

    Parameters
    ----------
    deficit_records : list[dict]
        Deficit records - either StockoutRecord.to_dict() items or enriched
        forecast records.  Expected keys include those in StockoutRecord.to_dict().
    critical_categories : set[str], optional
        Medicine categories considered life-critical.
        Defaults to DEFAULT_CRITICAL_CATEGORIES.
    safety_horizon : int
        Days threshold for stockout urgency scoring.
    wastage_horizon : int
        Days threshold used to score donor-expiry urgency.
    max_patient_load : int
        Normalisation ceiling for patient_load.
    donor_expiry_lookup : dict, optional
        ``{(hospital_id, medicine_id): min_donor_expiry_days}``
        Pre-computed from expiry analysis of surplus hospitals.

    Returns
    -------
    list[PriorityRecord]
        Sorted descending by priority_score.  ``priority_rank`` is 1-indexed.
    """
    cats    = critical_categories or DEFAULT_CRITICAL_CATEGORIES
    lookup  = donor_expiry_lookup or {}
    results: list[PriorityRecord] = []

    for raw in deficit_records:
        h_id = str(raw.get("hospital_id", ""))
        m_id = int(raw.get("medicine_id", 0))

        rec = PriorityRecord(
            hospital_id              = h_id,
            hospital_name            = str(raw.get("hospital_name", "")),
            medicine_id              = m_id,
            medicine_name            = str(raw.get("medicine_name", "")),
            medicine_category        = str(raw.get("medicine_category", "")),
            region_type              = str(raw.get("region_type", "")),
            latitude                 = float(raw.get("latitude", 0.0)),
            longitude                = float(raw.get("longitude", 0.0)),
            current_stock            = int(raw.get("current_stock", 0)),
            safety_stock             = int(raw.get("safety_stock", 0)),
            predicted_future_demand  = float(raw.get("predicted_future_demand", 0.0)),
            predicted_daily_demand   = float(raw.get("predicted_daily_demand", 1.0)),
            days_to_stockout         = float(raw.get("days_to_stockout", 9999.0)),
            shortage_quantity        = float(raw.get("shortage_quantity", 0.0)),
            lead_time_days           = int(raw.get("lead_time_days", 7)),
            patient_load             = int(raw.get("patient_load", 0)),
            emergency_demand         = int(raw.get("emergency_demand", 0)),
            outbreak_indicator       = int(raw.get("outbreak_indicator", 0)),
            donor_expiry_days        = float(
                lookup.get((h_id, m_id), raw.get("expiry_days_remaining", 9999.0))
            ),
        )
        rec.is_critical_medicine = rec.medicine_category in cats

        score, breakdown = _compute_priority_score(
            rec,
            critical_categories=cats,
            safety_horizon=safety_horizon,
            wastage_horizon=wastage_horizon,
            max_patient_load=max_patient_load,
        )
        rec.priority_score   = score
        rec.score_breakdown  = breakdown

        # Explanatory notes
        if rec.is_critical_medicine:
            rec.notes.append(f"🔴 Critical medicine category: {rec.medicine_category}.")
        if rec.outbreak_indicator:
            rec.notes.append("🦠 Active outbreak signal detected.")
        if rec.emergency_demand > 0:
            rec.notes.append(f"🚨 Emergency demand: {rec.emergency_demand} units.")
        if rec.region_type.lower() == "rural":
            rec.notes.append("📍 Rural facility - last-mile supply boost applied.")
        if rec.donor_expiry_days < wastage_horizon:
            rec.notes.append(
                f"⏳ Potential donor batch expires in {rec.donor_expiry_days:.0f} d - "
                "act before wastage."
            )

        results.append(rec)

    results.sort(key=lambda r: r.priority_score, reverse=True)
    for rank, r in enumerate(results, start=1):
        r.priority_rank = rank

    return results


def build_donor_expiry_lookup(expiry_records) -> dict:
    """
    Helper: build a ``{(hospital_id, medicine_id): min_days_until_expiry}``
    lookup from a list of ExpiryRecord objects (from expiry.py).

    Pass this as ``donor_expiry_lookup`` to ``score_deficits()`` so that
    deficits with an expiring donor get an extra urgency boost.
    """
    lookup: dict = {}
    for er in expiry_records:
        key = (er.hospital_id, er.medicine_id)
        existing = lookup.get(key, float("inf"))
        lookup[key] = min(existing, er.days_until_expiry)
    return lookup
