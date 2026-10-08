"""
stockout.py - Shortage and stock-out risk analysis.

Consumes the output of predict.py / forecasting.py and classifies every
hospital-medicine record into a risk tier:

    CRITICAL  - stock-out imminent (≤ lead_time_days or ≤ 3 days)
    HIGH      - stock-out likely within the safety horizon
    MEDIUM    - below safety stock, but stock-out not yet imminent
    LOW       - adequate stock relative to forecast demand

Example usage
-------------
    from stockout import assess_stockout_risk
    from forecasting import forecast_demand, to_pulp_input

    forecasts = forecast_demand(records)
    risk_records = assess_stockout_risk(forecasts, lead_time_days_col="lead_time_days")
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

# -- Risk tier constants ------------------------------------------------------

RISK_CRITICAL = "CRITICAL"
RISK_HIGH     = "HIGH"
RISK_MEDIUM   = "MEDIUM"
RISK_LOW      = "LOW"

# Default safety horizon (days).  Facilities with days_to_stockout below
# this threshold are flagged as HIGH even if not yet at lead_time boundary.
DEFAULT_SAFETY_HORIZON_DAYS: int = 14


# -- Data class ---------------------------------------------------------------

@dataclass
class StockoutRecord:
    """
    Enriched record that combines forecast output with shortage risk metadata.

    All numeric fields default to 0 / 0.0 so callers can build records
    incrementally; the `from_forecast` factory is the preferred constructor.
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

    # Inventory snapshot
    current_stock:      int   = 0
    safety_stock:       int   = 0
    lead_time_days:     int   = 7

    # Forecast outputs
    predicted_future_demand: float = 0.0
    predicted_daily_demand:  float = 0.0
    days_to_stockout:        float = 0.0

    # Shortage analysis
    stock_gap:          float = 0.0   # safety_stock + predicted_demand − current_stock
    risk_tier:          str   = RISK_LOW
    risk_score:         float = 0.0   # 0-100; higher = more urgent
    shortage_quantity:  float = 0.0   # units needed to reach safety_stock + forecast
    days_until_critical: float = 0.0  # days before stock drops to safety_stock

    # Optional extras
    notes: list[str] = field(default_factory=list)

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
            "current_stock":            self.current_stock,
            "safety_stock":             self.safety_stock,
            "lead_time_days":           self.lead_time_days,
            "predicted_future_demand":  self.predicted_future_demand,
            "predicted_daily_demand":   self.predicted_daily_demand,
            "days_to_stockout":         self.days_to_stockout,
            "stock_gap":                self.stock_gap,
            "shortage_quantity":        self.shortage_quantity,
            "days_until_critical":      self.days_until_critical,
            "risk_tier":                self.risk_tier,
            "risk_score":               self.risk_score,
            "notes":                    self.notes,
        }

    @classmethod
    def from_forecast(
        cls,
        forecast: dict,
        lead_time_days: int = 7,
        safety_horizon: int = DEFAULT_SAFETY_HORIZON_DAYS,
    ) -> "StockoutRecord":
        """Construct a StockoutRecord from a forecast dict (output of forecasting.py)."""
        rec = cls(
            hospital_id               = str(forecast.get("hospital_id", "")),
            hospital_name             = str(forecast.get("hospital_name", "")),
            medicine_id               = int(forecast.get("medicine_id", 0)),
            medicine_name             = str(forecast.get("medicine_name", "")),
            medicine_category         = str(forecast.get("medicine_category", "")),
            region_type               = str(forecast.get("region_type", "")),
            latitude                  = float(forecast.get("latitude", 0.0)),
            longitude                 = float(forecast.get("longitude", 0.0)),
            current_stock             = int(forecast.get("current_stock", 0)),
            safety_stock              = int(forecast.get("safety_stock", 0)),
            lead_time_days            = lead_time_days,
            predicted_future_demand   = float(forecast.get("predicted_future_demand", 0.0)),
            predicted_daily_demand    = float(forecast.get("predicted_daily_demand", 1.0)),
            days_to_stockout          = float(forecast.get("days_to_stockout", 9999.0)),
        )
        rec._compute_shortage_metrics(safety_horizon=safety_horizon)
        return rec

    # -- Internal computation -------------------------------------------------

    def _compute_shortage_metrics(self, safety_horizon: int) -> None:
        """Populate gap, shortage, risk tier, and risk score."""
        daily = max(self.predicted_daily_demand, 1.0)

        # Stock gap: how many units short of (safety_stock + forecast demand)
        required = self.safety_stock + self.predicted_future_demand
        self.stock_gap = required - self.current_stock
        self.shortage_quantity = max(0.0, self.stock_gap)

        # Days until stock hits safety_stock level
        usable_stock = max(0.0, self.current_stock - self.safety_stock)
        self.days_until_critical = usable_stock / daily

        # -- Risk tier classification --------------------------------------
        d = self.days_to_stockout

        if d <= self.lead_time_days or d <= 3:
            # Stock-out will arrive before a replenishment order can land
            self.risk_tier = RISK_CRITICAL
        elif d <= safety_horizon:
            self.risk_tier = RISK_HIGH
        elif self.current_stock < self.safety_stock:
            # Already below safety stock but not yet critically short
            self.risk_tier = RISK_MEDIUM
        else:
            self.risk_tier = RISK_LOW

        # -- Risk score 0-100 (higher = more urgent) -----------------------
        # Inversely proportional to days_to_stockout, clamped.
        urgency = max(0.0, 1.0 - d / max(safety_horizon * 2, 1))
        shortage_ratio = min(1.0, self.shortage_quantity / max(required, 1))
        self.risk_score = round(min(100.0, (urgency * 60) + (shortage_ratio * 40)), 2)

        # Tier overrides
        if self.risk_tier == RISK_CRITICAL:
            self.risk_score = max(self.risk_score, 75.0)
        elif self.risk_tier == RISK_HIGH:
            self.risk_score = max(self.risk_score, 50.0)

        # -- Explanatory notes --------------------------------------------
        if d <= 3:
            self.notes.append(f"⚠ Stock-out in {d:.1f} days - immediate action required.")
        elif d <= self.lead_time_days:
            self.notes.append(
                f"⚠ Stock-out ({d:.1f} d) arrives before lead time ({self.lead_time_days} d)."
            )
        if self.current_stock < self.safety_stock:
            self.notes.append(
                f"Below safety stock: {self.current_stock} < {self.safety_stock} units."
            )
        if self.shortage_quantity > 0:
            self.notes.append(
                f"Shortage: {self.shortage_quantity:.0f} units needed to meet forecast + safety stock."
            )


# -- Public API ---------------------------------------------------------------

def assess_stockout_risk(
    forecast_records: list[dict],
    lead_time_days_default: int = 7,
    safety_horizon: int = DEFAULT_SAFETY_HORIZON_DAYS,
    lead_time_lookup: Optional[dict] = None,
) -> list[StockoutRecord]:
    """
    Assess shortage/stock-out risk for a list of forecast records.

    Parameters
    ----------
    forecast_records : list[dict]
        Output of ``forecasting.forecast_demand()`` or ``predict.run_prediction()``.
    lead_time_days_default : int
        Default lead time (days) when not available per-record.
    safety_horizon : int
        Days threshold below which a record is flagged HIGH.
    lead_time_lookup : dict, optional
        ``{(hospital_id, medicine_id): lead_time_days}`` for per-item overrides.

    Returns
    -------
    list[StockoutRecord]
        Sorted by risk_score descending (most urgent first).
    """
    results: list[StockoutRecord] = []
    lookup = lead_time_lookup or {}

    for fc in forecast_records:
        h_id = str(fc.get("hospital_id", ""))
        m_id = int(fc.get("medicine_id", 0))
        lt   = lookup.get((h_id, m_id), lead_time_days_default)

        rec = StockoutRecord.from_forecast(fc, lead_time_days=lt, safety_horizon=safety_horizon)
        results.append(rec)

    results.sort(key=lambda r: r.risk_score, reverse=True)
    return results


def summarise_risk(risk_records: list[StockoutRecord]) -> dict:
    """
    Aggregate risk across all assessed records.

    Returns
    -------
    dict
        Counts per tier, total shortage units, list of CRITICAL/HIGH records.
    """
    tier_counts = {RISK_CRITICAL: 0, RISK_HIGH: 0, RISK_MEDIUM: 0, RISK_LOW: 0}
    total_shortage = 0.0
    critical_high  = []

    for r in risk_records:
        tier_counts[r.risk_tier] += 1
        total_shortage += r.shortage_quantity
        if r.risk_tier in (RISK_CRITICAL, RISK_HIGH):
            critical_high.append({
                "hospital_id":   r.hospital_id,
                "medicine_id":   r.medicine_id,
                "risk_tier":     r.risk_tier,
                "risk_score":    r.risk_score,
                "days_to_stockout": r.days_to_stockout,
                "shortage_quantity": r.shortage_quantity,
            })

    return {
        "tier_counts":       tier_counts,
        "total_shortage":    round(total_shortage, 2),
        "critical_high":     critical_high,
        "records_assessed":  len(risk_records),
    }
