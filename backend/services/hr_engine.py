"""
Heart Rate Engine — VITALGUARD 2.0
Sub-parameters, risk scoring, medication engine, prescription,
before/after tracking, prediction, variance, and alerts.
ALL rule-based.
"""
import math, random, time
from datetime import datetime, timezone, timedelta
from typing import Dict, List

# ═════════════════════════════════════════════════════════════════════
#  1. SUB-PARAMETER CALCULATION
# ═════════════════════════════════════════════════════════════════════

def calc_hr_sub_parameters(hr: float, age: int, resting_hr: float = None) -> dict:
    if resting_hr is None:
        resting_hr = 72.0 if age < 60 else 68.0
    hrv = round(abs(hr - resting_hr) * 1.2 + random.gauss(0, 3), 1)
    hrv = max(5, min(80, hrv))
    # Age-adjusted normal range
    if age < 40:
        normal_lo, normal_hi = 60, 100
    elif age < 65:
        normal_lo, normal_hi = 58, 95
    else:
        normal_lo, normal_hi = 55, 90
    return {
        "current_hr": round(hr, 1),
        "resting_hr": round(resting_hr, 1),
        "hrv": hrv,
        "tachycardia": hr > 100,
        "severe_tachycardia": hr > 120,
        "bradycardia": hr < 60,
        "severe_bradycardia": hr < 50,
        "age": age,
        "normal_range": [normal_lo, normal_hi],
    }

# ═════════════════════════════════════════════════════════════════════
#  2. RISK CALCULATION
# ═════════════════════════════════════════════════════════════════════

def calc_hr_risk(sub: dict) -> dict:
    hr = sub["current_hr"]
    hrv = sub["hrv"]
    age = sub["age"]
    raw = 0
    breakdown = []

    if hr > 120:
        raw += 30; breakdown.append({"factor": "Severe Tachycardia >120 bpm", "points": 30})
    elif hr > 100:
        raw += 15; breakdown.append({"factor": "Tachycardia >100 bpm", "points": 15})
    if hr < 50:
        raw += 30; breakdown.append({"factor": "Severe Bradycardia <50 bpm", "points": 30})
    elif hr < 60:
        raw += 15; breakdown.append({"factor": "Bradycardia <60 bpm", "points": 15})
    if hrv > 40:
        raw += 10; breakdown.append({"factor": "High HRV >40ms", "points": 10})
    if hrv < 10:
        raw += 15; breakdown.append({"factor": "Very Low HRV <10ms (autonomic risk)", "points": 15})
    if age > 65:
        raw += 10; breakdown.append({"factor": "Age >65 years", "points": 10})

    max_score = 75
    pct = min(100, round((raw / max_score) * 100, 1))

    # Derived metrics
    cardiac_stress = min(100, round(pct * 1.1 + random.gauss(0, 2), 1))
    arrhythmia_prob = min(95, max(2, round(pct * 0.6 + (hrv / 5) + random.gauss(0, 3), 1)))
    deterioration_12h = min(95, max(3, round(pct * 0.8 + random.gauss(0, 4), 1)))

    if pct >= 75:  cat, col = "Critical", "red"
    elif pct >= 50: cat, col = "High", "orange"
    elif pct >= 25: cat, col = "Moderate", "yellow"
    else: cat, col = "Normal", "green"

    return {
        "raw_score": raw, "max_possible": max_score, "percentage": pct,
        "category": cat, "color": col,
        "cardiac_stress_pct": cardiac_stress,
        "arrhythmia_probability": arrhythmia_prob,
        "deterioration_12h": deterioration_12h,
        "breakdown": breakdown,
    }

# ═════════════════════════════════════════════════════════════════════
#  3. MEDICATION RECOMMENDATION ENGINE
# ═════════════════════════════════════════════════════════════════════

DRUG_EFFECTS_HR = {
    "Metoprolol":   {"hr_reduce": 15, "class": "Beta-Blocker"},
    "Atenolol":     {"hr_reduce": 12, "class": "Beta-Blocker"},
    "Diltiazem":    {"hr_reduce": 10, "class": "Calcium Channel Blocker"},
    "Atropine":     {"hr_increase": 20, "class": "Anticholinergic"},
}

def generate_hr_prescription(sub: dict, risk: dict) -> dict:
    hr = sub["current_hr"]
    risk_pct = risk["percentage"]
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    if hr > 120 or risk_pct > 75:
        stage = "SEVERE TACHYCARDIA"
        primary = [
            {"medication": "Metoprolol", "dosage": "25–50 mg", "frequency": "Twice daily",
             "timing": "After food", "meal_period": "Morning & Evening", "duration_days": 30,
             "expected_hr_reduction": 15},
            {"medication": "Diltiazem", "dosage": "30 mg", "frequency": "Three times daily",
             "timing": "After food", "meal_period": "Morning, Afternoon, Night", "duration_days": 14,
             "expected_hr_reduction": 10},
        ]
        alternative = None
        notes = "Urgent HR control needed. Continuous cardiac monitoring. ECG review mandatory."
    elif hr > 100:
        stage = "TACHYCARDIA"
        primary = [
            {"medication": "Metoprolol", "dosage": "12.5–25 mg", "frequency": "Once daily",
             "timing": "After food", "meal_period": "Morning", "duration_days": 30,
             "expected_hr_reduction": 15},
        ]
        alternative = [
            {"medication": "Atenolol", "dosage": "25 mg", "frequency": "Once daily",
             "timing": "Before food", "meal_period": "Morning", "duration_days": 30,
             "expected_hr_reduction": 12},
        ]
        notes = "Beta-blocker therapy. Monitor for hypotension. Reassess in 2 weeks."
    elif hr < 50:
        stage = "SEVERE BRADYCARDIA"
        primary = [
            {"medication": "Atropine", "dosage": "0.5–1 mg", "frequency": "As needed (IV)",
             "timing": "Emergency", "meal_period": "N/A", "duration_days": 1,
             "expected_hr_increase": 20},
        ]
        alternative = None
        notes = "CRITICAL: Cardiology review STAT. Consider temporary pacing. Stop all HR-lowering medications."
    elif hr < 60:
        stage = "BRADYCARDIA"
        primary = []
        alternative = None
        notes = "Monitor closely. Avoid HR-lowering BP meds (beta-blockers, diltiazem). Cardiology consult if symptomatic."
    else:
        stage = "NORMAL"
        primary = []
        alternative = None
        notes = "Heart rate within normal limits. Continue routine monitoring."

    for plan in [primary, alternative or []]:
        for med in plan:
            med["start_date"] = today
            med["end_date"] = (datetime.now(timezone.utc) + timedelta(days=med["duration_days"])).strftime("%Y-%m-%d")

    return {
        "stage": stage, "primary_plan": primary, "alternative_plan": alternative,
        "clinical_notes": notes, "generated_at": datetime.now(timezone.utc).isoformat(),
    }

# ═════════════════════════════════════════════════════════════════════
#  4. MEDICATION HISTORY
# ═════════════════════════════════════════════════════════════════════
_hr_med_history: Dict[str, List[dict]] = {}

def store_hr_medication(pid: str, rx: dict):
    if pid not in _hr_med_history: _hr_med_history[pid] = []
    _hr_med_history[pid].append({"prescribed_at": rx["generated_at"], "stage": rx["stage"], "medications": rx["primary_plan"]})
    _hr_med_history[pid] = _hr_med_history[pid][-20:]

def get_hr_med_history(pid: str) -> List[dict]:
    return _hr_med_history.get(pid, [])

# ═════════════════════════════════════════════════════════════════════
#  5. PREDICTION ENGINE (with medication correlation)
# ═════════════════════════════════════════════════════════════════════

def predict_hr_outcome(sub: dict, risk_pct: float, prescription: dict = None) -> dict:
    hr = sub["current_hr"]
    hrv = sub["hrv"]
    age = sub["age"]

    # Before-medication risk
    z_before = (0.025 * max(0, hr - 80) + 0.020 * max(0, 60 - hr) + 0.015 * max(0, 40 - hrv)
                + 0.008 * max(0, age - 50) + 0.012 * (risk_pct / 100))
    sig_b = 1 / (1 + math.exp(-z_before))
    risk_before = min(95, max(3, round(sig_b * 100, 1)))

    # Medication impact
    active_meds = []
    total_hr_effect = 0
    if prescription and prescription.get("primary_plan"):
        for med in prescription["primary_plan"]:
            eff = DRUG_EFFECTS_HR.get(med["medication"], {})
            hr_r = eff.get("hr_reduce", 0)
            hr_i = eff.get("hr_increase", 0)
            total_hr_effect += (hr_r - hr_i)
            active_meds.append({
                "medication": med["medication"], "dosage": med["dosage"],
                "drug_class": eff.get("class", "Unknown"), "timing": med["timing"],
                "expected_hr_change": f"↓{hr_r} bpm" if hr_r else f"↑{hr_i} bpm",
                "status": "Active",
            })

    # After-medication
    hr_after = max(45, hr - total_hr_effect)
    z_after = (0.025 * max(0, hr_after - 80) + 0.020 * max(0, 60 - hr_after) + 0.015 * max(0, 40 - hrv)
               + 0.008 * max(0, age - 50) + 0.005 * (risk_pct / 100))
    osc = math.sin(time.time() * 0.1) * 0.03 + random.gauss(0, 0.02)
    sig_a = 1 / (1 + math.exp(-(z_after + osc)))
    risk_after = min(95, max(3, round(sig_a * 100, 1)))

    prob_worsen = min(95, max(3, round(sig_a * 100, 1)))
    prob_stable = min(95, max(3, round((1 - sig_a) * 60, 1)))
    prob_improve = round(max(2, 100 - prob_worsen - prob_stable), 1)
    total = prob_worsen + prob_stable + prob_improve
    if total != 100: prob_stable = round(prob_stable + (100 - total), 1)

    if prob_worsen >= 60: trend, tc = "Worsening", "red"
    elif prob_worsen >= 40: trend, tc = "Stable", "yellow"
    else: trend, tc = "Improving", "green"

    return {
        "risk_before_medication": risk_before, "risk_after_medication": risk_after,
        "risk_reduction": round(risk_before - risk_after, 1),
        "projected_hr_after_med": round(hr_after, 1),
        "medication_inputs": active_meds, "total_hr_effect": total_hr_effect,
        "prob_worsening": prob_worsen, "prob_stabilization": prob_stable,
        "prob_improvement": prob_improve, "trend": trend, "trend_color": tc,
        "horizon": "12 hours",
        "input_parameters": {"current_hr": hr, "resting_hr": sub["resting_hr"], "hrv": hrv,
                             "age": age, "current_risk": risk_pct},
    }

# ═════════════════════════════════════════════════════════════════════
#  6. HOURLY VARIANCE
# ═════════════════════════════════════════════════════════════════════
_hr_log: Dict[str, List[dict]] = {}

def record_hr_reading(pid: str, hr: float, risk_pct: float):
    if pid not in _hr_log: _hr_log[pid] = []
    _hr_log[pid].append({"timestamp": datetime.now(timezone.utc).isoformat(),
                          "hr": round(hr, 1), "risk_pct": round(risk_pct, 1)})
    _hr_log[pid] = _hr_log[pid][-60:]

def get_hr_log(pid: str) -> List[dict]:
    return _hr_log.get(pid, [])

# ═════════════════════════════════════════════════════════════════════
#  7. ALERTS
# ═════════════════════════════════════════════════════════════════════

def check_hr_alerts(pid: str, name: str, bed: str, sub: dict, risk_pct: float) -> List[dict]:
    alerts = []
    ts = datetime.now(timezone.utc).isoformat()
    hr = sub["current_hr"]
    if hr > 120:
        alerts.append({"type": "HR_ALERT", "severity": "critical", "message": f"Severe Tachycardia: HR {hr} bpm >120", "patient_id": pid, "patient_name": name, "bed": bed, "timestamp": ts})
    elif hr > 100:
        alerts.append({"type": "HR_ALERT", "severity": "warning", "message": f"Tachycardia: HR {hr} bpm >100", "patient_id": pid, "patient_name": name, "bed": bed, "timestamp": ts})
    if hr < 50:
        alerts.append({"type": "HR_ALERT", "severity": "critical", "message": f"Severe Bradycardia: HR {hr} bpm <50", "patient_id": pid, "patient_name": name, "bed": bed, "timestamp": ts})
    elif hr < 60:
        alerts.append({"type": "HR_ALERT", "severity": "warning", "message": f"Bradycardia: HR {hr} bpm <60", "patient_id": pid, "patient_name": name, "bed": bed, "timestamp": ts})
    if risk_pct > 80:
        alerts.append({"type": "HR_ALERT", "severity": "critical", "message": f"HR Risk {risk_pct}% >80% — Critical monitoring", "patient_id": pid, "patient_name": name, "bed": bed, "timestamp": ts})
    return alerts

# ═════════════════════════════════════════════════════════════════════
#  MASTER FUNCTION
# ═════════════════════════════════════════════════════════════════════

def run_hr_analysis(pid: str, name: str, bed: str, hr: float, age: int, resting_hr: float = None) -> dict:
    sub = calc_hr_sub_parameters(hr, age, resting_hr)
    risk = calc_hr_risk(sub)
    rx = generate_hr_prescription(sub, risk)
    if rx["primary_plan"]: store_hr_medication(pid, rx)
    prediction = predict_hr_outcome(sub, risk["percentage"], rx)
    record_hr_reading(pid, hr, risk["percentage"])
    alerts = check_hr_alerts(pid, name, bed, sub, risk["percentage"])
    return {
        "patient_id": pid, "patient_name": name, "bed": bed,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "sub_parameters": sub, "risk_score": risk,
        "prescription_plan": rx, "medication_history": get_hr_med_history(pid),
        "prediction_output": prediction,
        "hourly_variance_data": get_hr_log(pid), "alerts": alerts,
    }
