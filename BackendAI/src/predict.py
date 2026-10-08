"""
predict.py - Inference using the saved model.pkl.

Usage:
    python src/predict.py                           # uses default new_records.csv
    python src/predict.py --input path/to/file.csv  # custom input
    python src/predict.py --input data/medical_demand_training_90.csv  # re-use training data as demo

Outputs:
    data/predictions.csv  - structured predictions ready for PuLP integration
"""
import sys
import argparse
from pathlib import Path

# Allow imports from src/ regardless of working directory
sys.path.insert(0, str(Path(__file__).parent))

import numpy as np
import pandas as pd
import joblib
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from features import add_time_features, ALL_FEATURES, TARGET

# -- Paths --------------------------------------------------------------------
ROOT       = Path(__file__).parent.parent
MODEL_PATH = ROOT / "models" / "model.pkl"
DEFAULT_INPUT = ROOT / "data" / "medical_demand_training_90.csv"
DEFAULT_OUTPUT = ROOT / "data" / "predictions.csv"


def load_model(model_path: Path):
    """Load the fitted sklearn Pipeline from disk."""
    if not model_path.exists():
        raise FileNotFoundError(
            f"Model not found: {model_path}\n"
            "Please run:  python src/train.py  first."
        )
    pipeline = joblib.load(model_path)
    return pipeline


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


def main(input_path: Path, output_path: Path) -> None:
    print("=" * 60)
    print("  SINGULARITY - XGBoost Demand Forecasting  |  predict.py")
    print("=" * 60)

    print(f"\n[1/4] Loading model from: {MODEL_PATH}")
    pipeline = load_model(MODEL_PATH)

    print(f"[2/4] Loading input records from: {input_path}")
    df = load_input(input_path)
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
        "--input",  type=Path, default=DEFAULT_INPUT,
        help="Path to input CSV (default: data/medical_demand_training_90.csv)"
    )
    parser.add_argument(
        "--output", type=Path, default=DEFAULT_OUTPUT,
        help="Path to output predictions CSV (default: data/predictions.csv)"
    )
    args = parser.parse_args()
    main(args.input, args.output)
