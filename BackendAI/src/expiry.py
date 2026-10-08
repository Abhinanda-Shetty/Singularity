"""
expiry.py - Expiry and wastage risk analysis.

Analyses medicine batches to identify:
    - Batches nearing expiry before they can be consumed (wastage risk)
    - Batches that have already expired
    - Surplus stock that should be redistributed before expiry

Expiry risk tiers
-----------------
    EXPIRED     - expiry date already passed
    CRITICAL    - expires within lead_time_days (unreachable before expiry)
    HIGH        - expires within wastage_horizon_days AND stock > forecast use
    MEDIUM      - expires within medium_horizon_days
    LOW         - adequate time remaining

Example usage
-------------
    from expiry import assess_expiry_risk, ExpiryRecord
    from datetime import date

    batches = [
        {
            "hospital_id": "H001",
            "medicine_id": 1001,
            "batch_id": "B2024-001",
            "batch_qty": 500,
            "expiry_date": "2024-02-15",
            "current_date": "2024-01-10",
            "predicted_daily_demand": 40.0,
            "lead_time_days": 7,
        }
    ]
    results = assess_expiry_risk(batches)
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from typing import Optional, Union

# -- Tier constants ------------------------------------------------------------

TIER_EXPIRED  = "EXPIRED"
TIER_CRITICAL = "CRITICAL"
TIER_HIGH     = "HIGH"
TIER_MEDIUM   = "MEDIUM"
TIER_LOW      = "LOW"

# Default horizon thresholds (days)
DEFAULT_WASTAGE_HORIZON:  int = 30   # flag HIGH if expires within 30 days and has surplus
DEFAULT_MEDIUM_HORIZON:   int = 60   # flag MEDIUM if expires within 60 days


# -- Helper --------------------------------------------------------------------

def _parse_date(value: Union[str, date, datetime]) -> date:
    """Parse a date value that may be a string, date, or datetime."""
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    # Try ISO format first, then common formats
    for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(str(value), fmt).date()
        except ValueError:
            continue
    raise ValueError(f"Cannot parse date: {value!r}")


# -- Data class ----------------------------------------------------------------

@dataclass
class ExpiryRecord:
    """
    Represents a single medicine batch's expiry risk assessment.
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

    # Batch info
    batch_id:           str   = ""
    batch_qty:          int   = 0
    expiry_date:        Optional[date] = None
    current_date:       Optional[date] = None

    # Demand context
    predicted_daily_demand: float = 0.0
    lead_time_days:     int   = 7

    # Computed
    days_until_expiry:  float = 0.0
    units_consumable_before_expiry: float = 0.0   # batch_qty - (daily * days_until_expiry)
    wastage_qty:        float = 0.0               # units that will expire unused
    risk_tier:          str   = TIER_LOW
    risk_score:         float = 0.0               # 0-100
    notes:              list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "hospital_id":              self.hospital_id,
            "hospital_name":            self.hospital_name,
            "medicine_id":              self.medicine_id,
            "medicine_name":            self.medicine_name,
            "medicine_category":        self.medicine_category,
            "region_type":              self.region_type,
            "latitude":                 self.latitude,
            "longitude":                self.longitude,
            "batch_id":                 self.batch_id,
            "batch_qty":                self.batch_qty,
            "expiry_date":              self.expiry_date.isoformat() if self.expiry_date else None,
            "current_date":             self.current_date.isoformat() if self.current_date else None,
            "days_until_expiry":        self.days_until_expiry,
            "predicted_daily_demand":   self.predicted_daily_demand,
            "units_consumable_before_expiry": self.units_consumable_before_expiry,
            "wastage_qty":              self.wastage_qty,
            "risk_tier":                self.risk_tier,
            "risk_score":               self.risk_score,
            "notes":                    self.notes,
        }

    @classmethod
    def from_batch(
        cls,
        batch: dict,
        wastage_horizon:  int = DEFAULT_WASTAGE_HORIZON,
        medium_horizon:   int = DEFAULT_MEDIUM_HORIZON,
    ) -> "ExpiryRecord":
        """
        Build an ExpiryRecord from a batch dict.

        Required keys in ``batch``:
            hospital_id, medicine_id, batch_id, batch_qty,
            expiry_date, predicted_daily_demand

        Optional keys:
            hospital_name, medicine_name, medicine_category,
            region_type, latitude, longitude,
            current_date (defaults to today), lead_time_days
        """
        today = date.today()
        rec = cls(
            hospital_id             = str(batch.get("hospital_id", "")),
            hospital_name           = str(batch.get("hospital_name", "")),
            medicine_id             = int(batch.get("medicine_id", 0)),
            medicine_name           = str(batch.get("medicine_name", "")),
            medicine_category       = str(batch.get("medicine_category", "")),
            region_type             = str(batch.get("region_type", "")),
            latitude                = float(batch.get("latitude", 0.0)),
            longitude               = float(batch.get("longitude", 0.0)),
            batch_id                = str(batch.get("batch_id", "")),
            batch_qty               = int(batch.get("batch_qty", 0)),
            expiry_date             = _parse_date(batch["expiry_date"]),
            current_date            = _parse_date(batch.get("current_date", today)),
            predicted_daily_demand  = float(batch.get("predicted_daily_demand", 0.0)),
            lead_time_days          = int(batch.get("lead_time_days", 7)),
        )
        rec._compute(wastage_horizon=wastage_horizon, medium_horizon=medium_horizon)
        return rec

    # -- Internal computation -------------------------------------------------

    def _compute(self, wastage_horizon: int, medium_horizon: int) -> None:
        """Populate expiry metrics, risk tier, and risk score."""
        assert self.expiry_date is not None
        assert self.current_date is not None

        delta = (self.expiry_date - self.current_date).days
        self.days_until_expiry = float(delta)

        daily = max(self.predicted_daily_demand, 0.0)

        # Units that can realistically be consumed before expiry
        self.units_consumable_before_expiry = min(
            self.batch_qty,
            max(0.0, daily * max(delta, 0))
        )
        self.wastage_qty = max(0.0, self.batch_qty - self.units_consumable_before_expiry)

        # -- Tier ---------------------------------------------------------
        if delta < 0:
            self.risk_tier = TIER_EXPIRED
        elif delta <= self.lead_time_days:
            self.risk_tier = TIER_CRITICAL
        elif delta <= wastage_horizon and self.wastage_qty > 0:
            self.risk_tier = TIER_HIGH
        elif delta <= medium_horizon:
            self.risk_tier = TIER_MEDIUM
        else:
            self.risk_tier = TIER_LOW

        # -- Risk score 0-100 ----------------------------------------------
        # Urgency from time remaining (0 when > medium_horizon, 1 when expired)
        time_urgency = max(0.0, 1.0 - delta / max(medium_horizon, 1))
        # Wastage ratio (what fraction of the batch will expire unused)
        waste_ratio  = self.wastage_qty / max(self.batch_qty, 1)
        self.risk_score = round(min(100.0, (time_urgency * 50) + (waste_ratio * 50)), 2)

        if self.risk_tier == TIER_EXPIRED:
            self.risk_score = 100.0
        elif self.risk_tier == TIER_CRITICAL:
            self.risk_score = max(self.risk_score, 80.0)
        elif self.risk_tier == TIER_HIGH:
            self.risk_score = max(self.risk_score, 55.0)

        # -- Notes ---------------------------------------------------------
        if self.risk_tier == TIER_EXPIRED:
            self.notes.append(f"🚫 Batch {self.batch_id} EXPIRED {abs(delta)} days ago.")
        elif self.risk_tier == TIER_CRITICAL:
            self.notes.append(
                f"⚠ Batch {self.batch_id} expires in {delta} d - within lead time ({self.lead_time_days} d)."
            )
        if self.wastage_qty > 0:
            self.notes.append(
                f"{self.wastage_qty:.0f} units of {self.medicine_name} at risk of expiry wastage."
            )
            self.notes.append(
                "Consider redistribution to a facility with higher demand before expiry."
            )


# -- Public API ----------------------------------------------------------------

def assess_expiry_risk(
    batches: list[dict],
    wastage_horizon:  int = DEFAULT_WASTAGE_HORIZON,
    medium_horizon:   int = DEFAULT_MEDIUM_HORIZON,
) -> list[ExpiryRecord]:
    """
    Assess expiry / wastage risk for a list of batch dicts.

    Parameters
    ----------
    batches : list[dict]
        Each dict must include at minimum:
            hospital_id, medicine_id, batch_id, batch_qty,
            expiry_date, predicted_daily_demand
    wastage_horizon : int
        Days threshold for HIGH tier (batch expires AND has surplus).
    medium_horizon : int
        Days threshold for MEDIUM tier.

    Returns
    -------
    list[ExpiryRecord]
        Sorted by risk_score descending.
    """
    results: list[ExpiryRecord] = []
    for b in batches:
        rec = ExpiryRecord.from_batch(
            b,
            wastage_horizon=wastage_horizon,
            medium_horizon=medium_horizon,
        )
        results.append(rec)

    results.sort(key=lambda r: r.risk_score, reverse=True)
    return results


def merge_expiry_into_forecast(
    forecast_records: list[dict],
    expiry_records:   list[ExpiryRecord],
) -> list[dict]:
    """
    Attach the worst expiry risk tier / score to each forecast record.

    The join key is (hospital_id, medicine_id).
    If a forecast record has multiple batches, the WORST (highest score) tier wins.

    Parameters
    ----------
    forecast_records : list[dict]
        Output of forecasting.forecast_demand().
    expiry_records : list[ExpiryRecord]
        Output of assess_expiry_risk().

    Returns
    -------
    list[dict]
        Forecast records enriched with ``expiry_risk_tier`` and ``expiry_risk_score``.
    """
    # Build lookup: (hospital_id, medicine_id) -> worst ExpiryRecord
    lookup: dict[tuple, ExpiryRecord] = {}
    for er in expiry_records:
        key = (er.hospital_id, er.medicine_id)
        if key not in lookup or er.risk_score > lookup[key].risk_score:
            lookup[key] = er

    enriched = []
    for fc in forecast_records:
        key = (str(fc.get("hospital_id", "")), int(fc.get("medicine_id", 0)))
        er  = lookup.get(key)
        fc  = dict(fc)
        fc["expiry_risk_tier"]       = er.risk_tier  if er else TIER_LOW
        fc["expiry_risk_score"]      = er.risk_score if er else 0.0
        fc["expiry_wastage_qty"]     = er.wastage_qty if er else 0.0
        fc["expiry_days_remaining"]  = er.days_until_expiry if er else 9999.0
        enriched.append(fc)

    return enriched


def summarise_expiry(expiry_records: list[ExpiryRecord]) -> dict:
    """
    Aggregate expiry risk across all assessed batches.
    """
    tier_counts    = {TIER_EXPIRED: 0, TIER_CRITICAL: 0, TIER_HIGH: 0,
                      TIER_MEDIUM: 0, TIER_LOW: 0}
    total_wastage  = 0.0
    at_risk_batches = []

    for r in expiry_records:
        tier_counts[r.risk_tier] += 1
        total_wastage += r.wastage_qty
        if r.risk_tier in (TIER_EXPIRED, TIER_CRITICAL, TIER_HIGH):
            at_risk_batches.append({
                "hospital_id":       r.hospital_id,
                "medicine_id":       r.medicine_id,
                "batch_id":          r.batch_id,
                "risk_tier":         r.risk_tier,
                "days_until_expiry": r.days_until_expiry,
                "wastage_qty":       r.wastage_qty,
                "risk_score":        r.risk_score,
            })

    return {
        "tier_counts":         tier_counts,
        "total_wastage_units": round(total_wastage, 2),
        "at_risk_batches":     at_risk_batches,
        "batches_assessed":    len(expiry_records),
    }
