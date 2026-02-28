"""
Temperature Engine — VITALGUARD 2.0
Temperature module: sub-parameters, risk, infection/medication engine,
before/after tracking, prediction, variance, alerts.
"""
import math, random, time
from datetime import datetime, timezone, timedelta
from typing import Dict, List

# ═════════════════════════════════════════════════════════════════════
#  1. SUB-PARAMETERS
# ═════════════════════════════════════════════════════════════════════

def calc_temp_sub_parameters(temp: float, hr: float) -> dict:
    avg_24h = round(temp + random.gauss(-0.2, 0.3), 1)
    avg_24h = max(34, min(42, avg_24h))
    return {
        "current_temp": round(temp, 1),
        "avg_24h": avg_24h,
        "fever": temp > 38.0,
        "high_fever": temp > 39.0,
        "hypothermia": temp < 35.0,
        "heart_rate": round(hr, 1),
    }

# ═════════════════════════════════════════════════════════════════════
#  2. RISK
# ═════════════════════════════════════════════════════════════════════

def calc_temp_risk(sub: dict) -> dict:
    temp = sub["current_temp"]
    raw = 0; breakdown = []
    if temp > 39.5:
        raw += 30; breakdown.append({"factor": "High Fever >39.5°C", "points": 30})
    elif temp > 38.5:
        raw += 20; breakdown.append({"factor": "Moderate Fever >38.5°C", "points": 20})
    elif temp > 38.0:
        raw += 10; breakdown.append({"factor": "Mild Fever >38°C", "points": 10})
    if temp < 35.0:
        raw += 25; breakdown.append({"factor": "Hypothermia <35°C", "points": 25})
    if sub["heart_rate"] > 100:
        raw += 10; breakdown.append({"factor": "Associated Tachycardia HR >100", "points": 10})

    max_score = 65
    pct = min(100, round((raw / max_score) * 100, 1))
    infection_prob = min(95, max(2, round(pct * 0.9 + random.gauss(0, 3), 1)))
    sepsis_risk = min(95, max(1, round(pct * 0.55 + random.gauss(0, 3), 1)))

    if pct >= 75: cat, col = "Critical", "red"
    elif pct >= 50: cat, col = "High", "orange"
    elif pct >= 25: cat, col = "Moderate", "yellow"
    else: cat, col = "Normal", "green"

    return {
        "raw_score": raw, "max_possible": max_score, "percentage": pct,
        "category": cat, "color": col,
        "infection_progression_prob": infection_prob,
        "sepsis_risk_pct": sepsis_risk,
        "breakdown": breakdown,
    }

# ═════════════════════════════════════════════════════════════════════
#  3. MEDICATION ENGINE
# ═════════════════════════════════════════════════════════════════════

DRUG_EFFECTS_TEMP = {
    "Paracetamol (Oral)":   {"temp_reduce": 1.2, "class": "Antipyretic (Oral)"},
    "Paracetamol (IV)":     {"temp_reduce": 1.8, "class": "Antipyretic (IV)"},
    "Ibuprofen":            {"temp_reduce": 1.0, "class": "NSAID Antipyretic"},
    "Physical Cooling":     {"temp_reduce": 0.5, "class": "Non-pharmacological"},
}

def generate_temp_prescription(sub: dict, risk: dict) -> dict:
    temp = sub["current_temp"]
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    if temp > 39.0 or risk["percentage"] > 75:
        stage = "HIGH FEVER"
        primary = [
            {"medication": "Paracetamol (IV)", "dosage": "1g", "frequency": "Every 6 hours",
             "timing": "N/A (IV)", "meal_period": "N/A", "duration_days": 5,
             "expected_temp_reduction": 1.8},
            {"medication": "Physical Cooling", "dosage": "Tepid sponging", "frequency": "Every 2 hours",
             "timing": "Continuous", "meal_period": "N/A", "duration_days": 3,
             "expected_temp_reduction": 0.5},
        ]
        alternative = [
            {"medication": "Ibuprofen", "dosage": "400 mg", "frequency": "Every 8 hours",
             "timing": "After food", "meal_period": "Morning, Afternoon, Night", "duration_days": 5,
             "expected_temp_reduction": 1.0},
        ]
        notes = "IV antipyretic initiated. Blood cultures x2 MANDATORY. Infection workup: CBC, CRP, Procalcitonin. Sepsis screening."
    elif temp > 38.0:
        stage = "MILD FEVER"
        primary = [
            {"medication": "Paracetamol (Oral)", "dosage": "500–650 mg", "frequency": "Every 6 hours",
             "timing": "After food", "meal_period": "As needed", "duration_days": 5,
             "expected_temp_reduction": 1.2},
        ]
        alternative = [
            {"medication": "Ibuprofen", "dosage": "200 mg", "frequency": "Every 8 hours",
             "timing": "After food", "meal_period": "Morning, Afternoon, Night", "duration_days": 3,
             "expected_temp_reduction": 1.0},
        ]
        notes = "Oral antipyretic. Adequate hydration. Monitor for rising trend. Infection workup if fever persists >48 hours."
    elif temp < 35.0:
        stage = "HYPOTHERMIA"
        primary = [
            {"medication": "Active Warming", "dosage": "Warming blanket + warm IV fluids", "frequency": "Continuous",
             "timing": "Immediate", "meal_period": "N/A", "duration_days": 2,
             "expected_temp_increase": 1.5},
        ]
        alternative = None
        notes = "CRITICAL: Hypothermia protocol. Warm IV fluids, forced-air warming blanket. Continuous core temp monitoring. Check thyroid function."
    else:
        stage = "NORMAL"
        primary = []; alternative = None
        notes = "Temperature within normal limits. No intervention needed. Continue monitoring."

    for plan in [primary, alternative or []]:
        for med in plan:
            med["start_date"] = today
            med["end_date"] = (datetime.now(timezone.utc) + timedelta(days=med["duration_days"])).strftime("%Y-%m-%d")

    return {"stage": stage, "primary_plan": primary, "alternative_plan": alternative,
            "clinical_notes": notes, "generated_at": datetime.now(timezone.utc).isoformat()}

# ═════════════════════════════════════════════════════════════════════
#  4–7. HISTORY, PREDICTION, VARIANCE, ALERTS
# ═════════════════════════════════════════════════════════════════════
_temp_history: Dict[str, List[dict]] = {}
_temp_log: Dict[str, List[dict]] = {}

def store_temp_medication(pid, rx):
    if pid not in _temp_history: _temp_history[pid] = []
    _temp_history[pid].append({"prescribed_at": rx["generated_at"], "stage": rx["stage"], "medications": rx["primary_plan"]})
    _temp_history[pid] = _temp_history[pid][-20:]
def get_temp_med_history(pid): return _temp_history.get(pid, [])

def predict_temp_outcome(sub, risk_pct, prescription=None):
    temp = sub["current_temp"]
    z_before = 0.040 * max(0, temp - 37.5) + 0.030 * max(0, 35.5 - temp) + 0.012 * (risk_pct / 100)
    sig_b = 1 / (1 + math.exp(-z_before))
    risk_before = min(95, max(3, round(sig_b * 100, 1)))

    active_meds = []; total_reduce = 0
    if prescription and prescription.get("primary_plan"):
        for med in prescription["primary_plan"]:
            eff = DRUG_EFFECTS_TEMP.get(med["medication"], {})
            red = eff.get("temp_reduce", 0)
            inc = med.get("expected_temp_increase", 0)
            total_reduce += red
            active_meds.append({
                "medication": med["medication"], "dosage": med["dosage"],
                "drug_class": eff.get("class", "Antipyretic"),
                "timing": med["timing"],
                "expected_effect": f"↓{red}°C" if red else f"↑{inc}°C",
                "status": "Active",
            })

    temp_after = max(35.0, temp - total_reduce)
    z_after = 0.040 * max(0, temp_after - 37.5) + 0.030 * max(0, 35.5 - temp_after) + 0.005 * (risk_pct / 100)
    osc = math.sin(time.time() * 0.1) * 0.03 + random.gauss(0, 0.02)
    sig_a = 1 / (1 + math.exp(-(z_after + osc)))
    risk_after = min(95, max(3, round(sig_a * 100, 1)))

    pw = min(95, max(3, round(sig_a * 100, 1)))
    ps = min(95, max(3, round((1 - sig_a) * 60, 1)))
    pi = round(max(2, 100 - pw - ps), 1)
    t = pw + ps + pi
    if t != 100: ps = round(ps + (100 - t), 1)
    if pw >= 60: trend, tc = "Worsening", "red"
    elif pw >= 40: trend, tc = "Stable", "yellow"
    else: trend, tc = "Improving", "green"

    return {
        "risk_before_medication": risk_before, "risk_after_medication": risk_after,
        "risk_reduction": round(risk_before - risk_after, 1),
        "projected_temp_after_med": round(temp_after, 1),
        "medication_inputs": active_meds, "total_temp_reduction": total_reduce,
        "prob_worsening": pw, "prob_stabilization": ps, "prob_improvement": pi,
        "trend": trend, "trend_color": tc, "horizon": "24 hours",
        "input_parameters": {"current_temp": temp, "avg_24h": sub["avg_24h"],
                             "heart_rate": sub["heart_rate"], "current_risk": risk_pct},
    }

def record_temp_reading(pid, temp, risk_pct):
    if pid not in _temp_log: _temp_log[pid] = []
    _temp_log[pid].append({"timestamp": datetime.now(timezone.utc).isoformat(), "temp": round(temp, 1), "risk_pct": round(risk_pct, 1)})
    _temp_log[pid] = _temp_log[pid][-60:]
def get_temp_log(pid): return _temp_log.get(pid, [])

def check_temp_alerts(pid, name, bed, sub, risk_pct):
    alerts = []; ts = datetime.now(timezone.utc).isoformat(); temp = sub["current_temp"]
    if temp > 39.5: alerts.append({"type": "TEMP_ALERT", "severity": "critical", "message": f"High Fever: {temp}°C >39.5", "patient_id": pid, "patient_name": name, "bed": bed, "timestamp": ts})
    elif temp > 38.0: alerts.append({"type": "TEMP_ALERT", "severity": "warning", "message": f"Fever: {temp}°C >38", "patient_id": pid, "patient_name": name, "bed": bed, "timestamp": ts})
    if temp < 35.0: alerts.append({"type": "TEMP_ALERT", "severity": "critical", "message": f"Hypothermia: {temp}°C <35", "patient_id": pid, "patient_name": name, "bed": bed, "timestamp": ts})
    if risk_pct > 80: alerts.append({"type": "TEMP_ALERT", "severity": "critical", "message": f"Temp Risk {risk_pct}% >80%", "patient_id": pid, "patient_name": name, "bed": bed, "timestamp": ts})
    return alerts

def run_temp_analysis(pid, name, bed, temp, hr):
    sub = calc_temp_sub_parameters(temp, hr)
    risk = calc_temp_risk(sub)
    rx = generate_temp_prescription(sub, risk)
    if rx["primary_plan"]: store_temp_medication(pid, rx)
    prediction = predict_temp_outcome(sub, risk["percentage"], rx)
    record_temp_reading(pid, temp, risk["percentage"])
    alerts = check_temp_alerts(pid, name, bed, sub, risk["percentage"])
    return {
        "patient_id": pid, "patient_name": name, "bed": bed,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "sub_parameters": sub, "risk_score": risk,
        "prescription_plan": rx, "medication_history": get_temp_med_history(pid),
        "prediction_output": prediction,
        "hourly_variance_data": get_temp_log(pid), "alerts": alerts,
    }
