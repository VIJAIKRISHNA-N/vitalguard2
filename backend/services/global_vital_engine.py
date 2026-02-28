"""
Global Multi-Vital Engine — VITALGUARD 2.0
Combines all vital module outputs into an overall stability score,
24-hour deterioration risk, ICU transfer probability, and
medication escalation probability.
"""
from typing import Dict
from services.bp_engine import run_bp_analysis
from services.hr_engine import run_hr_analysis
from services.spo2_engine import run_spo2_analysis
from services.rr_engine import run_rr_analysis
from services.temp_engine import run_temp_analysis

def run_global_analysis(pid: str, name: str, bed: str,
                        sbp: float, dbp: float, hr: float, spo2: float,
                        rr: float, temp: float, sodium: float, age: int,
                        bmi: float) -> dict:
    """Run all 5 vital engines and produce a global correlated report."""
    bp   = run_bp_analysis(pid, name, bed, sbp, dbp, hr, sodium, age, bmi)
    hr_r = run_hr_analysis(pid, name, bed, hr, age)
    spo2_r = run_spo2_analysis(pid, name, bed, spo2, rr)
    rr_r = run_rr_analysis(pid, name, bed, rr, spo2)
    temp_r = run_temp_analysis(pid, name, bed, temp, hr)

    # Weighted stability score (inverse of average risk)
    bp_risk   = bp["risk_score"]["percentage"]
    hr_risk   = hr_r["risk_score"]["percentage"]
    spo2_risk = spo2_r["risk_score"]["percentage"]
    rr_risk   = rr_r["risk_score"]["percentage"]
    temp_risk = temp_r["risk_score"]["percentage"]

    weighted_risk = (bp_risk * 0.30 + hr_risk * 0.25 + spo2_risk * 0.20
                     + rr_risk * 0.15 + temp_risk * 0.10)
    stability = max(0, min(100, round(100 - weighted_risk, 1)))

    if stability >= 75:  status, color = "Stable", "green"
    elif stability >= 50: status, color = "Monitor Closely", "yellow"
    elif stability >= 25: status, color = "High Alert", "orange"
    else: status, color = "Critical", "red"

    # Predictions
    deterioration_24h = min(95, max(3, round(weighted_risk * 0.9, 1)))
    icu_transfer = min(95, max(2, round(weighted_risk * 0.65, 1)))
    med_escalation = min(95, max(2, round(weighted_risk * 0.5, 1)))

    # Combine all alerts
    all_alerts = (bp.get("bp_alerts", []) + hr_r.get("alerts", []) +
                  spo2_r.get("alerts", []) + rr_r.get("alerts", []) +
                  temp_r.get("alerts", []))

    # Medication summary
    active_meds = []
    for src, label in [(bp, "BP"), (hr_r, "HR"), (temp_r, "Temp")]:
        plan_key = "prescription_plan" if "prescription_plan" in src else "support_plan"
        plan = src.get(plan_key, {})
        if plan and plan.get("primary_plan"):
            for m in plan["primary_plan"]:
                med_name = m.get("medication", m.get("support", m.get("therapy", "Unknown")))
                active_meds.append({"vital": label, "medication": med_name,
                                    "dosage": m.get("dosage", ""), "stage": plan.get("stage", "")})
    for src, label in [(spo2_r, "SpO₂"), (rr_r, "RR")]:
        plan_key = "support_plan" if "support_plan" in src else "therapy_plan"
        plan = src.get(plan_key, {})
        if plan and plan.get("primary_plan"):
            for m in plan["primary_plan"]:
                med_name = m.get("support", m.get("therapy", "Unknown"))
                active_meds.append({"vital": label, "medication": med_name,
                                    "dosage": m.get("dosage", m.get("flow_rate", "")), "stage": plan.get("stage", "")})

    return {
        "patient_id": pid, "patient_name": name, "bed": bed,
        "overall_stability_score": stability,
        "stability_status": status,
        "stability_color": color,
        "vital_risks": {
            "bp": bp_risk, "hr": hr_risk, "spo2": spo2_risk,
            "rr": rr_risk, "temp": temp_risk,
        },
        "predictions": {
            "deterioration_24h": deterioration_24h,
            "icu_transfer_probability": icu_transfer,
            "medication_escalation_probability": med_escalation,
        },
        "active_medications": active_meds,
        "total_alerts": len(all_alerts),
        "alerts": all_alerts,
    }
