"""Heart Rate API Router — VITALGUARD 2.0"""
from fastapi import APIRouter, HTTPException
from services.hr_engine import run_hr_analysis, get_hr_log, get_hr_med_history
from services.patient_store import PATIENTS
from services.vitals_simulator import simulate_vitals
from models.schemas import PatientBaseline

router = APIRouter(prefix="/api/hr", tags=["Heart Rate Module"])

@router.get("/{patient_id}")
async def hr_analysis(patient_id: str):
    p = PATIENTS.get(patient_id)
    if not p: raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")
    baseline = PatientBaseline(**p["baseline"])
    v = simulate_vitals(patient_id, baseline, severity=p.get("severity", 0))
    return run_hr_analysis(patient_id, p["name"], p["bed"], v.hr, p["age"])

@router.get("/{patient_id}/history")
async def hr_history(patient_id: str):
    return {"patient_id": patient_id, "history": get_hr_log(patient_id)}

@router.get("/{patient_id}/medications")
async def hr_medications(patient_id: str):
    return {"patient_id": patient_id, "medications": get_hr_med_history(patient_id)}
