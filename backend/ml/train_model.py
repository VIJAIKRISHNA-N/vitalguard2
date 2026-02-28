"""
XGBoost Model Training Script for VITALGUARD 2.0
Trains a binary classifier to predict ICU patient risk (low=0 vs high=1).

Run from backend/ directory:
  python ml/train_model.py

Outputs:
  ml/model.pkl  ← trained and serialized XGBoost model
"""

import pandas as pd
import numpy as np
import joblib
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score
from xgboost import XGBClassifier

DATA_PATH = Path(__file__).parent.parent / "data" / "dummy_vitals.csv"
MODEL_PATH = Path(__file__).parent / "model.pkl"

FEATURE_NAMES = [
    "hr_mean",
    "hr_trend",
    "hr_variability",
    "spo2_mean",
    "spo2_deviation",
    "rr_mean",
    "rr_rate_of_change",
    "temp_deviation",
    "sbp_mean",
]


def train():
    print("[Train] Loading data...")
    df = pd.read_csv(DATA_PATH)
    print(f"[Train] Loaded {len(df)} samples. Label distribution:\n{df['label'].value_counts()}\n")

    X = df[FEATURE_NAMES]
    y = df["label"]

    # 80/20 train/test split with stratification
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # XGBoost classifier - production-ready hyperparameters
    model = XGBClassifier(
        n_estimators=200,           # Number of boosting rounds
        max_depth=5,                # Tree depth - prevents overfitting
        learning_rate=0.05,         # Shrinkage factor
        subsample=0.8,              # Row subsampling per tree
        colsample_bytree=0.8,       # Feature subsampling per tree
        use_label_encoder=False,
        eval_metric="logloss",
        random_state=42,
        n_jobs=-1,                  # Use all CPU cores
    )

    print("[Train] Training XGBoost model...")
    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        verbose=50,  # Print every 50 rounds
    )

    # Evaluate on test set
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]

    print("\n[Train] === Evaluation Results ===")
    print(classification_report(y_test, y_pred, target_names=["Low Risk", "High Risk"]))
    print(f"[Train] ROC-AUC Score: {roc_auc_score(y_test, y_proba):.4f}")

    # Save model to disk
    joblib.dump(model, MODEL_PATH)
    print(f"\n[Train] Model saved to {MODEL_PATH}")

    # Print top feature importances
    importances = model.feature_importances_
    feat_imp = sorted(zip(FEATURE_NAMES, importances), key=lambda x: x[1], reverse=True)
    print("\n[Train] Feature Importances (gain):")
    for name, imp in feat_imp:
        bar = "█" * int(imp * 50)
        print(f"  {name:<22} {imp:.4f}  {bar}")


if __name__ == "__main__":
    train()
