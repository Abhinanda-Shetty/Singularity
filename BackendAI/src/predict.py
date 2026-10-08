"""
predict.py - Inference using the saved model.pkl.

Usage:
    python src/predict.py --from-db                  # fetch input parameters from live database
    python src/predict.py --from-db --hospital-id 1  # predict for hospital 1 from live database
    python src/predict.py                            # uses default new_records.csv
    python src/predict.py --input path/to/file.csv   # custom input CSV

Outputs:
    data/predictions.csv  - structured predictions ready for PuLP integration
"""
import sys
import os
import json
import argparse
import urllib.request
import urllib.error
from pathlib import Path
from datetime import date
from typing import Optional

# Allow imports from src/ regardless of working directory
sys.path.insert(0, str(Path(__file__).parent))

import numpy as np
import pandas as pd
import joblib
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from features import add_time_features, ALL_FEATURES, TARGET

# -- Paths --------------------------------------------------------------------
ROOT          = Path(__file__).parent.parent
MODEL_PATH    = ROOT / "models" / "model.pkl"
DEFAULT_INPUT = ROOT / "data" / "medical_demand_training_90.csv"
DEFAULT_OUTPUT = ROOT / "data" / "predictions.csv"


def load_env_vars() -> dict:
    """Load environment variables from Backend/.env or BackendAI/.env if present."""
    env = dict(os.environ)
    possible_env_paths = [
        ROOT.parent / "Backend" / ".env",
        ROOT / ".env",
        ROOT.parent / ".env",
    ]
    for p in possible_env_paths:
        if p.exists():
            try:
                with open(p, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            env.setdefault(k.strip(), v.strip().strip("'\""))
            except Exception:
                pass
    return env


def load_model(model_path: Path):
    """Load the fitted sklearn Pipeline from disk."""
    if not model_path.exists():
        raise FileNotFoundError(
            f"Model not found: {model_path}\n"
            "Please run:  python src/train.py  first."
        )
    pipeline = joblib.load(model_path)
    return pipeline


def http_get_json(url: str, headers: Optional[dict] = None) -> Optional[dict]:
    """Helper to fetch JSON over HTTP."""
    try:
        req = urllib.request.Request(url, headers=headers or {})
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status == 200:
                return json.loads(response.read().decode("utf-8"))
    except Exception:
        return None
    return None


def fetch_records_from_db(hospital_id: Optional[int] = None, medicine_id: Optional[int] = None) -> pd.DataFrame:
    """
    Fetch live inventory, hospital, medicine, and demand history parameters
    from the database (via Backend REST API or Supabase Cloud) to build
    the input feature DataFrame for ML prediction.
    """
    env = load_env_vars()
    backend_url = env.get("BACKEND_URL", "http://localhost:3000/api")
    supabase_url = env.get("SUPABASE_URL", "")
    supabase_key = env.get("SUPABASE_SECRET_KEY") or env.get("SUPABASE_PUBLISHABLE_KEY") or ""

    records = []

    # 1. Attempt fetching from Backend REST API
    inv_data = http_get_json(f"{backend_url}/inventory?limit=200")
    if inv_data and inv_data.get("success") and inv_data.get("data"):
        raw_inventory = inv_data["data"]
        if hospital_id is not None:
            raw_inventory = [i for i in raw_inventory if i.get("hospital_id") == hospital_id]
        if medicine_id is not None:
            raw_inventory = [i for i in raw_inventory if i.get("medicine_id") == medicine_id]

        # Fetch live hospital details
        hosp_data = http_get_json(f"{backend_url}/hospitals?limit=100")
        hosp_map = {}
        if hosp_data and hosp_data.get("data"):
            for h in hosp_data["data"]:
                hosp_map[h.get("id")] = h

        # Fetch demand history for baseline consumption
        dh_data = http_get_json(f"{backend_url}/demand-history?limit=200")
        demand_map = {}
        if dh_data and dh_data.get("data"):
            for d in dh_data["data"]:
                key = (d.get("hospital_id"), d.get("medicine_id"))
                demand_map.setdefault(key, []).append(float(d.get("consumption", 30)))

        today_str = date.today().isoformat()

        for item in raw_inventory:
            hid = item.get("hospital_id", 1)
            mid = item.get("medicine_id", 1)
            h_info = hosp_map.get(hid, {})

            recent_consumptions = demand_map.get((hid, mid), [35.0])
            avg_consumption = sum(recent_consumptions) / len(recent_consumptions)

            records.append({
                "date": today_str,
                "hospital_id": f"H{hid:03d}",
                "hospital_name": item.get("hospital_name") or h_info.get("name", f"Hospital {hid}"),
                "region_type": h_info.get("type", "urban"),
                "latitude": float(h_info.get("latitude") or 19.0760),
                "longitude": float(h_info.get("longitude") or 72.8777),
                "medicine_id": mid,
                "medicine_name": item.get("medicine_name", f"Medicine {mid}"),
                "medicine_category": item.get("medicine_category", "General"),
                "current_stock": float(item.get("quantity", 0)),
                "safety_stock": float(item.get("safety_stock", 0)),
                "consumption": round(avg_consumption, 2),
                "patient_load": int(h_info.get("patient_capacity") or 180),
                "emergency_demand": 5,
                "outbreak_indicator": 0,
                "lead_time_days": 7,
            })

    # 2. Attempt fetching from Supabase Cloud API directly if Backend API was unreachable
    elif supabase_url and supabase_key:
        headers = {
            "apikey": supabase_key,
            "Authorization": f"Bearer {supabase_key}",
        }
        sb_inv = http_get_json(f"{supabase_url}/rest/v1/inventory?select=*", headers=headers)
        sb_hosp = http_get_json(f"{supabase_url}/rest/v1/hospitals?select=*", headers=headers)
        sb_meds = http_get_json(f"{supabase_url}/rest/v1/medicines?select=*", headers=headers)

        if sb_inv and isinstance(sb_inv, list):
            hosp_lookup = {h["id"]: h for h in (sb_hosp or [])}
            med_lookup = {m["id"]: m for m in (sb_meds or [])}

            if hospital_id is not None:
                sb_inv = [i for i in sb_inv if i.get("hospital_id") == hospital_id]
            if medicine_id is not None:
                sb_inv = [i for i in sb_inv if i.get("medicine_id") == medicine_id]

            today_str = date.today().isoformat()
            for item in sb_inv:
                hid = item.get("hospital_id")
                mid = item.get("medicine_id")
                h = hosp_lookup.get(hid, {})
                m = med_lookup.get(mid, {})

                records.append({
                    "date": today_str,
                    "hospital_id": f"H{hid:03d}",
                    "hospital_name": h.get("name", f"Hospital {hid}"),
                    "region_type": h.get("type", "urban"),
                    "latitude": float(h.get("latitude") or 19.0760),
                    "longitude": float(h.get("longitude") or 72.8777),
                    "medicine_id": mid,
                    "medicine_name": m.get("name", f"Medicine {mid}"),
                    "medicine_category": m.get("category", "General"),
                    "current_stock": float(item.get("quantity", 0)),
                    "safety_stock": float(item.get("safety_stock", 0)),
                    "consumption": 35.0,
                    "patient_load": int(h.get("patient_capacity") or 180),
                    "emergency_demand": 5,
                    "outbreak_indicator": 0,
                    "lead_time_days": 7,
                })

    if not records:
        print("[predict.py] Database query yielded 0 records or connection was unavailable.")
        print(f"[predict.py] Falling back to default training baseline at {DEFAULT_INPUT}...")
        return load_input(DEFAULT_INPUT)

    df = pd.DataFrame(records)
    print(f"[predict.py] Successfully constructed {len(df)} live feature rows from database parameters.")
    return df


def fetch_batches_from_db(hospital_id: Optional[int] = None) -> list[dict]:
    """
    Fetch medicine batches from database / API for expiry analysis.
    """
    env = load_env_vars()
    backend_url = env.get("BACKEND_URL", "http://localhost:3000/api")
    batches_data = http_get_json(f"{backend_url}/batches?limit=100")
    results = []

    if batches_data and batches_data.get("success") and batches_data.get("data"):
        raw = batches_data["data"]
        if hospital_id is not None:
            raw = [b for b in raw if b.get("hospital_id") == hospital_id]

        for b in raw:
            hid = b.get("hospital_id", 1)
            results.append({
                "hospital_id": f"H{hid:03d}",
                "hospital_name": b.get("hospital_name", f"Hospital {hid}"),
                "medicine_id": int(b.get("medicine_id", 1)),
                "medicine_name": b.get("medicine_name", f"Medicine {b.get('medicine_id', 1)}"),
                "medicine_category": b.get("medicine_category", "General"),
                "batch_id": b.get("batch_number") or f"B-{b.get('id', 1)}",
                "batch_qty": int(b.get("quantity", 100)),
                "expiry_date": b.get("expiry_date", "2026-12-31"),
                "predicted_daily_demand": 30.0,
                "lead_time_days": 7,
            })
    return results


def load_input(path: Path) -> pd.DataFrame:
    """Load new records CSV and validate required columns exist."""
    if not path.exists():
        raise FileNotFoundError(f"Input file not found: {path}")
    df = pd.read_csv(path)

    required_base = [
        "date", "hospital_id", "hospital_name", "region_type",
        "latitude", "longitude", "medicine_id", "medicine_name",
        "medicine_category", "current_stock", "safety_stock",
        "consumption", "patient_load", "emergency_demand",
        "outbreak_indicator", "lead_time_days",
    ]
    missing = set(required_base) - set(df.columns)
    if missing:
        raise ValueError(f"Missing columns in input file: {missing}")
    return df


def evaluate(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    """Compute MAE, RMSE, and R2 metrics."""
    mae  = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    r2   = r2_score(y_true, y_pred)
    return {"MAE": mae, "RMSE": rmse, "R2": r2}


def calculate_stockout(
    current_stock: np.ndarray,
    predicted_future_demand: np.ndarray,
    days_per_period: int = 7,
) -> tuple[np.ndarray, np.ndarray]:
    """
    Compute predicted daily demand and days-to-stockout.

    predicted_daily_demand = predicted_future_demand / days_per_period
    days_to_stockout       = current_stock / predicted_daily_demand

    Clamps demand to >= 1 unit/day to avoid division by zero.
    """
    daily = predicted_future_demand / days_per_period
    daily = np.maximum(daily, 1.0)                     # floor: 1 unit/day
    days_out = current_stock / daily
    return daily, days_out


def run_prediction(df: pd.DataFrame, pipeline) -> pd.DataFrame:
    """
    Apply feature engineering, run inference, compute stockout metrics.
    Returns a structured DataFrame ready for PuLP consumption.
    """
    df = df.copy()
    df = add_time_features(df, date_col="date")

    X = df[ALL_FEATURES]

    raw_pred = pipeline.predict(X)
    predicted_future_demand = np.maximum(raw_pred, 0.0)   # non-negative

    predicted_daily_demand, days_to_stockout = calculate_stockout(
        current_stock=df["current_stock"].values,
        predicted_future_demand=predicted_future_demand,
    )

    results = pd.DataFrame({
        "hospital_id":               df["hospital_id"].values,
        "hospital_name":             df["hospital_name"].values,
        "medicine_id":               df["medicine_id"].values,
        "medicine_name":             df["medicine_name"].values,
        "medicine_category":         df["medicine_category"].values,
        "region_type":               df["region_type"].values,
        "latitude":                  df["latitude"].values,
        "longitude":                 df["longitude"].values,
        "date":                      df["date"].values,
        "current_stock":             df["current_stock"].values,
        "safety_stock":              df["safety_stock"].values,
        "predicted_future_demand":   predicted_future_demand.round(2),
        "predicted_daily_demand":    predicted_daily_demand.round(2),
        "days_to_stockout":          days_to_stockout.round(2),
    })

    return results


def predict_from_db(
    hospital_id: Optional[int] = None,
    medicine_id: Optional[int] = None,
    days_per_period: int = 7,
    output_path: Optional[Path] = None,
) -> pd.DataFrame:
    """
    High-level API: Query live parameters from database, run ML prediction,
    and return results.
    """
    pipeline = load_model(MODEL_PATH)
    df = fetch_records_from_db(hospital_id=hospital_id, medicine_id=medicine_id)
    results = run_prediction(df, pipeline)

    if output_path:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        results.to_csv(output_path, index=False)
        print(f"[predict.py] Database predictions saved to -> {output_path}")

    return results


def main(input_path: Optional[Path] = None, output_path: Path = DEFAULT_OUTPUT, from_db: bool = False, hospital_id: Optional[int] = None) -> pd.DataFrame:
    print("=" * 60)
    print("  SINGULARITY - XGBoost Demand Forecasting  |  predict.py")
    print("=" * 60)

    print(f"\n[1/4] Loading model from: {MODEL_PATH}")
    pipeline = load_model(MODEL_PATH)

    if from_db:
        print(f"\n[2/4] Fetching input parameters dynamically from database...")
        df = fetch_records_from_db(hospital_id=hospital_id)
    else:
        print(f"\n[2/4] Loading input records from CSV: {input_path or DEFAULT_INPUT}")
        df = load_input(input_path or DEFAULT_INPUT)

    print(f"      Records loaded: {len(df)}")

    print("\n[3/4] Running prediction pipeline (no retraining) ...")
    results = run_prediction(df, pipeline)

    if TARGET in df.columns:
        metrics = evaluate(df[TARGET].values, results["predicted_future_demand"].values)
        print(f"\n  Prediction Metrics on Provided Target ({TARGET}):")
        print(f"    MAE  : {metrics['MAE']:.2f}")
        print(f"    RMSE : {metrics['RMSE']:.2f}")
        print(f"    R2   : {metrics['R2']:.4f}")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    results.to_csv(output_path, index=False)

    print(f"\n[4/4] Predictions saved -> {output_path}")
    print(f"\n  Sample output (first 5 rows):\n")
    print(results[[
        "hospital_id", "medicine_id",
        "predicted_future_demand", "predicted_daily_demand",
        "current_stock", "safety_stock", "days_to_stockout"
    ]].head(5).to_string(index=False))
    print("\nPrediction complete.\n")

    return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run XGBoost demand prediction")
    parser.add_argument(
        "--from-db", action="store_true", default=False,
        help="Query live input parameters directly from the database"
    )
    parser.add_argument(
        "--hospital-id", type=int, default=None,
        help="Filter database query by specific hospital ID"
    )
    parser.add_argument(
        "--input", type=Path, default=None,
        help="Path to input CSV (used when --from-db is omitted)"
    )
    parser.add_argument(
        "--output", type=Path, default=DEFAULT_OUTPUT,
        help="Path to output predictions CSV (default: data/predictions.csv)"
    )
    args = parser.parse_args()
    main(input_path=args.input, output_path=args.output, from_db=args.from_db, hospital_id=args.hospital_id)
