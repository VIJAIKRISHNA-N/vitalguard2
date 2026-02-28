"""
Reports Router — VITALGUARD 2.0
Provides ICU analytics: 7-day stress trend, alert distribution, patient risk distribution.
"""

import random
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter
from services.patient_store import PATIENTS
from services.vitals_simulator import get_vitals_history
from services.feature_engineering import engineer_features
from models.xgboost_model import predict_risk
from models.schemas import PatientBaseline
from services.alert_engine import get_alert_log, get_alert_counts

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get("/summary")
def get_reports_summary():
    """
    Return ICU analytics for the Reports & Analytics page:
    - 7-day ICU stress trend (simulated daily avg risk)
    - Alert type distribution (threshold vs spike)
    - Current patient risk distribution (green/yellow/red)
    - Key performance metrics
    """

    # ── 7-Day ICU Stress Trend (simulate historical daily averages) ───────────
    today = datetime.now(timezone.utc)
    stress_trend = []
    # Generate realistic-looking 7-day trend with slight upward movement
    base_stress = random.uniform(30, 50)
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        # Add slight randomness + time-of-day variation
        daily_stress = base_stress + random.gauss(0, 8)
        daily_stress = max(10.0, min(95.0, daily_stress))
        base_stress += random.gauss(0, 3)  # Slight drift
        stress_trend.append({
            "date": day.strftime("%b %d"),
            "avg_risk": round(daily_stress, 1),
            "critical": random.randint(1, 4),
            "alerts": random.randint(3, 15),
        })

    # ── Current Patient Risk Distribution ─────────────────────────────────────
    distribution = {"green": 0, "yellow": 0, "red": 0}
    for pid, p in PATIENTS.items():
        baseline = PatientBaseline(**p["baseline"])
        history = get_vitals_history(pid)
        features = engineer_features(history, baseline)
        risk, _ = predict_risk(features)
        if risk < 40:   distribution["green"]  += 1
        elif risk < 70: distribution["yellow"] += 1
        else:           distribution["red"]    += 1

    # ── Alert Type Distribution ───────────────────────────────────────────────
    log = get_alert_log()
    alert_dist = {"threshold": 0, "spike": 0, "suppressed": 0}
    for a in log:
        if a.suppressed:
            alert_dist["suppressed"] += 1
        elif a.alert_type.value == "threshold":
            alert_dist["threshold"] += 1
        else:
            alert_dist["spike"] += 1

    # ── KPI Metrics ───────────────────────────────────────────────────────────
    counts = get_alert_counts()
    suppression_rate = 0.0
    if counts["triggered"] > 0:
        suppression_rate = round(counts["suppressed"] / counts["triggered"] * 100, 1)

    return {
        "stress_trend":      stress_trend,
        "risk_distribution": distribution,
        "alert_distribution": alert_dist,
        "kpis": {
            "avg_icu_stress":       round(stress_trend[-1]["avg_risk"], 1),
            "total_alerts":         counts["triggered"],
            "suppression_rate_pct": suppression_rate,
            "patients_critical":    distribution["red"],
            "patients_stable":      distribution["green"],
        }
    }
