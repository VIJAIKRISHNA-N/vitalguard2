"""
Patients Router – VITALGUARD 2.0
Endpoints: list all patients (sorted by risk), get single patient details, ICU summary.
"""

from fastapi import APIRouter, HTTPException
from models.schemas import PatientSummary, ICUSummary, PatientBaseline, RiskLevel
from services.patient_store import PATIENTS
from services.risk_classifier import classify_risk, sort_patients_by_risk
from services.vitals_simulator import simulate_vitals, get_vitals_history
from services.feature_engineering import engineer_features
from models.xgboost_model import predict_risk
from services.alert_engine import get_alert_counts

router = APIRouter(prefix="/api/patients", tags=["Patients"])


def _get_patient_with_risk(pid: str) -> dict:
    """Compute current risk score for a patient by predicting on latest vitals."""
    p = PATIENTS[pid]
    baseline = PatientBaseline(**p["baseline"])
    history = get_vitals_history(pid)
    features = engineer_features(history, baseline)
    risk_score, confidence = predict_risk(features)
    risk_level = classify_risk(risk_score)
    return {**p, "risk_score": risk_score, "confidence": confidence,
            "risk_level": risk_level.value}


@router.get("/", response_model=list[PatientSummary])
def list_patients():
    """
    Return all patients sorted by descending risk score.
    This drives the multi-patient monitoring dashboard (Layer 1, Feature 4 + Layer 2, Feature 7).
    """
    enriched = [_get_patient_with_risk(pid) for pid in PATIENTS]
    sorted_patients = sort_patients_by_risk(enriched)
    return [
        PatientSummary(
            id=p["id"], name=p["name"], bed=p["bed"],
            risk_score=p["risk_score"], risk_level=p["risk_level"],
            confidence=p["confidence"], status="Active"
        )
        for p in sorted_patients
    ]


@router.get("/icu-summary", response_model=ICUSummary)
def get_icu_summary():
    """
    ICU Command Center aggregate metrics (Layer 1, Features 1 + 2).
    Returns total/critical/moderate/stable counts, alert counts, and system stress %.
    """
    enriched = [_get_patient_with_risk(pid) for pid in PATIENTS]
    alert_counts = get_alert_counts()

    critical = sum(1 for p in enriched if p["risk_level"] == "red")
    moderate = sum(1 for p in enriched if p["risk_level"] == "yellow")
    stable = sum(1 for p in enriched if p["risk_level"] == "green")
    avg_risk = sum(p["risk_score"] for p in enriched) / len(enriched) if enriched else 0

    return ICUSummary(
        total_patients=len(enriched),
        critical_count=critical,
        moderate_count=moderate,
        stable_count=stable,
        alerts_triggered=alert_counts["triggered"],
        alerts_suppressed=alert_counts["suppressed"],
        avg_risk_score=round(avg_risk, 1),
        system_stress_pct=round(avg_risk, 1),
    )


@router.get("/{patient_id}")
def get_patient(patient_id: str):
    """Get a single patient's full detail including risk and baseline."""
    if patient_id not in PATIENTS:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")
    return _get_patient_with_risk(patient_id)
