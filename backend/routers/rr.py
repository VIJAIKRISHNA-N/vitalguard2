"""Respiratory Rate API Router — VITALGUARD 2.0"""
from fastapi import APIRouter, HTTPException
from services.rr_engine import run_rr_analysis, get_rr_log, get_rr_therapy_history
from services.patient_store import PATIENTS
from services.vitals_simulator import simulate_vitals
from models.schemas import PatientBaseline

router = APIRouter(prefix="/api/rr", tags=["Respiratory Rate Module"])

@router.get("/{patient_id}")
async def rr_analysis(patient_id: str):
    p = PATIENTS.get(patient_id)
    if not p: raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")
    baseline = PatientBaseline(**p["baseline"])
    v = simulate_vitals(patient_id, baseline, severity=p.get("severity", 0))
    return run_rr_analysis(patient_id, p["name"], p["bed"], v.rr, v.spo2)

@router.get("/{patient_id}/history")
async def rr_history(patient_id: str):
    return {"patient_id": patient_id, "history": get_rr_log(patient_id)}

@router.get("/{patient_id}/therapies")
async def rr_therapies(patient_id: str):
    return {"patient_id": patient_id, "therapies": get_rr_therapy_history(patient_id)}
