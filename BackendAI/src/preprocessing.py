"""
preprocessing.py - Builds the scikit-learn preprocessing pipeline.

The pipeline handles:
  - Numeric features : median imputation + optional scaling (passthrough for XGBoost)
  - Categorical features : constant-fill imputation + OneHotEncoder(handle_unknown="ignore")
"""
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import OneHotEncoder

from features import NUMERIC_FEATURES, CATEGORICAL_FEATURES


def _ohe() -> OneHotEncoder:
    """Version-safe OneHotEncoder factory (dense output, unknown categories ignored)."""
    try:
        # sparse_output available from sklearn 1.2+
        return OneHotEncoder(handle_unknown="ignore", sparse_output=False)
    except TypeError:
        # Fallback for sklearn < 1.2
        return OneHotEncoder(handle_unknown="ignore", sparse=False)


def build_preprocessing_pipeline() -> ColumnTransformer:
    """
    Returns a ColumnTransformer that preprocesses numeric and categorical columns.

    Numeric  -> SimpleImputer(strategy="median")
    Categorical -> SimpleImputer(strategy="constant", fill_value="unknown")
                  then OneHotEncoder(handle_unknown="ignore", dense output)
    """
    numeric_pipeline = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="median")),
    ])

    categorical_pipeline = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="constant", fill_value="unknown")),
        ("encoder", _ohe()),
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_pipeline, NUMERIC_FEATURES),
            ("cat", categorical_pipeline, CATEGORICAL_FEATURES),
        ],
        remainder="passthrough",   # time features pass through untouched
    )

    return preprocessor
