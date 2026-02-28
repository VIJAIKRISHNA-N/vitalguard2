"""
Respiratory Rate Engine — VITALGUARD 2.0
RR module: sub-parameters, risk, therapy/escalation engine,
before/after tracking, prediction, variance, alerts.
"""
import math, random, time
from datetime import datetime, timezone, timedelta
from typing import Dict, List

# ═════════════════════════════════════════════════════════════════════
#  1. SUB-PARAMETERS
# ═════════════════════════════════════════════════════════════════════

def calc_rr_sub_parameters(rr: float, spo2: float) -> dict:
    avg_24h = round(rr + random.gauss(0, 1.5), 1)
    avg_24h = max(6, min(45, avg_24h))
    return {
        "current_rr": round(rr, 1),
        "avg_24h": avg_24h,
        "tachypnea": rr > 20,
        "severe_tachypnea": rr > 30,
        "bradypnea": rr < 10,
        "severe_bradypnea": rr < 8,
        "spo2": round(spo2, 1),
    }

# ═════════════════════════════════════════════════════════════════════
#  2. RISK
# ═════════════════════════════════════════════════════════════════════

def calc_rr_risk(sub: dict) -> dict:
    rr = sub["current_rr"]
    raw = 0; breakdown = []
    if rr > 30:
        raw += 30; breakdown.append({"factor": "Severe Tachypnea RR >30", "points": 30})
    elif rr > 25:
        raw += 20; breakdown.append({"factor": "Tachypnea RR >25", "points": 20})
    elif rr > 20:
        raw += 10; breakdown.append({"factor": "Elevated RR >20", "points": 10})
    if rr < 8:
        raw += 30; breakdown.append({"factor": "Critical Bradypnea RR <8", "points": 30})
    elif rr < 10:
        raw += 15; breakdown.append({"factor": "Bradypnea RR <10", "points": 15})
    if sub["spo2"] < 92:
        raw += 15; breakdown.append({"factor": "Associated Hypoxia SpO₂ <92%", "points": 15})

    max_score = 75
    pct = min(100, round((raw / max_score) * 100, 1))
    resp_failure = min(95, max(2, round(pct * 0.85 + random.gauss(0, 3), 1)))
    icu_escalation = min(95, max(2, round(pct * 0.7 + random.gauss(0, 3), 1)))

    if pct >= 75: cat, col = "Critical", "red"
    elif pct >= 50: cat, col = "High", "orange"
    elif pct >= 25: cat, col = "Moderate", "yellow"
    else: cat, col = "Normal", "green"

    return {
        "raw_score": raw, "max_possible": max_score, "percentage": pct,
        "category": cat, "color": col,
        "respiratory_failure_prob": resp_failure,
        "icu_escalation_pct": icu_escalation,
        "breakdown": breakdown,
    }

# ═════════════════════════════════════════════════════════════════════
#  3. THERAPY ENGINE
# ═════════════════════════════════════════════════════════════════════

THERAPY_EFFECTS = {
    "Salbutamol Nebulization":  {"rr_reduce": 5, "type": "Bronchodilator"},
    "Ipratropium Nebulization": {"rr_reduce": 4, "type": "Anticholinergic"},
    "Oxygen Reassessment":      {"rr_reduce": 3, "type": "Oxygen Support"},
    "BiPAP Support":            {"rr_reduce": 8, "type": "Non-Invasive Ventilation"},
}

def generate_rr_therapy(sub: dict, risk: dict) -> dict:
    rr = sub["current_rr"]
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    if rr > 30 or risk["percentage"] > 75:
        stage = "SEVERE TACHYPNEA"
        primary = [
            {"therapy": "Salbutamol Nebulization", "dosage": "2.5–5 mg", "frequency": "Every 4 hours",
             "duration_days": 7, "monitoring": "Every 30 min", "expected_rr_reduction": 5},
            {"therapy": "BiPAP Support", "dosage": "IPAP 12/EPAP 5", "frequency": "Continuous",
             "duration_days": 3, "monitoring": "Continuous", "expected_rr_reduction": 8},
        ]
        alternative = None
        notes = "ICU escalation alert. Prepare for intubation if RR remains >30. ABG and chest X-ray STAT."
    elif rr > 25:
        stage = "TACHYPNEA"
        primary = [
            {"therapy": "Salbutamol Nebulization", "dosage": "2.5 mg", "frequency": "Every 6 hours",
             "duration_days": 5, "monitoring": "Every 1 hour", "expected_rr_reduction": 5},
        ]
        alternative = [
            {"therapy": "Ipratropium Nebulization", "dosage": "0.5 mg", "frequency": "Every 6 hours",
             "duration_days": 5, "monitoring": "Every 1 hour", "expected_rr_reduction": 4},
        ]
        notes = "Nebulization therapy initiated. Reassess oxygen if SpO₂ drops. Pulmonology consult if no improvement."
    elif rr > 20:
        stage = "ELEVATED"
        primary = [
            {"therapy": "Oxygen Reassessment", "dosage": "Titrate to SpO₂ >94%", "frequency": "Every 2 hours",
             "duration_days": 3, "monitoring": "Every 2 hours", "expected_rr_reduction": 3},
        ]
        alternative = None
        notes = "Mild RR elevation. Monitor trend. Deep breathing exercises. Ensure pain management adequate."
    else:
        stage = "NORMAL"
        primary = []; alternative = None
        notes = "Respiratory rate within normal limits. Continue routine monitoring."

    for plan in [primary, alternative or []]:
        for item in plan:
            item["start_date"] = today
            item["end_date"] = (datetime.now(timezone.utc) + timedelta(days=item["duration_days"])).strftime("%Y-%m-%d")

    return {"stage": stage, "primary_plan": primary, "alternative_plan": alternative,
            "clinical_notes": notes, "generated_at": datetime.now(timezone.utc).isoformat()}

# ═════════════════════════════════════════════════════════════════════
#  4–7. HISTORY, PREDICTION, VARIANCE, ALERTS
# ═════════════════════════════════════════════════════════════════════
_rr_history: Dict[str, List[dict]] = {}
_rr_log: Dict[str, List[dict]] = {}

def store_rr_therapy(pid, rx):
    if pid not in _rr_history: _rr_history[pid] = []
    _rr_history[pid].append({"prescribed_at": rx["generated_at"], "stage": rx["stage"], "therapies": rx["primary_plan"]})
    _rr_history[pid] = _rr_history[pid][-20:]
def get_rr_therapy_history(pid): return _rr_history.get(pid, [])

def predict_rr_outcome(sub, risk_pct, therapy=None):
    rr = sub["current_rr"]
    z_before = 0.030 * max(0, rr - 18) + 0.025 * max(0, 10 - rr) + 0.012 * (risk_pct / 100)
    sig_b = 1 / (1 + math.exp(-z_before))
    risk_before = min(95, max(3, round(sig_b * 100, 1)))

    active_therapies = []; total_effect = 0
    if therapy and therapy.get("primary_plan"):
        for t in therapy["primary_plan"]:
            eff = THERAPY_EFFECTS.get(t["therapy"], {})
            red = eff.get("rr_reduce", 0)
            total_effect += red
            active_therapies.append({"therapy": t["therapy"], "dosage": t["dosage"],
                                     "type": eff.get("type", "Therapy"), "expected_rr_reduction": red, "status": "Active"})

    rr_after = max(8, rr - total_effect)
    z_after = 0.030 * max(0, rr_after - 18) + 0.025 * max(0, 10 - rr_after) + 0.005 * (risk_pct / 100)
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
        "risk_before_therapy": risk_before, "risk_after_therapy": risk_after,
        "risk_reduction": round(risk_before - risk_after, 1),
        "projected_rr_after": round(rr_after, 1),
        "therapy_inputs": active_therapies, "total_rr_reduction": total_effect,
        "prob_worsening": pw, "prob_stabilization": ps, "prob_improvement": pi,
        "trend": trend, "trend_color": tc, "horizon": "24 hours",
        "input_parameters": {"current_rr": rr, "avg_24h": sub["avg_24h"], "spo2": sub["spo2"], "current_risk": risk_pct},
    }

def record_rr_reading(pid, rr, risk_pct):
    if pid not in _rr_log: _rr_log[pid] = []
    _rr_log[pid].append({"timestamp": datetime.now(timezone.utc).isoformat(), "rr": round(rr, 1), "risk_pct": round(risk_pct, 1)})
    _rr_log[pid] = _rr_log[pid][-60:]
def get_rr_log(pid): return _rr_log.get(pid, [])

def check_rr_alerts(pid, name, bed, sub, risk_pct):
    alerts = []; ts = datetime.now(timezone.utc).isoformat(); rr = sub["current_rr"]
    if rr > 30: alerts.append({"type": "RR_ALERT", "severity": "critical", "message": f"Severe Tachypnea: RR {rr} >30", "patient_id": pid, "patient_name": name, "bed": bed, "timestamp": ts})
    elif rr > 25: alerts.append({"type": "RR_ALERT", "severity": "warning", "message": f"Tachypnea: RR {rr} >25", "patient_id": pid, "patient_name": name, "bed": bed, "timestamp": ts})
    if rr < 8: alerts.append({"type": "RR_ALERT", "severity": "critical", "message": f"Critical Bradypnea: RR {rr} <8", "patient_id": pid, "patient_name": name, "bed": bed, "timestamp": ts})
    if risk_pct > 80: alerts.append({"type": "RR_ALERT", "severity": "critical", "message": f"RR Risk {risk_pct}% >80%", "patient_id": pid, "patient_name": name, "bed": bed, "timestamp": ts})
    return alerts

def run_rr_analysis(pid, name, bed, rr, spo2):
    sub = calc_rr_sub_parameters(rr, spo2)
    risk = calc_rr_risk(sub)
    therapy = generate_rr_therapy(sub, risk)
    if therapy["primary_plan"]: store_rr_therapy(pid, therapy)
    prediction = predict_rr_outcome(sub, risk["percentage"], therapy)
    record_rr_reading(pid, rr, risk["percentage"])
    alerts = check_rr_alerts(pid, name, bed, sub, risk["percentage"])
    return {
        "patient_id": pid, "patient_name": name, "bed": bed,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "sub_parameters": sub, "risk_score": risk,
        "therapy_plan": therapy, "therapy_history": get_rr_therapy_history(pid),
        "prediction_output": prediction,
        "hourly_variance_data": get_rr_log(pid), "alerts": alerts,
    }
