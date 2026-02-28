"""
Prediction Router – VITALGUARD 2.0 (Layer 2 – Smart Triage Core)
Endpoints: XGBoost risk prediction, explainable AI feature contributions, confidence score.
"""

from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from models.schemas import PredictionResult, PatientBaseline, RiskLevel
from services.patient_store import PATIENTS
from services.vitals_simulator import simulate_vitals, get_vitals_history
from services.feature_engineering import engineer_features
from services.risk_classifier import classify_risk
from models.xgboost_model import predict_risk, get_feature_contributions
from services.alert_engine import (
    check_threshold_alerts, check_spike_alert, get_active_alerts
)

router = APIRouter(prefix="/api/predict", tags=["Prediction"])


@router.post("/{patient_id}", response_model=PredictionResult)
def run_prediction(patient_id: str):
    """
    Run full XGBoost prediction pipeline for a patient (Layer 2, Features 5+6+8):
    1. Get current vitals (simulate a fresh reading)
    2. Engineer features from vitals history
    3. Predict risk score and confidence
    4. Classify risk level (green/yellow/red)
    5. Trigger alert engine checks
    
    Returns: PredictionResult with risk_score, risk_level, confidence, features
    """
    if patient_id not in PATIENTS:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")

    p = PATIENTS[patient_id]
    baseline = PatientBaseline(**p["baseline"])

    # Step 1: Simulate fresh vitals reading and add to history
    latest_vitals = simulate_vitals(patient_id, baseline, p.get("severity", 0))

    # Step 2: Engineer features from last 20 readings
    history = get_vitals_history(patient_id)
    features = engineer_features(history, baseline)

    # Step 3: Run XGBoost prediction
    risk_score, confidence = predict_risk(features)

    # Step 4: Classify risk level
    risk_level = classify_risk(risk_score)

    # Step 5: Run alert engine checks (threshold + spike)
    vitals_dict = latest_vitals.model_dump()
    check_threshold_alerts(
        patient_id, p["name"], p["bed"],
        vitals_dict, risk_score, confidence
    )
    check_spike_alert(patient_id, p["name"], p["bed"], risk_score, confidence)

    # Get feature contributions for XAI
    feature_contributions = get_feature_contributions(features)

    return PredictionResult(
        patient_id=patient_id,
        timestamp=datetime.now(timezone.utc).isoformat(),
        risk_score=risk_score,
        risk_level=risk_level,
        confidence=confidence,
        feature_contributions=feature_contributions,
    )


@router.get("/{patient_id}/explain")
def explain_prediction(patient_id: str):
    """
    Return feature contribution breakdown for Explainable AI panel (Layer 3, Feature 14).
    Shows which vital signs are most responsible for the current risk score.
    """
    if patient_id not in PATIENTS:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")

    p = PATIENTS[patient_id]
    baseline = PatientBaseline(**p["baseline"])
    history = get_vitals_history(patient_id)
    features = engineer_features(history, baseline)
    contributions = get_feature_contributions(features)

    # Map feature names to human-readable labels for UI
    labels = {
        "hr_mean": "Heart Rate (Mean)",
        "hr_trend": "HR Trend (Slope)",
        "hr_variability": "HR Variability",
        "spo2_mean": "SpO₂ (Mean)",
        "spo2_deviation": "SpO₂ Deviation",
        "rr_mean": "Respiration Rate",
        "rr_rate_of_change": "RR Rate of Change",
        "temp_deviation": "Temperature Deviation",
        "sbp_mean": "Systolic BP",
    }

    return {
        "patient_id": patient_id,
        "contributions": [
            {"feature": feat, "label": labels.get(feat, feat), "pct": pct}
            for feat, pct in sorted(contributions.items(), key=lambda x: x[1], reverse=True)
        ]
    }
