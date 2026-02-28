"""
BP Engine — VITALGUARD 2.0
Blood Pressure module: sub-parameter calculation, risk scoring,
prescription generation, and 24-hour outcome prediction.
ALL rule-based — no ML model needed.
"""

import math
import random
import time
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional

# ═══════════════════════════════════════════════════════════════════════════════
#  1. BP SUB-PARAMETER CALCULATIONS
# ═══════════════════════════════════════════════════════════════════════════════

def calc_sub_parameters(sbp: float, dbp: float, hr: float,
                        sodium: float, age: int, bmi: float) -> dict:
    """
    Calculate BP sub-parameters from raw vitals.
    Returns: dict with all 8 sub-parameters.
    """
    pulse_pressure = round(sbp - dbp, 1)
    mean_arterial_pressure = round((2 * dbp + sbp) / 3, 1)
    return {
        "systolic": round(sbp, 1),
        "diastolic": round(dbp, 1),
        "pulse_pressure": pulse_pressure,
        "map": mean_arterial_pressure,
        "heart_rate": round(hr, 1),
        "sodium": round(sodium, 1),
        "age": age,
        "bmi": round(bmi, 1),
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  2. BP RISK CALCULATION ENGINE
# ═══════════════════════════════════════════════════════════════════════════════

def calc_bp_risk(sub_params: dict) -> dict:
    """
    Weighted composite risk score from BP sub-parameters.
    Returns: dict with score, percentage, category, interpretation.
    """
    raw = 0
    breakdown = []

    sys = sub_params["systolic"]
    dia = sub_params["diastolic"]
    map_val = sub_params["map"]
    hr = sub_params["heart_rate"]
    sodium = sub_params["sodium"]
    age = sub_params["age"]
    bmi = sub_params["bmi"]

    if sys >= 160:
        raw += 30; breakdown.append({"factor": "Systolic ≥160 mmHg", "points": 30})
    elif sys >= 140:
        raw += 20; breakdown.append({"factor": "Systolic ≥140 mmHg", "points": 20})

    if dia >= 90:
        raw += 15; breakdown.append({"factor": "Diastolic ≥90 mmHg", "points": 15})

    if map_val >= 100:
        raw += 10; breakdown.append({"factor": "MAP ≥100 mmHg", "points": 10})

    if hr > 100:
        raw += 10; breakdown.append({"factor": "Heart Rate >100 bpm", "points": 10})

    if sodium > 145:
        raw += 10; breakdown.append({"factor": "Sodium >145 mEq/L", "points": 10})

    if age > 60:
        raw += 10; breakdown.append({"factor": "Age >60 years", "points": 10})

    if bmi > 30:
        raw += 10; breakdown.append({"factor": "BMI >30 kg/m²", "points": 10})

    # Max possible = 30+15+10+10+10+10+10 = 95 → normalize
    max_score = 95
    pct = min(100.0, round((raw / max_score) * 100, 1))

    if pct >= 75:
        category = "Critical"
        color = "red"
        interpretation = (
            f"BP risk is CRITICAL ({pct}%). Multiple cardiovascular risk factors "
            f"are active. Immediate clinical intervention required. "
            f"Risk of hypertensive emergency or end-organ damage."
        )
    elif pct >= 50:
        category = "High"
        color = "orange"
        interpretation = (
            f"BP risk is HIGH ({pct}%). Several concerning factors identified. "
            f"Consider escalating treatment and increasing monitoring frequency."
        )
    elif pct >= 25:
        category = "Moderate"
        color = "yellow"
        interpretation = (
            f"BP risk is MODERATE ({pct}%). Some risk factors present but manageable. "
            f"Continue current treatment plan and monitor trend."
        )
    else:
        category = "Low"
        color = "green"
        interpretation = (
            f"BP risk is LOW ({pct}%). Blood pressure within or near normal limits. "
            f"No immediate concern. Maintain routine monitoring."
        )

    return {
        "raw_score": raw,
        "max_possible": max_score,
        "percentage": pct,
        "category": category,
        "color": color,
        "interpretation": interpretation,
        "breakdown": breakdown,
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  3. PRESCRIPTION GENERATION ENGINE
# ═══════════════════════════════════════════════════════════════════════════════

def generate_prescription(sub_params: dict, risk: dict) -> dict:
    """
    Rule-based prescription engine.
    Returns: dict with stage, primary/alternative plans, and notes.
    """
    sys = sub_params["systolic"]
    dia = sub_params["diastolic"]
    risk_pct = risk["percentage"]

    # — SEVERE (≥160 systolic OR Risk >75%)
    if sys >= 160 or risk_pct > 75:
        stage = "SEVERE"
        primary = [
            {"medication": "Valsartan", "dosage": "80–160 mg", "frequency": "Once daily",
             "timing": "Before food", "meal_period": "Morning", "duration_days": 60},
            {"medication": "Amlodipine", "dosage": "5–10 mg", "frequency": "Once daily",
             "timing": "After food", "meal_period": "Evening", "duration_days": 60},
            {"medication": "Hydrochlorothiazide", "dosage": "25 mg", "frequency": "Once daily",
             "timing": "After food", "meal_period": "Morning", "duration_days": 60},
        ]
        alternative = None
        notes = "Triple combination therapy. Monitor BP every 4 hours. Renal function check weekly."

    # — STAGE 2 (≥140 / ≥90)
    elif sys >= 140 or dia >= 90:
        stage = "STAGE 2"
        primary = [
            {"medication": "Lisinopril", "dosage": "10–20 mg", "frequency": "Once daily",
             "timing": "Before food", "meal_period": "Morning", "duration_days": 30},
            {"medication": "Amlodipine", "dosage": "5 mg", "frequency": "Once daily",
             "timing": "After food", "meal_period": "Evening", "duration_days": 30},
        ]
        alternative = [
            {"medication": "Losartan", "dosage": "50 mg", "frequency": "Once daily",
             "timing": "Before food", "meal_period": "Morning", "duration_days": 30},
            {"medication": "Hydrochlorothiazide", "dosage": "12.5 mg", "frequency": "Once daily",
             "timing": "After food", "meal_period": "Morning (after breakfast)", "duration_days": 30},
        ]
        notes = "Combination therapy required. Monitor BP twice daily. Reassess in 30 days."

    # — STAGE 1 (130–139 / 80–89)
    elif sys >= 130 or dia >= 80:
        stage = "STAGE 1"
        primary = [
            {"medication": "Lisinopril", "dosage": "5–10 mg", "frequency": "Once daily",
             "timing": "Before food", "meal_period": "Morning", "duration_days": 30},
        ]
        alternative = [
            {"medication": "Amlodipine", "dosage": "5 mg", "frequency": "Once daily",
             "timing": "After food", "meal_period": "Evening", "duration_days": 30},
        ]
        notes = "Monotherapy sufficient. Lifestyle modification recommended. Follow-up in 14–30 days."

    # — NORMAL (<130 / <80)
    else:
        stage = "NORMAL"
        primary = []
        alternative = None
        notes = "BP within normal limits. No pharmacological intervention needed. Continue monitoring."

    # Compute medication start/end dates
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    for plan in [primary, alternative or []]:
        for med in plan:
            med["start_date"] = today
            end = datetime.now(timezone.utc) + timedelta(days=med["duration_days"])
            med["end_date"] = end.strftime("%Y-%m-%d")

    return {
        "stage": stage,
        "primary_plan": primary,
        "alternative_plan": alternative,
        "clinical_notes": notes,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  4. MEDICATION HISTORY (in-memory store per patient)
# ═══════════════════════════════════════════════════════════════════════════════

_medication_history: Dict[str, List[dict]] = {}

def store_medication(patient_id: str, prescription: dict):
    """Save a prescription to patient history."""
    if patient_id not in _medication_history:
        _medication_history[patient_id] = []
    entry = {
        "prescribed_at": prescription["generated_at"],
        "stage": prescription["stage"],
        "medications": prescription["primary_plan"],
    }
    _medication_history[patient_id].append(entry)
    # Keep last 20 entries
    _medication_history[patient_id] = _medication_history[patient_id][-20:]

def get_medication_history(patient_id: str) -> List[dict]:
    return _medication_history.get(patient_id, [])


# ═══════════════════════════════════════════════════════════════════════════════
#  5. BP PREDICTION ENGINE (weighted logistic model)
# ═══════════════════════════════════════════════════════════════════════════════

def predict_bp_outcome(sub_params: dict, risk_pct: float,
                       prescription: dict = None) -> dict:
    """
    24-hour outcome prediction using weighted logistic formula.
    Correlates sub-parameters + active medications together.
    Shows: before-medication risk, medication impact, after-medication risk,
           which meds are used as input, and final correlated prediction.
    """
    sys_val   = sub_params["systolic"]
    dia_val   = sub_params["diastolic"]
    map_val   = sub_params["map"]
    hr        = sub_params["heart_rate"]
    sodium    = sub_params["sodium"]
    age       = sub_params["age"]
    bmi       = sub_params["bmi"]

    # ── A. BEFORE-MEDICATION RISK (raw vitals, no drug benefit) ──────────
    z_before = (
        0.030 * max(0, sys_val - 120)
      + 0.025 * max(0, dia_val - 80)
      + 0.020 * max(0, map_val - 90)
      + 0.015 * max(0, hr - 80)
      + 0.010 * max(0, sodium - 135)
      + 0.008 * max(0, age - 50)
      + 0.010 * max(0, bmi - 25)
      + 0.012 * (risk_pct / 100)
    )
    sig_before = 1 / (1 + math.exp(-z_before))
    risk_before_pct = min(95, max(3, round(sig_before * 100, 1)))

    # ── B. MEDICATION IMPACT (how drugs reduce BP) ──────────────────────
    # Each drug has a known expected systolic/diastolic reduction
    DRUG_EFFECTS = {
        "Lisinopril":          {"sys_reduce": 12, "dia_reduce": 8,  "class": "ACE Inhibitor"},
        "Losartan":            {"sys_reduce": 10, "dia_reduce": 7,  "class": "ARB"},
        "Valsartan":           {"sys_reduce": 14, "dia_reduce": 9,  "class": "ARB"},
        "Amlodipine":          {"sys_reduce": 10, "dia_reduce": 6,  "class": "Calcium Channel Blocker"},
        "Hydrochlorothiazide": {"sys_reduce": 8,  "dia_reduce": 5,  "class": "Diuretic"},
    }

    active_meds = []
    total_sys_reduce = 0
    total_dia_reduce = 0

    if prescription and prescription.get("primary_plan"):
        for med in prescription["primary_plan"]:
            drug_name = med["medication"]
            effect = DRUG_EFFECTS.get(drug_name, {})
            sys_r = effect.get("sys_reduce", 0)
            dia_r = effect.get("dia_reduce", 0)
            total_sys_reduce += sys_r
            total_dia_reduce += dia_r
            active_meds.append({
                "medication": drug_name,
                "dosage": med["dosage"],
                "drug_class": effect.get("class", "Unknown"),
                "timing": med["timing"],
                "expected_sys_reduction": sys_r,
                "expected_dia_reduction": dia_r,
                "status": "Active",
            })

    # ── C. AFTER-MEDICATION RISK (projected with drug effect) ───────────
    sys_after = max(90, sys_val - total_sys_reduce)
    dia_after = max(60, dia_val - total_dia_reduce)
    map_after = round((2 * dia_after + sys_after) / 3, 1)

    z_after = (
        0.030 * max(0, sys_after - 120)
      + 0.025 * max(0, dia_after - 80)
      + 0.020 * max(0, map_after - 90)
      + 0.015 * max(0, hr - 80)
      + 0.010 * max(0, sodium - 135)
      + 0.008 * max(0, age - 50)
      + 0.010 * max(0, bmi - 25)
      + 0.005 * (risk_pct / 100)   # lower weight since meds active
    )
    sig_after = 1 / (1 + math.exp(-z_after))
    risk_after_pct = min(95, max(3, round(sig_after * 100, 1)))

    # ── D. FINAL CORRELATED PREDICTION ──────────────────────────────────
    # Use the AFTER-medication z for final outcome since meds are administered
    osc = math.sin(time.time() * 0.1) * 0.03
    noise = random.gauss(0, 0.02)
    z_final = z_after + osc + noise
    sigmoid_final = 1 / (1 + math.exp(-z_final))

    prob_worsen  = min(95, max(3, round(sigmoid_final * 100, 1)))
    prob_stable  = min(95, max(3, round((1 - sigmoid_final) * 60, 1)))
    prob_improve = round(max(2, 100 - prob_worsen - prob_stable), 1)
    total = prob_worsen + prob_stable + prob_improve
    if total != 100:
        prob_stable = round(prob_stable + (100 - total), 1)

    if prob_worsen >= 60:
        trend = "Worsening"; trend_color = "red"
    elif prob_worsen >= 40:
        trend = "Stable"; trend_color = "yellow"
    else:
        trend = "Improving"; trend_color = "green"

    risk_reduction = round(risk_before_pct - risk_after_pct, 1)

    return {
        # Before-medication
        "risk_before_medication": risk_before_pct,
        # After-medication
        "risk_after_medication": risk_after_pct,
        "risk_reduction": risk_reduction,
        # Projected vitals after medication
        "projected_sys_after_med": round(sys_after, 1),
        "projected_dia_after_med": round(dia_after, 1),
        "projected_map_after_med": map_after,
        # Medication inputs used for prediction
        "medication_inputs": active_meds,
        "total_sys_reduction": total_sys_reduce,
        "total_dia_reduction": total_dia_reduce,
        # Final correlated prediction
        "prob_worsening": prob_worsen,
        "prob_stabilization": prob_stable,
        "prob_improvement": prob_improve,
        "trend": trend,
        "trend_color": trend_color,
        "horizon": "24 hours",
        # Input parameters used
        "input_parameters": {
            "systolic": sub_params["systolic"],
            "diastolic": sub_params["diastolic"],
            "map": sub_params["map"],
            "heart_rate": hr,
            "sodium": sodium,
            "age": age,
            "bmi": bmi,
            "current_risk": risk_pct,
        },
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  6. HOURLY VARIANCE DATA (time-series BP logs)
# ═══════════════════════════════════════════════════════════════════════════════

_bp_hourly_log: Dict[str, List[dict]] = {}

def record_bp_reading(patient_id: str, sbp: float, dbp: float,
                      map_val: float, risk_pct: float, before_food: bool = True):
    """Store a BP reading for variance chart."""
    if patient_id not in _bp_hourly_log:
        _bp_hourly_log[patient_id] = []
    _bp_hourly_log[patient_id].append({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "systolic": round(sbp, 1),
        "diastolic": round(dbp, 1),
        "map": round(map_val, 1),
        "risk_pct": round(risk_pct, 1),
        "before_food": before_food,
    })
    # Keep last 60 entries (~1 hour at polling rate)
    _bp_hourly_log[patient_id] = _bp_hourly_log[patient_id][-60:]

def get_bp_hourly_log(patient_id: str) -> List[dict]:
    return _bp_hourly_log.get(patient_id, [])


# ═══════════════════════════════════════════════════════════════════════════════
#  7. BP-SPECIFIC ALERT CONDITIONS
# ═══════════════════════════════════════════════════════════════════════════════

def check_bp_alerts(patient_id: str, patient_name: str, bed: str,
                    sub_params: dict, risk_pct: float) -> List[dict]:
    """
    Check BP-specific alert conditions.
    Returns list of alert dicts.
    """
    alerts = []
    ts = datetime.now(timezone.utc).isoformat()

    map_val = sub_params["map"]
    sodium  = sub_params["sodium"]
    hr      = sub_params["heart_rate"]

    if map_val < 65:
        alerts.append({
            "type": "BP_ALERT", "severity": "critical",
            "message": f"MAP {map_val} mmHg < 65 — Organ perfusion at risk",
            "patient_id": patient_id, "patient_name": patient_name,
            "bed": bed, "timestamp": ts,
        })

    if sodium > 150:
        alerts.append({
            "type": "BP_ALERT", "severity": "critical",
            "message": f"Sodium {sodium} mEq/L > 150 — Electrolyte imbalance",
            "patient_id": patient_id, "patient_name": patient_name,
            "bed": bed, "timestamp": ts,
        })

    if hr > 110:
        alerts.append({
            "type": "BP_ALERT", "severity": "warning",
            "message": f"Heart Rate {hr} bpm > 110 — Tachycardia",
            "patient_id": patient_id, "patient_name": patient_name,
            "bed": bed, "timestamp": ts,
        })

    if risk_pct > 80:
        alerts.append({
            "type": "BP_ALERT", "severity": "critical",
            "message": f"BP Risk {risk_pct}% > 80% — Critical monitoring required",
            "patient_id": patient_id, "patient_name": patient_name,
            "bed": bed, "timestamp": ts,
        })

    return alerts


# ═══════════════════════════════════════════════════════════════════════════════
#  MASTER FUNCTION: Run full BP analysis pipeline
# ═══════════════════════════════════════════════════════════════════════════════

def run_bp_analysis(patient_id: str, patient_name: str, bed: str,
                    sbp: float, dbp: float, hr: float,
                    sodium: float, age: int, bmi: float) -> dict:
    """
    Run the full BP analysis pipeline for a patient:
    1. Calculate sub-parameters
    2. Score risk
    3. Generate prescription
    4. Store medication history
    5. Predict 24-hour outcome
    6. Record hourly variance
    7. Check BP alerts
    Returns: complete BP analysis dict (the full data structure).
    """
    # 1. Sub-parameters
    sub_params = calc_sub_parameters(sbp, dbp, hr, sodium, age, bmi)

    # 2. Risk
    risk = calc_bp_risk(sub_params)

    # 3. Prescription
    prescription = generate_prescription(sub_params, risk)

    # 4. Store medication
    if prescription["primary_plan"]:
        store_medication(patient_id, prescription)

    # 5. Prediction (correlates sub-params + medication together)
    prediction = predict_bp_outcome(sub_params, risk["percentage"], prescription)

    # 6. Record variance data
    record_bp_reading(patient_id, sbp, dbp, sub_params["map"], risk["percentage"])

    # 7. Alerts
    bp_alerts = check_bp_alerts(patient_id, patient_name, bed, sub_params, risk["percentage"])

    return {
        "patient_id": patient_id,
        "patient_name": patient_name,
        "bed": bed,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "bp_sub_parameters": sub_params,
        "risk_score": risk,
        "prescription_plan": prescription,
        "medication_history": get_medication_history(patient_id),
        "prediction_output": prediction,
        "hourly_variance_data": get_bp_hourly_log(patient_id),
        "bp_alerts": bp_alerts,
    }
