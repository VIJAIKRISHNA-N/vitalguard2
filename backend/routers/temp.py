"""Temperature API Router — VITALGUARD 2.0"""
from fastapi import APIRouter, HTTPException
from services.temp_engine import run_temp_analysis, get_temp_log, get_temp_med_history
from services.patient_store import PATIENTS
from services.vitals_simulator import simulate_vitals
from models.schemas import PatientBaseline

router = APIRouter(prefix="/api/temp", tags=["Temperature Module"])

@router.get("/{patient_id}")
async def temp_analysis(patient_id: str):
    p = PATIENTS.get(patient_id)
    if not p: raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")
    baseline = PatientBaseline(**p["baseline"])
    v = simulate_vitals(patient_id, baseline, severity=p.get("severity", 0))
    return run_temp_analysis(patient_id, p["name"], p["bed"], v.temp, v.hr)

@router.get("/{patient_id}/history")
async def temp_history(patient_id: str):
    return {"patient_id": patient_id, "history": get_temp_log(patient_id)}

@router.get("/{patient_id}/medications")
async def temp_medications(patient_id: str):
    return {"patient_id": patient_id, "medications": get_temp_med_history(patient_id)}
