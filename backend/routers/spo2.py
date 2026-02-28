"""SpO2 API Router — VITALGUARD 2.0"""
from fastapi import APIRouter, HTTPException
from services.spo2_engine import run_spo2_analysis, get_spo2_log, get_spo2_support_history
from services.patient_store import PATIENTS
from services.vitals_simulator import simulate_vitals
from models.schemas import PatientBaseline

router = APIRouter(prefix="/api/spo2", tags=["SpO2 Module"])

@router.get("/{patient_id}")
async def spo2_analysis(patient_id: str):
    p = PATIENTS.get(patient_id)
    if not p: raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")
    baseline = PatientBaseline(**p["baseline"])
    v = simulate_vitals(patient_id, baseline, severity=p.get("severity", 0))
    return run_spo2_analysis(patient_id, p["name"], p["bed"], v.spo2, v.rr)

@router.get("/{patient_id}/history")
async def spo2_history(patient_id: str):
    return {"patient_id": patient_id, "history": get_spo2_log(patient_id)}

@router.get("/{patient_id}/supports")
async def spo2_supports(patient_id: str):
    return {"patient_id": patient_id, "supports": get_spo2_support_history(patient_id)}
