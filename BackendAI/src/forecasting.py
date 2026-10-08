"""
forecasting.py - High-level forecasting API.

Provides a single entry-point function `forecast_demand()` that:
  1. Loads the trained model.pkl
  2. Accepts a list of hospital-medicine records (dicts or a DataFrame)
  3. Returns structured forecast records ready for the PuLP redistribution engine

Example usage:
    from forecasting import forecast_demand
    records = [{"hospital_id": "H001", "medicine_id": 1001, ...}]
    forecasts = forecast_demand(records)
    # forecasts[0] -> {"hospital_id": "H001", "predicted_future_demand": 420, ...}
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from typing import Union
import numpy as np
import pandas as pd
import joblib

from features import add_time_features, ALL_FEATURES
from predict import load_model, calculate_stockout

ROOT       = Path(__file__).parent.parent
MODEL_PATH = ROOT / "models" / "model.pkl"

# Cache the loaded pipeline so repeated calls don't re-read from disk
_PIPELINE_CACHE = None


def _get_pipeline():
    """Return the cached pipeline, loading it on first call."""
    global _PIPELINE_CACHE
    if _PIPELINE_CACHE is None:
        _PIPELINE_CACHE = load_model(MODEL_PATH)
    return _PIPELINE_CACHE


def forecast_demand(
    records: Union[list[dict], pd.DataFrame],
    days_per_period: int = 7,
) -> list[dict]:
    """
    Predict future demand for a set of hospital-medicine records.

    Parameters
    ----------
    records : list[dict] or pd.DataFrame
        Each record must include the feature columns expected by the model.
        See features.ALL_FEATURES for the complete list.
    days_per_period : int
        Number of days in the demand horizon (default 7 = weekly forecast).

    Returns
    -------
    list[dict]
        Structured forecast records suitable for PuLP redistribution:
        {
            "hospital_id"              : str,
            "medicine_id"              : int,
            "predicted_future_demand"  : float,
            "predicted_daily_demand"   : float,
            "current_stock"            : int,
            "safety_stock"             : int,
            "days_to_stockout"         : float,
        }
    """
    if isinstance(records, list):
        df = pd.DataFrame(records)
    else:
        df = records.copy()

    df = add_time_features(df, date_col="date")
    X  = df[ALL_FEATURES]

    pipeline = _get_pipeline()
    raw_pred = pipeline.predict(X)
    predicted_future_demand = np.maximum(raw_pred, 0.0)

    predicted_daily_demand, days_to_stockout = calculate_stockout(
        current_stock=df["current_stock"].values,
        predicted_future_demand=predicted_future_demand,
        days_per_period=days_per_period,
    )

    output = []
    for i in range(len(df)):
        output.append({
            "hospital_id":              str(df.iloc[i]["hospital_id"]),
            "hospital_name":            str(df.iloc[i].get("hospital_name", "")),
            "medicine_id":              int(df.iloc[i]["medicine_id"]),
            "medicine_name":            str(df.iloc[i].get("medicine_name", "")),
            "medicine_category":        str(df.iloc[i].get("medicine_category", "")),
            "region_type":              str(df.iloc[i].get("region_type", "")),
            "latitude":                 float(df.iloc[i].get("latitude", 0)),
            "longitude":                float(df.iloc[i].get("longitude", 0)),
            "current_stock":            int(df.iloc[i]["current_stock"]),
            "safety_stock":             int(df.iloc[i]["safety_stock"]),
            "predicted_future_demand":  round(float(predicted_future_demand[i]), 2),
            "predicted_daily_demand":   round(float(predicted_daily_demand[i]), 2),
            "days_to_stockout":         round(float(days_to_stockout[i]), 2),
        })

    return output


# -- Stub: PuLP integration interface -----------------------------------------

def to_pulp_input(forecast_records: list[dict]) -> dict:
    """
    Convert forecast output to a structured dict consumable by the PuLP
    redistribution optimizer.

    This is a minimal stub - the PuLP engine is not yet implemented.

    Returns
    -------
    dict with keys:
        "hospitals"   : list of unique hospital IDs
        "medicines"   : list of unique medicine IDs
        "forecasts"   : the raw forecast records
        "deficits"    : records where days_to_stockout < safety horizon
        "surpluses"   : records with excess stock above safety stock + forecast
    """
    SAFETY_HORIZON_DAYS = 7  # flag as deficit if stockout < 7 days

    deficits  = [r for r in forecast_records if r["days_to_stockout"] < SAFETY_HORIZON_DAYS]
    surpluses = [
        r for r in forecast_records
        if r["current_stock"] > r["safety_stock"] + r["predicted_future_demand"]
    ]

    return {
        "hospitals": list({r["hospital_id"] for r in forecast_records}),
        "medicines": list({r["medicine_id"] for r in forecast_records}),
        "forecasts": forecast_records,
        "deficits":  deficits,
        "surpluses": surpluses,
    }
