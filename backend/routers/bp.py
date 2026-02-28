"""
BP Router — VITALGUARD 2.0
API endpoints for the Blood Pressure Vital Module.
All endpoints extend ONLY the BP section — no changes to existing patient schema.
"""

from fastapi import APIRouter, HTTPException
from services.bp_engine import run_bp_analysis, get_bp_hourly_log, get_medication_history
from services.patient_store import PATIENTS
from services.vitals_simulator import simulate_vitals
from models.schemas import PatientBaseline

router = APIRouter(prefix="/api/bp", tags=["BP Module"])


def _get_patient_bp_extras(patient_id: str) -> dict:
    """Get sodium, bmi from extended patient data."""
    p = PATIENTS.get(patient_id)
    if not p:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")
    # Extended fields — stored alongside existing patient data
    return {
        "sodium": p.get("sodium", 138.0),
        "bmi": p.get("bmi", 24.5),
    }


@router.get("/{patient_id}")
async def get_bp_analysis(patient_id: str):
    """
    Run the full BP analysis pipeline for a patient:
    sub-parameters → risk → prescription → prediction → alerts.
    Uses current LIVE vitals from the simulator.
    """
    p = PATIENTS.get(patient_id)
    if not p:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")

    # Get live vitals from simulator
    baseline = PatientBaseline(**p["baseline"])
    vitals = simulate_vitals(patient_id, baseline, severity=p.get("severity", 0))

    extras = _get_patient_bp_extras(patient_id)

    result = run_bp_analysis(
        patient_id=patient_id,
        patient_name=p["name"],
        bed=p["bed"],
        sbp=vitals.sbp,
        dbp=vitals.dbp,
        hr=vitals.hr,
        sodium=extras["sodium"],
        age=p["age"],
        bmi=extras["bmi"],
    )
    return result


@router.get("/{patient_id}/history")
async def get_bp_history(patient_id: str):
    """Return hourly BP variance data for charts."""
    if patient_id not in PATIENTS:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")
    return {"patient_id": patient_id, "data": get_bp_hourly_log(patient_id)}


@router.get("/{patient_id}/medications")
async def get_bp_medications(patient_id: str):
    """Return medication history for a patient."""
    if patient_id not in PATIENTS:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")
    return {"patient_id": patient_id, "medications": get_medication_history(patient_id)}
