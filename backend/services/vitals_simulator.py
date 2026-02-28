"""
Vitals Simulation Engine for VITALGUARD 2.0
Generates realistic but synthetic real-time vital sign readings per patient.
Vitals drift around baseline values with configurable "severity" to simulate
stable, moderate, and critical patient states for demonstration purposes.
"""

import random
import math
from datetime import datetime, timezone
from models.schemas import VitalsReading, PatientBaseline

# In-memory history store: patient_id -> list of VitalsReading
_vitals_history: dict[str, list[dict]] = {}

# Patient severity configs: patient_id -> severity (0=stable, 1=moderate, 2=critical)
_patient_severity: dict[str, int] = {}


def set_patient_severity(patient_id: str, severity: int):
    """Override simulated severity for a patient (0=stable, 1=moderate, 2=critical)."""
    _patient_severity[patient_id] = severity


def _add_noise(value: float, noise_range: float) -> float:
    """Add gaussian noise to a vital value."""
    return value + random.gauss(0, noise_range)


def _clamp(value: float, min_val: float, max_val: float) -> float:
    """Clamp a value between min and max."""
    return max(min_val, min(max_val, value))


def simulate_vitals(patient_id: str, baseline: PatientBaseline, severity: int = None) -> VitalsReading:
    """
    Generate a single simulated vitals reading for a patient.
    
    Severity levels determine drift from baseline:
      0 = Stable   → small noise, near-baseline
      1 = Moderate → gradual drift, moderate deviation  
      2 = Critical → large deviation, dangerous ranges
    
    Args:
        patient_id: The patient identifier
        baseline: Baseline vital values for this patient
        severity: Override severity (0/1/2). If None, uses stored severity or defaults to 0.
    
    Returns:
        VitalsReading with simulated values
    """
    if severity is None:
        severity = _patient_severity.get(patient_id, 0)

    ts = datetime.now(timezone.utc).isoformat()

    # --- Heart Rate ---
    # Stable: ±5 bpm noise | Moderate: +10-20 bpm drift | Critical: +25-40 bpm
    hr_drift = [0, 12, 28][severity]
    hr = _clamp(_add_noise(baseline.hr + hr_drift, [3, 6, 10][severity]), 30, 200)

    # --- SpO2 ---
    # Stable: ±1% | Moderate: -3 to -6% | Critical: -8 to -15%
    spo2_drift = [0, -4, -10][severity]
    spo2 = _clamp(_add_noise(baseline.spo2 + spo2_drift, [0.5, 1.5, 3][severity]), 60, 100)

    # --- Systolic BP ---
    # Stable: ±5 mmHg | Moderate: +15 | Critical: +30 or -20 (hypotension)
    sbp_drift = [0, 15, -20][severity]
    sbp = _clamp(_add_noise(baseline.sbp + sbp_drift, [4, 8, 15][severity]), 70, 220)

    # --- Diastolic BP ---
    dbp_drift = [0, 8, -10][severity]
    dbp = _clamp(_add_noise(baseline.dbp + dbp_drift, [3, 6, 10][severity]), 40, 130)

    # --- Respiration Rate ---
    rr_drift = [0, 5, 12][severity]
    rr = _clamp(_add_noise(baseline.rr + rr_drift, [1, 2, 4][severity]), 6, 50)

    # --- Temperature ---
    temp_drift = [0, 0.8, 2.0][severity]
    temp = _clamp(_add_noise(baseline.temp + temp_drift, [0.1, 0.3, 0.6][severity]), 34.0, 42.0)

    reading = VitalsReading(
        timestamp=ts,
        hr=round(hr, 1),
        spo2=round(spo2, 1),
        sbp=round(sbp, 1),
        dbp=round(dbp, 1),
        rr=round(rr, 1),
        temp=round(temp, 1),
    )

    # Append to in-memory history (keep last 60 readings = ~3 min at 3s polling)
    if patient_id not in _vitals_history:
        _vitals_history[patient_id] = []
    _vitals_history[patient_id].append(reading.model_dump())
    if len(_vitals_history[patient_id]) > 60:
        _vitals_history[patient_id].pop(0)

    return reading


def get_vitals_history(patient_id: str) -> list[dict]:
    """Return stored vitals history for a patient (for trend chart)."""
    return _vitals_history.get(patient_id, [])
