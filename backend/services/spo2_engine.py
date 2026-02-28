"""
SpO2 Engine — VITALGUARD 2.0
Oxygen saturation module: sub-parameters, risk, oxygen support engine,
before/after tracking, prediction, variance, alerts.
"""
import math, random, time
from datetime import datetime, timezone, timedelta
from typing import Dict, List

# ═════════════════════════════════════════════════════════════════════
#  1. SUB-PARAMETERS
# ═════════════════════════════════════════════════════════════════════

def calc_spo2_sub_parameters(spo2: float, rr: float) -> dict:
    avg_24h = round(spo2 + random.gauss(0.5, 0.8), 1)
    avg_24h = max(80, min(100, avg_24h))
    fluctuation = round(abs(spo2 - avg_24h) + random.gauss(0, 0.5), 1)
    return {
        "current_spo2": round(spo2, 1),
        "avg_24h": avg_24h,
        "fluctuation": fluctuation,
        "hypoxia": spo2 < 94,
        "severe_hypoxia": spo2 < 88,
        "resp_rate": round(rr, 1),
    }

# ═════════════════════════════════════════════════════════════════════
#  2. RISK CALCULATION
# ═════════════════════════════════════════════════════════════════════

def calc_spo2_risk(sub: dict) -> dict:
    spo2 = sub["current_spo2"]
    raw = 0
    breakdown = []
    if spo2 < 88:
        raw += 35; breakdown.append({"factor": "Severe Hypoxia SpO₂ <88%", "points": 35})
    elif spo2 < 92:
        raw += 25; breakdown.append({"factor": "Moderate Hypoxia SpO₂ <92%", "points": 25})
    elif spo2 < 94:
        raw += 15; breakdown.append({"factor": "Mild Hypoxia SpO₂ <94%", "points": 15})
    if sub["fluctuation"] > 3:
        raw += 10; breakdown.append({"factor": "SpO₂ Fluctuation >3%", "points": 10})
    if sub["resp_rate"] > 25:
        raw += 10; breakdown.append({"factor": "Tachypnea RR >25", "points": 10})

    max_score = 55
    pct = min(100, round((raw / max_score) * 100, 1))
    resp_deterioration = min(95, max(2, round(pct * 0.9 + random.gauss(0, 3), 1)))
    o2_dependency = min(95, max(2, round(pct * 0.7 + random.gauss(0, 3), 1)))

    if pct >= 75: cat, col = "Critical", "red"
    elif pct >= 50: cat, col = "High", "orange"
    elif pct >= 25: cat, col = "Moderate", "yellow"
    else: cat, col = "Stable", "green"

    return {
        "raw_score": raw, "max_possible": max_score, "percentage": pct,
        "category": cat, "color": col,
        "respiratory_deterioration_prob": resp_deterioration,
        "oxygen_dependency_risk": o2_dependency,
        "breakdown": breakdown,
    }

# ═════════════════════════════════════════════════════════════════════
#  3. SUPPORT RECOMMENDATION ENGINE
# ═════════════════════════════════════════════════════════════════════

SUPPORT_EFFECTS = {
    "Nasal Cannula 2L":     {"spo2_improve": 3, "type": "Low-flow Oxygen"},
    "Nasal Cannula 4L":     {"spo2_improve": 5, "type": "Low-flow Oxygen"},
    "Face Mask 6–10L":      {"spo2_improve": 8, "type": "Medium-flow Oxygen"},
    "High-Flow Nasal 15–60L": {"spo2_improve": 12, "type": "High-flow Oxygen"},
    "Non-Rebreather Mask":  {"spo2_improve": 15, "type": "High-flow Oxygen"},
}

def generate_spo2_support(sub: dict, risk: dict) -> dict:
    spo2 = sub["current_spo2"]
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    if spo2 < 88:
        stage = "SEVERE HYPOXIA"
        primary = [
            {"support": "High-Flow Nasal 15–60L", "flow_rate": "15–60 L/min",
             "frequency": "Continuous", "duration_days": 7, "monitoring": "Every 30 min",
             "expected_spo2_improvement": 12},
        ]
        alternative = [
            {"support": "Non-Rebreather Mask", "flow_rate": "10–15 L/min",
             "frequency": "Continuous", "duration_days": 5, "monitoring": "Every 30 min",
             "expected_spo2_improvement": 15},
        ]
        notes = "CRITICAL: ICU review STAT. Prepare for intubation if no improvement in 1 hour. ABG mandatory."
    elif spo2 < 92:
        stage = "MODERATE HYPOXIA"
        primary = [
            {"support": "Face Mask 6–10L", "flow_rate": "6–10 L/min",
             "frequency": "Continuous", "duration_days": 5, "monitoring": "Every 1 hour",
             "expected_spo2_improvement": 8},
        ]
        alternative = [
            {"support": "Nasal Cannula 4L", "flow_rate": "4 L/min",
             "frequency": "Continuous", "duration_days": 5, "monitoring": "Every 1 hour",
             "expected_spo2_improvement": 5},
        ]
        notes = "Oxygen support initiated. Monitor SpO₂ trending. Chest X-ray recommended."
    elif spo2 < 94:
        stage = "MILD HYPOXIA"
        primary = [
            {"support": "Nasal Cannula 2L", "flow_rate": "2 L/min",
             "frequency": "As needed", "duration_days": 3, "monitoring": "Every 2 hours",
             "expected_spo2_improvement": 3},
        ]
        alternative = None
        notes = "Low-flow supplemental oxygen. Monitor for worsening. Deep breathing exercises recommended."
    else:
        stage = "NORMAL"
        primary = []
        alternative = None
        notes = "SpO₂ within normal limits. No oxygen support needed. Continue monitoring."

    for plan in [primary, alternative or []]:
        for item in plan:
            item["start_date"] = today
            item["end_date"] = (datetime.now(timezone.utc) + timedelta(days=item["duration_days"])).strftime("%Y-%m-%d")

    return {
        "stage": stage, "primary_plan": primary, "alternative_plan": alternative,
        "clinical_notes": notes, "generated_at": datetime.now(timezone.utc).isoformat(),
    }

# ═════════════════════════════════════════════════════════════════════
#  4–7. HISTORY, PREDICTION, VARIANCE, ALERTS
# ═════════════════════════════════════════════════════════════════════
_spo2_history: Dict[str, List[dict]] = {}
_spo2_log: Dict[str, List[dict]] = {}

def store_spo2_support(pid, rx):
    if pid not in _spo2_history: _spo2_history[pid] = []
    _spo2_history[pid].append({"prescribed_at": rx["generated_at"], "stage": rx["stage"], "supports": rx["primary_plan"]})
    _spo2_history[pid] = _spo2_history[pid][-20:]

def get_spo2_support_history(pid): return _spo2_history.get(pid, [])

def predict_spo2_outcome(sub, risk_pct, support=None):
    spo2 = sub["current_spo2"]
    z_before = 0.035 * max(0, 95 - spo2) + 0.012 * (risk_pct / 100)
    sig_b = 1 / (1 + math.exp(-z_before))
    risk_before = min(95, max(3, round(sig_b * 100, 1)))

    active_supports = []
    total_improve = 0
    if support and support.get("primary_plan"):
        for s in support["primary_plan"]:
            eff = SUPPORT_EFFECTS.get(s["support"], {})
            imp = eff.get("spo2_improve", 0)
            total_improve += imp
            active_supports.append({
                "support": s["support"], "flow_rate": s["flow_rate"],
                "type": eff.get("type", "Oxygen"), "expected_improvement": f"+{imp}%", "status": "Active",
            })

    spo2_after = min(100, spo2 + total_improve)
    z_after = 0.035 * max(0, 95 - spo2_after) + 0.005 * (risk_pct / 100)
    osc = math.sin(time.time() * 0.1) * 0.03 + random.gauss(0, 0.02)
    sig_a = 1 / (1 + math.exp(-(z_after + osc)))
    risk_after = min(95, max(3, round(sig_a * 100, 1)))

    prob_worsen = min(95, max(3, round(sig_a * 100, 1)))
    prob_stable = min(95, max(3, round((1 - sig_a) * 60, 1)))
    prob_improve = round(max(2, 100 - prob_worsen - prob_stable), 1)
    t = prob_worsen + prob_stable + prob_improve
    if t != 100: prob_stable = round(prob_stable + (100 - t), 1)
    if prob_worsen >= 60: trend, tc = "Worsening", "red"
    elif prob_worsen >= 40: trend, tc = "Stable", "yellow"
    else: trend, tc = "Improving", "green"

    return {
        "risk_before_support": risk_before, "risk_after_support": risk_after,
        "risk_reduction": round(risk_before - risk_after, 1),
        "projected_spo2_after": round(spo2_after, 1),
        "support_inputs": active_supports, "total_spo2_improvement": total_improve,
        "prob_worsening": prob_worsen, "prob_stabilization": prob_stable,
        "prob_improvement": prob_improve, "trend": trend, "trend_color": tc,
        "horizon": "24 hours",
        "input_parameters": {"current_spo2": spo2, "avg_24h": sub["avg_24h"],
                             "fluctuation": sub["fluctuation"], "resp_rate": sub["resp_rate"], "current_risk": risk_pct},
    }

def record_spo2_reading(pid, spo2, risk_pct):
    if pid not in _spo2_log: _spo2_log[pid] = []
    _spo2_log[pid].append({"timestamp": datetime.now(timezone.utc).isoformat(), "spo2": round(spo2, 1), "risk_pct": round(risk_pct, 1)})
    _spo2_log[pid] = _spo2_log[pid][-60:]

def get_spo2_log(pid): return _spo2_log.get(pid, [])

def check_spo2_alerts(pid, name, bed, sub, risk_pct):
    alerts = []
    ts = datetime.now(timezone.utc).isoformat()
    spo2 = sub["current_spo2"]
    if spo2 < 88:
        alerts.append({"type": "SPO2_ALERT", "severity": "critical", "message": f"Severe Hypoxia: SpO₂ {spo2}% <88%", "patient_id": pid, "patient_name": name, "bed": bed, "timestamp": ts})
    elif spo2 < 92:
        alerts.append({"type": "SPO2_ALERT", "severity": "warning", "message": f"Moderate Hypoxia: SpO₂ {spo2}% <92%", "patient_id": pid, "patient_name": name, "bed": bed, "timestamp": ts})
    if risk_pct > 80:
        alerts.append({"type": "SPO2_ALERT", "severity": "critical", "message": f"SpO₂ Risk {risk_pct}% >80%", "patient_id": pid, "patient_name": name, "bed": bed, "timestamp": ts})
    return alerts

def run_spo2_analysis(pid, name, bed, spo2, rr):
    sub = calc_spo2_sub_parameters(spo2, rr)
    risk = calc_spo2_risk(sub)
    support = generate_spo2_support(sub, risk)
    if support["primary_plan"]: store_spo2_support(pid, support)
    prediction = predict_spo2_outcome(sub, risk["percentage"], support)
    record_spo2_reading(pid, spo2, risk["percentage"])
    alerts = check_spo2_alerts(pid, name, bed, sub, risk["percentage"])
    return {
        "patient_id": pid, "patient_name": name, "bed": bed,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "sub_parameters": sub, "risk_score": risk,
        "support_plan": support, "support_history": get_spo2_support_history(pid),
        "prediction_output": prediction,
        "hourly_variance_data": get_spo2_log(pid), "alerts": alerts,
    }
