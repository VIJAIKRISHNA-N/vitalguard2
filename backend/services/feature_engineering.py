"""
Feature Engineering Module for VITALGUARD 2.0
Transforms raw vitals readings into ML-ready features for XGBoost prediction.

Features computed:
  - hr_mean, hr_trend, hr_variability
  - spo2_mean, spo2_deviation
  - rr_mean, rr_rate_of_change
  - temp_deviation, sbp_mean
"""

import numpy as np
from models.schemas import PatientBaseline


def engineer_features(vitals_history: list[dict], baseline: PatientBaseline) -> dict:
    """
    Compute 9 engineered features from the last N vitals readings.
    
    Args:
        vitals_history: List of vitals dicts (from vitals_simulator)
        baseline: Patient's healthy baseline vitals
    
    Returns:
        Feature dict with 9 named features for model input
    """
    if not vitals_history:
        # Return neutral (low-risk) features if no history yet
        return {
            "hr_mean": baseline.hr,
            "hr_trend": 0.0,
            "hr_variability": 0.0,
            "spo2_mean": baseline.spo2,
            "spo2_deviation": 0.0,
            "rr_mean": baseline.rr,
            "rr_rate_of_change": 0.0,
            "temp_deviation": 0.0,
            "sbp_mean": baseline.sbp,
        }

    # Use most recent 20 readings for feature computation
    recent = vitals_history[-20:] if len(vitals_history) >= 20 else vitals_history

    hr_vals = np.array([v["hr"] for v in recent])
    spo2_vals = np.array([v["spo2"] for v in recent])
    rr_vals = np.array([v["rr"] for v in recent])
    temp_vals = np.array([v["temp"] for v in recent])
    sbp_vals = np.array([v["sbp"] for v in recent])

    # --- Heart Rate Features ---
    hr_mean = float(np.mean(hr_vals))

    # Trend: slope of HR over time (positive = increasing = worse)
    if len(hr_vals) >= 2:
        x = np.arange(len(hr_vals))
        hr_trend = float(np.polyfit(x, hr_vals, 1)[0])  # linear slope
    else:
        hr_trend = 0.0

    # Variability: std deviation (high variability = concerning)
    hr_variability = float(np.std(hr_vals))

    # --- SpO2 Features ---
    spo2_mean = float(np.mean(spo2_vals))
    # Deviation from healthy baseline (negative = dropped below baseline = worse)
    spo2_deviation = float(spo2_mean - baseline.spo2)

    # --- Respiration Rate Features ---
    rr_mean = float(np.mean(rr_vals))
    # Rate of change: difference between last reading and first in window
    rr_rate_of_change = float(rr_vals[-1] - rr_vals[0]) if len(rr_vals) >= 2 else 0.0

    # --- Temperature Features ---
    temp_mean = float(np.mean(temp_vals))
    temp_deviation = float(temp_mean - baseline.temp)

    # --- Blood Pressure Features ---
    sbp_mean = float(np.mean(sbp_vals))

    return {
        "hr_mean": round(hr_mean, 3),
        "hr_trend": round(hr_trend, 4),
        "hr_variability": round(hr_variability, 3),
        "spo2_mean": round(spo2_mean, 3),
        "spo2_deviation": round(spo2_deviation, 3),
        "rr_mean": round(rr_mean, 3),
        "rr_rate_of_change": round(rr_rate_of_change, 3),
        "temp_deviation": round(temp_deviation, 3),
        "sbp_mean": round(sbp_mean, 3),
    }
