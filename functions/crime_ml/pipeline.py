from __future__ import annotations

from pathlib import Path
from typing import Any

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

TARGET = "risk_level"
FEATURES = [
    "crime_type",
    "hour",
    "day_of_week",
    "district",
    "latitude",
    "longitude",
    "historical_frequency",
]


class CrimeRiskPipelineCore:
    """Pipeline sklearn reutilizable en Django y Cloud Functions."""

    model_filename = "crime_risk_model.joblib"

    @classmethod
    def _build_pipeline(cls) -> Pipeline:
        categorical_features = ["crime_type", "day_of_week", "district"]
        numeric_features = ["hour", "latitude", "longitude", "historical_frequency"]

        preprocessor = ColumnTransformer(
            transformers=[
                ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features),
                ("num", "passthrough", numeric_features),
            ]
        )

        estimator = RandomForestClassifier(
            n_estimators=250,
            max_depth=20,
            random_state=42,
            class_weight="balanced",
        )

        return Pipeline(
            steps=[
                ("preprocessor", preprocessor),
                ("model", estimator),
            ]
        )

    @classmethod
    def train_from_dataframe(cls, data: pd.DataFrame, test_size: float, artifact_path: Path) -> dict[str, Any]:
        missing = set(FEATURES + [TARGET]) - set(data.columns)
        if missing:
            raise ValueError(f"Faltan columnas en el dataset: {sorted(missing)}")

        if data.empty:
            raise ValueError("No hay datos disponibles para entrenamiento")

        X = data[FEATURES]
        y = data[TARGET]

        X_train, X_test, y_train, y_test = train_test_split(
            X,
            y,
            test_size=test_size,
            random_state=42,
            stratify=y,
        )

        pipeline = cls._build_pipeline()
        pipeline.fit(X_train, y_train)

        y_pred = pipeline.predict(X_test)
        metrics = {
            "accuracy": float(accuracy_score(y_test, y_pred)),
            "precision_weighted": float(precision_score(y_test, y_pred, average="weighted", zero_division=0)),
            "recall_weighted": float(recall_score(y_test, y_pred, average="weighted", zero_division=0)),
            "f1_weighted": float(f1_score(y_test, y_pred, average="weighted", zero_division=0)),
        }

        artifact_path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(pipeline, artifact_path)

        return {
            "metrics": metrics,
            "model_path": str(artifact_path),
            "train_size": int(len(X_train)),
            "test_size": int(len(X_test)),
        }

    @classmethod
    def predict(cls, features: dict[str, Any], artifact_path: Path) -> str:
        if not artifact_path.exists():
            raise FileNotFoundError("Modelo no entrenado. Ejecute entrenamiento primero.")

        pipeline: Pipeline = joblib.load(artifact_path)
        input_df = pd.DataFrame([features], columns=FEATURES)
        prediction = pipeline.predict(input_df)
        return str(prediction[0])
