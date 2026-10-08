"""
features.py - Time feature engineering from the date column.
"""
import pandas as pd


NUMERIC_FEATURES = [
    "latitude",
    "longitude",
    "current_stock",
    "safety_stock",
    "consumption",
    "patient_load",
    "emergency_demand",
    "outbreak_indicator",
    "lead_time_days",
]

CATEGORICAL_FEATURES = [
    "hospital_id",
    "hospital_name",
    "region_type",
    "medicine_id",
    "medicine_name",
    "medicine_category",
]

TIME_FEATURES = [
    "year",
    "month",
    "week_of_year",
    "day_of_week",
    "quarter",
]

ALL_FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES + TIME_FEATURES

TARGET = "future_demand"


def add_time_features(df: pd.DataFrame, date_col: str = "date") -> pd.DataFrame:
    """
    Extract calendar features from a date column and append them to df.
    The raw date column is NOT used as a model feature.

    Parameters
    ----------
    df : pd.DataFrame
        Input dataframe containing the date column.
    date_col : str
        Name of the date column (default: "date").

    Returns
    -------
    pd.DataFrame
        A copy of df with extra time-feature columns appended.
    """
    df = df.copy()
    dates = pd.to_datetime(df[date_col], errors="coerce")

    df["year"] = dates.dt.year
    df["month"] = dates.dt.month
    # Use isocalendar for ISO week number (returns DataFrame in newer pandas)
    df["week_of_year"] = dates.dt.isocalendar().week.astype(int)
    df["day_of_week"] = dates.dt.dayofweek       # 0 = Monday
    df["quarter"] = dates.dt.quarter

    return df
