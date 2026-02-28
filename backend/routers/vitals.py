"""
Vitals Router – VITALGUARD 2.0
Endpoints: get current simulated vitals, get vitals history for trend charts.
Vitals are simulated in real-time with severity-based drift (Layer 3, Feature 9 + 10).
"""

from fastapi import APIRouter, HTTPException
from models.schemas import VitalsReading, PatientBaseline
from services.patient_store import PATIENTS
from services.vitals_simulator import simulate_vitals, get_vitals_history

router = APIRouter(prefix="/api/vitals", tags=["Vitals"])


@router.get("/{patient_id}/current", response_model=VitalsReading)
def get_current_vitals(patient_id: str):
    """
    Generate and return a fresh simulated vitals reading for a patient.
    Called by frontend every 3 seconds to simulate real-time monitoring.
    Each call also stores the reading in memory for trend computation.
    """
    if patient_id not in PATIENTS:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")

    p = PATIENTS[patient_id]
    baseline = PatientBaseline(**p["baseline"])
    severity = p.get("severity", 0)
    return simulate_vitals(patient_id, baseline, severity)


@router.get("/{patient_id}/history")
def get_vitals_history_route(patient_id: str):
    """
    Return stored vitals history for time-series trend chart (Layer 3, Feature 10).
    Returns up to 60 readings = ~3 minutes at 3s polling interval.
    """
    if patient_id not in PATIENTS:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")
    return {"patient_id": patient_id, "history": get_vitals_history(patient_id)}
