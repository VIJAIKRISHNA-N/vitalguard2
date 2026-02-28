"""
Simulation Router — VITALGUARD 2.0
Crisis Simulation Mode — triggers all critical patients to deteriorate simultaneously,
then provides reset to restore original state.
"""

from fastapi import APIRouter
from datetime import datetime, timezone
from services.patient_store import PATIENTS
from services.vitals_simulator import set_patient_severity, _vitals_history
from services.alert_engine import _alerts, _last_risk_scores

router = APIRouter(prefix="/api/simulation", tags=["Simulation"])

# Store original severities for reset
_original_severities = {pid: p.get("severity", 0) for pid, p in PATIENTS.items()}

# The 3 most critical patients to deteriorate in simulation
CRISIS_PATIENTS = ["P001", "P003", "P007"]


@router.post("/trigger")
def trigger_crisis():
    """
    Simulate an ICU emergency:
    1. Set 3 critical patients to max severity (2)
    2. Clear their vitals history to force fresh spike detection
    3. Clear last risk scores to ensure spike alerts trigger on next prediction
    Returns: list of affected patients
    """
    affected = []
    for pid in CRISIS_PATIENTS:
        if pid in PATIENTS:
            set_patient_severity(pid, 2)              # Force critical severity
            _vitals_history[pid] = []                 # Clear history → forces spike
            _last_risk_scores.pop(pid, None)          # Reset spike tracker
            affected.append({
                "patient_id":   pid,
                "patient_name": PATIENTS[pid]["name"],
                "bed":          PATIENTS[pid]["bed"],
                "severity_set": 2,
            })

    return {
        "status":     "crisis_triggered",
        "timestamp":  datetime.now(timezone.utc).isoformat(),
        "affected":   affected,
        "message":    f"ICU Emergency: {len(affected)} patients forced to critical state. Risk scores will spike within 5–10 seconds.",
    }


@router.post("/reset")
def reset_simulation():
    """
    Reset all patients to original severity levels.
    Clears their vitals history and alert spike trackers.
    """
    for pid, original_sev in _original_severities.items():
        set_patient_severity(pid, original_sev)
        _vitals_history[pid] = []
        _last_risk_scores.pop(pid, None)

    return {
        "status":    "simulation_reset",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "message":   "All patients restored to original severity levels.",
    }


@router.get("/status")
def get_simulation_status():
    """Return current severity levels for all patients."""
    return {
        pid: {
            "name":     p["name"],
            "bed":      p["bed"],
            "severity": p.get("severity", 0),
            "is_simulated": pid in CRISIS_PATIENTS,
        }
        for pid, p in PATIENTS.items()
    }
