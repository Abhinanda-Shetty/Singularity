"""
api/main.py - FastAPI application for SINGULARITY Medical Supply Intelligence.

Endpoints
---------
GET  /                        - Health check
POST /forecast                - Demand forecasting (XGBoost)
POST /stockout                - Shortage / stockout risk assessment
POST /expiry                  - Expiry / wastage risk assessment
POST /priority                - Priority scoring for deficit records
POST /redistribute            - PuLP redistribution optimisation
POST /analyse                 - Full end-to-end pipeline (forecast -> stockout -> priority -> redistribute)
GET  /model/info              - Model metadata

Run locally
-----------
    uvicorn api.main:app --reload --port 8000
    # or from BackendAI/ root:
    python -m uvicorn api.main:app --reload
"""

import sys
from pathlib import Path

# Make src/ importable regardless of working directory
_SRC = Path(__file__).parent.parent / "src"
sys.path.insert(0, str(_SRC))

import logging
from datetime import date
from typing import Any, Optional

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# -- Internal modules ----------------------------------------------------------
from forecasting  import forecast_demand, to_pulp_input
from stockout     import assess_stockout_risk, summarise_risk, RISK_CRITICAL, RISK_HIGH
from expiry       import assess_expiry_risk, summarise_expiry, merge_expiry_into_forecast
from priority     import score_deficits, build_donor_expiry_lookup
from optimizer    import run_redistribution_all_medicines, TransferRecommendation

# -- Logging -------------------------------------------------------------------
logging.basicConfig(level=logging.INFO)
log = logging.getLogger("singularity.api")

# -- App -----------------------------------------------------------------------
app = FastAPI(
    title="SINGULARITY - Medical Supply Intelligence API",
    description=(
        "AI-powered demand forecasting, shortage detection, expiry risk analysis, "
        "facility prioritisation, and PuLP redistribution optimisation for medical supplies."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# -- Pydantic schemas ----------------------------------------------------------

class HospitalMedicineRecord(BaseModel):
    """Single hospital-medicine observation used for forecasting."""

    date:               str   = Field(...,  example="2024-01-08")
    hospital_id:        str   = Field(...,  example="H001")
    hospital_name:      str   = Field("",   example="City General Hospital")
    region_type:        str   = Field("urban", example="urban")
    latitude:           float = Field(...,  example=12.9716)
    longitude:          float = Field(...,  example=77.5946)
    medicine_id:        int   = Field(...,  example=1001)
    medicine_name:      str   = Field("",   example="Paracetamol 500mg")
    medicine_category:  str   = Field("",   example="Analgesic")
    current_stock:      int   = Field(...,  example=800)
    safety_stock:       int   = Field(...,  example=120)
    consumption:        int   = Field(...,  example=320)
    patient_load:       int   = Field(...,  example=210)
    emergency_demand:   int   = Field(0,    example=50)
    outbreak_indicator: int   = Field(0,    example=0)
    lead_time_days:     int   = Field(7,    example=7)


class ForecastRequest(BaseModel):
    records:         list[HospitalMedicineRecord]
    days_per_period: int = Field(7, ge=1, description="Forecast horizon in days")


class BatchRecord(BaseModel):
    """A single medicine batch for expiry analysis."""

    hospital_id:           str   = Field(...,  example="H001")
    hospital_name:         str   = Field("",   example="City General Hospital")
    medicine_id:           int   = Field(...,  example=1001)
    medicine_name:         str   = Field("",   example="Paracetamol 500mg")
    medicine_category:     str   = Field("",   example="Analgesic")
    region_type:           str   = Field("",   example="urban")
    latitude:              float = Field(0.0,  example=12.9716)
    longitude:             float = Field(0.0,  example=77.5946)
    batch_id:              str   = Field(...,  example="B2024-001")
    batch_qty:             int   = Field(...,  example=500)
    expiry_date:           str   = Field(...,  example="2024-02-15")
    current_date:          Optional[str] = Field(None, example="2024-01-08")
    predicted_daily_demand: float = Field(0.0, example=40.0)
    lead_time_days:        int   = Field(7,    example=7)


class ExpiryRequest(BaseModel):
    batches:          list[BatchRecord]
    wastage_horizon:  int = Field(30, ge=1)
    medium_horizon:   int = Field(60, ge=1)


class StockoutRequest(BaseModel):
    forecast_records:        list[dict]
    lead_time_days_default:  int = Field(7, ge=1)
    safety_horizon:          int = Field(14, ge=1)


class PriorityRequest(BaseModel):
    deficit_records:      list[dict]
    safety_horizon:       int = Field(14, ge=1)
    wastage_horizon:      int = Field(30, ge=1)
    max_patient_load:     int = Field(400, ge=1)


class RedistributeRequest(BaseModel):
    deficits:         list[dict] = Field(..., description="Deficit records (PriorityRecord dicts)")
    surpluses:        list[dict] = Field(..., description="Surplus records (forecast dicts)")
    expiry_map:       Optional[dict] = Field(None, description="{hospital_id: days_until_expiry}")
    use_osrm:         bool  = Field(False)
    expiry_buffer:    float = Field(1.2, gt=1.0)
    min_transfer_qty: int   = Field(10, ge=1)


class AnalyseRequest(BaseModel):
    """Full end-to-end pipeline request."""

    records:            list[HospitalMedicineRecord]
    batches:            list[BatchRecord]     = Field(default_factory=list)
    days_per_period:    int   = Field(7,  ge=1)
    lead_time_days:     int   = Field(7,  ge=1)
    safety_horizon:     int   = Field(14, ge=1)
    wastage_horizon:    int   = Field(30, ge=1)
    max_patient_load:   int   = Field(400, ge=1)
    use_osrm:           bool  = Field(False)
    min_transfer_qty:   int   = Field(10, ge=1)


# -- Routes --------------------------------------------------------------------

@app.get("/", tags=["Health"])
def root():
    """Service health check."""
    return {
        "service": "SINGULARITY Medical Supply Intelligence API",
        "status":  "healthy",
        "version": "1.0.0",
    }


@app.get("/model/info", tags=["Model"])
def model_info():
    """Return metadata about the loaded XGBoost model."""
    from predict import load_model
    from features import ALL_FEATURES, TARGET

    root   = Path(__file__).parent.parent
    m_path = root / "models" / "model.pkl"

    if not m_path.exists():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "model.pkl not found. "
                "Train the model first with: python src/train.py"
            ),
        )
    try:
        pipeline = load_model(m_path)
        xgb      = pipeline.named_steps["model"]
        return {
            "model_type":    type(xgb).__name__,
            "n_estimators":  xgb.n_estimators,
            "max_depth":     xgb.max_depth,
            "learning_rate": xgb.learning_rate,
            "target":        TARGET,
            "features":      ALL_FEATURES,
            "model_path":    str(m_path),
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/forecast", tags=["Forecasting"])
def forecast(req: ForecastRequest):
    """
    Run XGBoost demand forecasting on a list of hospital-medicine records.

    Returns predicted_future_demand, predicted_daily_demand, and
    days_to_stockout for each record.
    """
    try:
        records   = [r.model_dump() for r in req.records]
        forecasts = forecast_demand(records, days_per_period=req.days_per_period)
        return {"count": len(forecasts), "forecasts": forecasts}
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        log.exception("Forecast error")
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/forecast/db", tags=["Forecasting"])
@app.post("/forecast/db", tags=["Forecasting"])
def forecast_from_database(
    hospital_id: Optional[int] = None,
    medicine_id: Optional[int] = None,
    days_per_period: int = 7,
):
    """
    Dynamically pulls input parameters directly from the database
    and runs the XGBoost prediction pipeline on live records.
    """
    from predict import predict_from_db
    try:
        results_df = predict_from_db(
            hospital_id=hospital_id,
            medicine_id=medicine_id,
            days_per_period=days_per_period,
        )
        records = results_df.to_dict(orient="records")
        return {
            "source": "database",
            "hospital_id": hospital_id,
            "medicine_id": medicine_id,
            "count": len(records),
            "forecasts": records,
        }
    except Exception as exc:
        log.exception("Forecast from database error")
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/stockout/db", tags=["Risk"])
@app.post("/stockout/db", tags=["Risk"])
def stockout_from_database(
    hospital_id: Optional[int] = None,
    medicine_id: Optional[int] = None,
    lead_time_days: int = 7,
    safety_horizon: int = 14,
):
    """
    Pulls live parameters from the database, forecasts future demand,
    and classifies stockout risk tiers.
    """
    from forecasting import forecast_from_db
    try:
        forecasts = forecast_from_db(hospital_id=hospital_id, medicine_id=medicine_id)
        risk_records = assess_stockout_risk(
            forecasts,
            lead_time_days_default=lead_time_days,
            safety_horizon=safety_horizon,
        )
        summary = summarise_risk(risk_records)
        return {
            "source": "database",
            "summary": summary,
            "risk_records": [r.to_dict() for r in risk_records],
        }
    except Exception as exc:
        log.exception("Stockout from database error")
        raise HTTPException(status_code=500, detail=str(exc))



@app.post("/stockout", tags=["Risk"])
def stockout(req: StockoutRequest):
    """
    Assess shortage / stock-out risk for forecast records.

    Accepts output from /forecast directly as ``forecast_records``.
    Returns risk-tier classification and shortage quantity per record.
    """
    try:
        risk_records = assess_stockout_risk(
            req.forecast_records,
            lead_time_days_default=req.lead_time_days_default,
            safety_horizon=req.safety_horizon,
        )
        summary = summarise_risk(risk_records)
        return {
            "summary":      summary,
            "risk_records": [r.to_dict() for r in risk_records],
        }
    except Exception as exc:
        log.exception("Stockout error")
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/expiry", tags=["Risk"])
def expiry(req: ExpiryRequest):
    """
    Assess expiry and wastage risk for medicine batches.

    Returns risk tier, days_until_expiry, and predicted wastage_qty per batch.
    """
    try:
        batches  = [b.model_dump() for b in req.batches]
        records  = assess_expiry_risk(
            batches,
            wastage_horizon=req.wastage_horizon,
            medium_horizon=req.medium_horizon,
        )
        summary  = summarise_expiry(records)
        return {
            "summary":        summary,
            "expiry_records": [r.to_dict() for r in records],
        }
    except Exception as exc:
        log.exception("Expiry error")
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/priority", tags=["Decision"])
def priority(req: PriorityRequest):
    """
    Score and rank deficit records by clinical and operational urgency.

    Accepts StockoutRecord dicts (from /stockout) filtered to deficits.
    Returns priority-ranked list with score_breakdown per record.
    """
    try:
        prioritised = score_deficits(
            req.deficit_records,
            safety_horizon=req.safety_horizon,
            wastage_horizon=req.wastage_horizon,
            max_patient_load=req.max_patient_load,
        )
        return {
            "count":    len(prioritised),
            "deficits": [r.to_dict() for r in prioritised],
        }
    except Exception as exc:
        log.exception("Priority error")
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/redistribute", tags=["Decision"])
def redistribute(req: RedistributeRequest):
    """
    Run PuLP redistribution optimisation across all medicines.

    Returns a map of medicine_id -> list of recommended transfers.
    """
    try:
        pulp_input = {
            "deficits":  req.deficits,
            "surpluses": req.surpluses,
        }
        result = run_redistribution_all_medicines(
            pulp_input        = pulp_input,
            expiry_map        = {
                tuple(k.split(",")): v   # expect "hospital_id,medicine_id" keys from JSON
                for k, v in (req.expiry_map or {}).items()
            } if req.expiry_map else None,
            use_osrm          = req.use_osrm,
            expiry_buffer     = req.expiry_buffer,
            min_transfer_qty  = req.min_transfer_qty,
        )
        serialised = {
            str(mid): [t.to_dict() for t in transfers]
            for mid, transfers in result.items()
        }
        total = sum(len(v) for v in result.values())
        return {"total_transfers": total, "transfers_by_medicine": serialised}
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        log.exception("Redistribute error")
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/analyse", tags=["Pipeline"])
def analyse(req: AnalyseRequest):
    """
    Full end-to-end pipeline:

    1. **Forecast** - XGBoost demand prediction
    2. **Expiry**   - batch wastage analysis (if batches provided)
    3. **Stockout** - shortage risk classification
    4. **Priority** - deficit urgency ranking
    5. **Redistribute** - PuLP transfer optimisation

    Returns a consolidated report with all intermediate outputs.
    """
    try:
        # 1. Forecast
        records   = [r.model_dump() for r in req.records]
        forecasts = forecast_demand(records, days_per_period=req.days_per_period)

        # 2. Expiry (optional)
        expiry_records  = []
        expiry_summary  = {}
        expiry_map: dict = {}

        if req.batches:
            batches        = [b.model_dump() for b in req.batches]
            expiry_records = assess_expiry_risk(
                batches,
                wastage_horizon=req.wastage_horizon,
            )
            expiry_summary = summarise_expiry(expiry_records)
            forecasts      = merge_expiry_into_forecast(forecasts, expiry_records)
            expiry_map     = build_donor_expiry_lookup(expiry_records)

        # 3. Stockout risk
        risk_records = assess_stockout_risk(
            forecasts,
            lead_time_days_default=req.lead_time_days,
            safety_horizon=req.safety_horizon,
        )
        risk_summary = summarise_risk(risk_records)

        # 4. Priority (deficits only)
        deficit_dicts = [
            r.to_dict() for r in risk_records
            if r.risk_tier in (RISK_CRITICAL, RISK_HIGH)
        ]
        # Attach patient_load / emergency signals from original records
        signal_map = {
            (str(r["hospital_id"]), int(r["medicine_id"])): r
            for r in records
        }
        for d in deficit_dicts:
            key = (d["hospital_id"], str(d["medicine_id"]))
            # Try both str and int key
            sig = signal_map.get(key) or signal_map.get(
                (d["hospital_id"], int(d["medicine_id"])), {}
            )
            d.setdefault("patient_load",       sig.get("patient_load", 0))
            d.setdefault("emergency_demand",   sig.get("emergency_demand", 0))
            d.setdefault("outbreak_indicator", sig.get("outbreak_indicator", 0))

        prioritised = score_deficits(
            deficit_dicts,
            safety_horizon=req.safety_horizon,
            wastage_horizon=req.wastage_horizon,
            max_patient_load=req.max_patient_load,
            donor_expiry_lookup={
                (h, m): days for (h, m), days in expiry_map.items()
            } if expiry_map else None,
        )

        # 5. Redistribute
        pulp_input = to_pulp_input(forecasts)
        transfers  = run_redistribution_all_medicines(
            pulp_input        = {
                "deficits":  [p.to_dict() for p in prioritised],
                "surpluses":  pulp_input["surpluses"],
            },
            expiry_map        = expiry_map or None,
            use_osrm          = req.use_osrm,
            min_transfer_qty  = req.min_transfer_qty,
        )

        serialised_transfers = {
            str(mid): [t.to_dict() for t in tlist]
            for mid, tlist in transfers.items()
        }
        total_transfers = sum(len(v) for v in transfers.values())

        return {
            "pipeline": "forecast -> expiry -> stockout -> priority -> redistribute",
            "forecast_count":     len(forecasts),
            "risk_summary":       risk_summary,
            "expiry_summary":     expiry_summary,
            "deficits_ranked":    [p.to_dict() for p in prioritised],
            "total_transfers":    total_transfers,
            "transfers_by_medicine": serialised_transfers,
        }

    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        log.exception("Analyse pipeline error")
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/analyse/db", tags=["Pipeline"])
@app.post("/analyse/db", tags=["Pipeline"])
def analyse_from_database(
    hospital_id: Optional[int] = None,
    days_per_period: int = 7,
    lead_time_days: int = 7,
    safety_horizon: int = 14,
    wastage_horizon: int = 30,
    max_patient_load: int = 400,
    min_transfer_qty: int = 10,
):
    """
    End-to-End Orchestration directly from live database parameters:
    1. Fetches live inventory & demand history from database.
    2. Runs XGBoost demand forecasting.
    3. Fetches live batches and evaluates expiry risks.
    4. Evaluates shortage / stockout risks.
    5. Prioritises deficits by urgency.
    6. Solves optimal PuLP transfers across hospitals.
    """
    from predict import fetch_records_from_db, fetch_batches_from_db
    try:
        df_records = fetch_records_from_db(hospital_id=hospital_id)
        raw_records = df_records.to_dict(orient="records")

        # 1. Forecast
        forecasts = forecast_demand(df_records, days_per_period=days_per_period)

        # 2. Expiry
        batches = fetch_batches_from_db(hospital_id=hospital_id)
        expiry_records = []
        expiry_summary = {}
        expiry_map = {}

        if batches:
            expiry_records = assess_expiry_risk(
                batches,
                wastage_horizon=wastage_horizon,
            )
            expiry_summary = summarise_expiry(expiry_records)
            forecasts = merge_expiry_into_forecast(forecasts, expiry_records)
            expiry_map = build_donor_expiry_lookup(expiry_records)

        # 3. Stockout
        risk_records = assess_stockout_risk(
            forecasts,
            lead_time_days_default=lead_time_days,
            safety_horizon=safety_horizon,
        )
        risk_summary = summarise_risk(risk_records)

        # 4. Priority
        deficit_dicts = [
            r.to_dict() for r in risk_records
            if r.risk_tier in (RISK_CRITICAL, RISK_HIGH)
        ]
        signal_map = {
            (str(r["hospital_id"]), int(r["medicine_id"])): r
            for r in raw_records
        }
        for d in deficit_dicts:
            sig = signal_map.get((d["hospital_id"], int(d["medicine_id"])), {})
            d.setdefault("patient_load", sig.get("patient_load", 0))
            d.setdefault("emergency_demand", sig.get("emergency_demand", 0))
            d.setdefault("outbreak_indicator", sig.get("outbreak_indicator", 0))

        prioritised = score_deficits(
            deficit_dicts,
            safety_horizon=safety_horizon,
            wastage_horizon=wastage_horizon,
            max_patient_load=max_patient_load,
            donor_expiry_lookup={
                (h, m): days for (h, m), days in expiry_map.items()
            } if expiry_map else None,
        )

        # 5. Redistribute
        pulp_input = to_pulp_input(forecasts)
        transfers = run_redistribution_all_medicines(
            pulp_input={
                "deficits": [p.to_dict() for p in prioritised],
                "surpluses": pulp_input["surpluses"],
            },
            expiry_map=expiry_map or None,
            use_osrm=False,
            min_transfer_qty=min_transfer_qty,
        )

        serialised_transfers = {
            str(mid): [t.to_dict() for t in tlist]
            for mid, tlist in transfers.items()
        }
        total_transfers = sum(len(v) for v in transfers.values())

        return {
            "source": "database",
            "hospital_id": hospital_id,
            "pipeline": "forecast -> expiry -> stockout -> priority -> redistribute",
            "forecast_count": len(forecasts),
            "forecasts": forecasts,
            "risk_summary": risk_summary,
            "risk_records": [r.to_dict() for r in risk_records],
            "expiry_summary": expiry_summary,
            "deficits_ranked": [p.to_dict() for p in prioritised],
            "total_transfers": total_transfers,
            "transfers_by_medicine": serialised_transfers,
        }
    except Exception as exc:
        log.exception("Analyse from database error")
        raise HTTPException(status_code=500, detail=str(exc))

