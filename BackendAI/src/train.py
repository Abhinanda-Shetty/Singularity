"""
train.py - End-to-end training pipeline for XGBoost demand forecasting.

Usage:
    python src/train.py

Outputs:
    models/model.pkl           - fitted sklearn Pipeline (preprocessing + XGBoost)
    data/test_predictions.csv  - predictions on the held-out chronological 20%
"""
import sys
from pathlib import Path

# Allow imports from src/ regardless of working directory
sys.path.insert(0, str(Path(__file__).parent))

import numpy as np
import pandas as pd
import joblib
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from xgboost import XGBRegressor

from features import (
    add_time_features,
    ALL_FEATURES,
    NUMERIC_FEATURES,
    CATEGORICAL_FEATURES,
    TIME_FEATURES,
    TARGET,
)
from preprocessing import build_preprocessing_pipeline

# -- Paths --------------------------------------------------------------------
ROOT = Path(__file__).parent.parent
DATA_PATH = ROOT / "data" / "medical_demand_training_90.csv"
MODEL_PATH = ROOT / "models" / "model.pkl"
PRED_PATH  = ROOT / "data" / "test_predictions.csv"

REQUIRED_COLUMNS = [
    "date", "hospital_id", "hospital_name", "region_type",
    "latitude", "longitude", "medicine_id", "medicine_name",
    "medicine_category", "current_stock", "safety_stock",
    "consumption", "patient_load", "emergency_demand",
    "outbreak_indicator", "lead_time_days", TARGET,
]


def load_and_validate(path: Path) -> pd.DataFrame:
    """Load CSV and verify required columns are present."""
    if not path.exists():
        raise FileNotFoundError(
            f"Dataset not found: {path}\n"
            "Run: python src/generate_data.py  (or supply your own CSV)"
        )
    df = pd.read_csv(path)
    missing = set(REQUIRED_COLUMNS) - set(df.columns)
    if missing:
        raise ValueError(f"Missing columns in dataset: {missing}")
    return df


def prepare_features(df: pd.DataFrame) -> pd.DataFrame:
    """Sort chronologically, add time features, return feature matrix."""
    df = df.sort_values("date").reset_index(drop=True)
    df = add_time_features(df, date_col="date")
    return df


def chronological_split(df: pd.DataFrame, train_ratio: float = 0.80):
    """
    80 / 20 chronological split - NO shuffling.
    The first 80% of rows (by time order) form the training set.
    """
    n = len(df)
    split_idx = int(n * train_ratio)
    train_df = df.iloc[:split_idx].copy()
    test_df  = df.iloc[split_idx:].copy()
    return train_df, test_df


def build_model_pipeline() -> Pipeline:
    """Combine the preprocessing transformer with XGBRegressor."""
    preprocessor = build_preprocessing_pipeline()
    xgb = XGBRegressor(
        objective="reg:squarederror",
        n_estimators=300,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.85,
        colsample_bytree=0.85,
        random_state=42,
        n_jobs=-1,
        verbosity=0,
    )
    pipeline = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("model", xgb),
    ])
    return pipeline


def evaluate(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    """Compute MAE, RMSE, and R2 metrics."""
    mae  = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    r2   = r2_score(y_true, y_pred)
    return {"MAE": mae, "RMSE": rmse, "R2": r2}


def main() -> None:
    print("=" * 60)
    print("  SINGULARITY - XGBoost Demand Forecasting  |  train.py")
    print("=" * 60)

    # 1. Load & validate
    print(f"\n[1/7] Loading data from: {DATA_PATH}")
    df = load_and_validate(DATA_PATH)
    print(f"      Rows: {len(df)}  |  Columns: {list(df.columns)}")

    # 2. Feature engineering
    print("\n[2/7] Adding time features and sorting chronologically ...")
    df = prepare_features(df)

    # 3. Build X and y
    X = df[ALL_FEATURES]
    y = df[TARGET]
    print(f"\n[3/7] Feature matrix shape : {X.shape}")
    print(f"      Feature columns used  : {list(X.columns)}")

    # 4. Chronological split
    train_df, test_df = chronological_split(df, train_ratio=0.80)
    X_train = train_df[ALL_FEATURES]
    y_train = train_df[TARGET]
    X_test  = test_df[ALL_FEATURES]
    y_test  = test_df[TARGET]
    print(f"\n[4/7] Chronological split:")
    print(f"      Train: {len(X_train)} rows  ({train_df['date'].min()} to {train_df['date'].max()})")
    print(f"      Test : {len(X_test)} rows  ({test_df['date'].min()} to {test_df['date'].max()})")

    # 5. Fit pipeline on training data ONLY
    print("\n[5/7] Fitting preprocessing + XGBoost pipeline on training data ...")
    pipeline = build_model_pipeline()
    pipeline.fit(X_train, y_train)

    # 6. Predict & evaluate
    print("\n[6/7] Evaluating on test set ...")
    y_pred = pipeline.predict(X_test)
    y_pred = np.maximum(y_pred, 0)   # demand cannot be negative

    metrics = evaluate(y_test.values, y_pred)
    print(f"\n  Test Metrics:")
    print(f"    MAE  : {metrics['MAE']:.2f}")
    print(f"    RMSE : {metrics['RMSE']:.2f}")
    print(f"    R2   : {metrics['R2']:.4f}")

    # 7. Save artefacts
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, MODEL_PATH)
    print(f"\n[7/7] Model saved -> {MODEL_PATH}")

    # Save test predictions
    test_out = test_df[["date", "hospital_id", "medicine_id", TARGET]].copy()
    test_out["predicted_future_demand"] = y_pred
    test_out["residual"] = test_out[TARGET] - test_out["predicted_future_demand"]
    PRED_PATH.parent.mkdir(parents=True, exist_ok=True)
    test_out.to_csv(PRED_PATH, index=False)
    print(f"      Test predictions saved -> {PRED_PATH}")

    print("\nTraining complete.\n")


if __name__ == "__main__":
    main()
