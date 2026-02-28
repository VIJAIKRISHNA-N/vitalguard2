"""
Forecast Router – VITALGUARD 2.0 (Layer 3, Feature 13)
Short-term risk forecast: 15-30 minutes ahead using trend extrapolation.
"""

import math
import random
from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from models.schemas import RiskForecast, ForecastPoint, PatientBaseline
from services.patient_store import PATIENTS
from services.vitals_simulator import get_vitals_history
from services.feature_engineering import engineer_features
from models.xgboost_model import predict_risk

router = APIRouter(prefix="/api/forecast", tags=["Forecast"])


@router.get("/{patient_id}", response_model=RiskForecast)
def get_risk_forecast(patient_id: str):
    """
    Generate short-term risk forecast for 5, 10, 15, 20, 25 and 30 min ahead.
    
    Method:
    - Compute current risk score from recent vitals
    - Estimate trend by comparing risk from first half vs second half of history
    - Project forward using linear trend + uncertainty bounds
    - Bounds widen with time (increasing uncertainty further ahead)
    """
    if patient_id not in PATIENTS:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")

    p = PATIENTS[patient_id]
    baseline = PatientBaseline(**p["baseline"])
    history = get_vitals_history(patient_id)

    # Compute current risk
    current_features = engineer_features(history, baseline)
    current_risk, _ = predict_risk(current_features)

    # Estimate trend from older half of history window
    forecast_points = []
    trend_per_minute = 0.0

    if len(history) >= 10:
        # Use first half of history to estimate historical risk
        old_features = engineer_features(history[:len(history)//2], baseline)
        old_risk, _ = predict_risk(old_features)
        # Delta over roughly half the window (~1.5 min at 3s polling)
        window_minutes = (len(history) / 2) * 3 / 60
        trend_per_minute = (current_risk - old_risk) / max(window_minutes, 1.0)

    # Project forward at 5-minute intervals: 5, 10, 15, 20, 25, 30 min
    for minutes in [5, 10, 15, 20, 25, 30]:
        projected = current_risk + (trend_per_minute * minutes)
        projected = max(0.0, min(100.0, projected))

        # Uncertainty grows with time: ±stdev increases with sqrt(minutes)
        uncertainty = 5.0 + 2.5 * math.sqrt(minutes)
        lower = max(0.0, projected - uncertainty)
        upper = min(100.0, projected + uncertainty)

        forecast_points.append(ForecastPoint(
            minutes_ahead=minutes,
            predicted_risk=round(projected, 1),
            lower_bound=round(lower, 1),
            upper_bound=round(upper, 1),
        ))

    return RiskForecast(
        patient_id=patient_id,
        generated_at=datetime.now(timezone.utc).isoformat(),
        forecast=forecast_points,
    )
