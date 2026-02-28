"""
Intelligent Alert Engine for VITALGUARD 2.0 (Layer 4)

Generates alerts based on:
1. Threshold crossing - vital signs exceed safe clinical limits
2. Sudden risk spike - risk score jumps >20% in consecutive readings
3. Confidence filtering - only alert when model confidence > 0.75

Alert Suppression Logic:
- Any alert can be suppressed by a clinician with a reason
- Suppressed alerts remain in the log timeline but are marked suppressed
- The active alerts list only shows non-suppressed alerts
"""

import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict
from models.schemas import Alert, AlertType, RiskLevel

# In-memory alert store (in production this would be Firestore)
_alerts: Dict[str, Alert] = {}

# Track last risk score per patient for spike detection
_last_risk_scores: Dict[str, float] = {}

# ─── Clinical Threshold Limits ────────────────────────────────────────────────
THRESHOLDS = {
    "hr_high": 130,    # bpm - Tachycardia alert
    "hr_low": 40,      # bpm - Bradycardia alert
    "spo2_low": 90,    # % - Hypoxemia alert
    "rr_high": 30,     # breaths/min - Tachypnea alert
    "temp_high": 39.0, # °C - Fever alert
    "sbp_low": 85,     # mmHg - Hypotension alert
}

# Spike threshold: alert if risk delta exceeds this percentage
SPIKE_THRESHOLD = 20.0  # %

# Minimum model confidence to generate alert (prevents low-certainty noise)
MIN_CONFIDENCE = 0.75


def check_threshold_alerts(patient_id: str, patient_name: str, bed: str,
                            vitals: dict, risk_score: float, confidence: float) -> List[Alert]:
    """
    Check if any vitals reading crosses clinical safety thresholds.
    Only generates alert if model confidence >= MIN_CONFIDENCE.
    
    Returns:
        List of new Alert objects generated
    """
    if confidence < MIN_CONFIDENCE:
        return []  # Confidence filter: suppress low-certainty alerts

    new_alerts = []
    ts = datetime.now(timezone.utc).isoformat()

    # Heart Rate High (Tachycardia)
    if vitals.get("hr", 0) > THRESHOLDS["hr_high"]:
        new_alerts.append(_make_alert(
            patient_id, patient_name, bed,
            AlertType.THRESHOLD,
            f"⚠️ Tachycardia: HR {vitals['hr']:.0f} bpm > {THRESHOLDS['hr_high']} bpm",
            risk_score, confidence, ts
        ))

    # Heart Rate Low (Bradycardia)
    elif vitals.get("hr", 100) < THRESHOLDS["hr_low"]:
        new_alerts.append(_make_alert(
            patient_id, patient_name, bed,
            AlertType.THRESHOLD,
            f"⚠️ Bradycardia: HR {vitals['hr']:.0f} bpm < {THRESHOLDS['hr_low']} bpm",
            risk_score, confidence, ts
        ))

    # SpO2 Low (Hypoxemia)
    if vitals.get("spo2", 100) < THRESHOLDS["spo2_low"]:
        new_alerts.append(_make_alert(
            patient_id, patient_name, bed,
            AlertType.THRESHOLD,
            f"🔴 Hypoxemia: SpO₂ {vitals['spo2']:.1f}% < {THRESHOLDS['spo2_low']}%",
            risk_score, confidence, ts
        ))

    # Respiration Rate High (Tachypnea)
    if vitals.get("rr", 0) > THRESHOLDS["rr_high"]:
        new_alerts.append(_make_alert(
            patient_id, patient_name, bed,
            AlertType.THRESHOLD,
            f"⚠️ Tachypnea: RR {vitals['rr']:.0f} br/min > {THRESHOLDS['rr_high']}",
            risk_score, confidence, ts
        ))

    # Temperature High (Fever)
    if vitals.get("temp", 36) > THRESHOLDS["temp_high"]:
        new_alerts.append(_make_alert(
            patient_id, patient_name, bed,
            AlertType.THRESHOLD,
            f"🌡️ Fever: Temp {vitals['temp']:.1f}°C > {THRESHOLDS['temp_high']}°C",
            risk_score, confidence, ts
        ))

    # Systolic BP Low (Hypotension)
    if vitals.get("sbp", 120) < THRESHOLDS["sbp_low"]:
        new_alerts.append(_make_alert(
            patient_id, patient_name, bed,
            AlertType.THRESHOLD,
            f"⬇️ Hypotension: SBP {vitals['sbp']:.0f} mmHg < {THRESHOLDS['sbp_low']}",
            risk_score, confidence, ts
        ))

    return new_alerts


def check_spike_alert(patient_id: str, patient_name: str, bed: str,
                      risk_score: float, confidence: float) -> Optional[Alert]:
    """
    Detect sudden risk spike: risk increased >SPIKE_THRESHOLD% since last prediction.
    Confidence filter still applies.
    
    Returns:
        Alert if spike detected, else None
    """
    last = _last_risk_scores.get(patient_id)
    _last_risk_scores[patient_id] = risk_score  # Update stored value

    if last is None:
        return None
    if confidence < MIN_CONFIDENCE:
        return None

    delta = risk_score - last
    if delta >= SPIKE_THRESHOLD:
        ts = datetime.now(timezone.utc).isoformat()
        return _make_alert(
            patient_id, patient_name, bed,
            AlertType.SPIKE,
            f"🚨 Risk Spike: +{delta:.1f}% jump detected ({last:.1f}% → {risk_score:.1f}%)",
            risk_score, confidence, ts
        )
    return None


def _make_alert(patient_id: str, patient_name: str, bed: str,
                alert_type: AlertType, message: str,
                risk_score: float, confidence: float, ts: str) -> Alert:
    """Create and store a new Alert, then return it."""
    alert = Alert(
        id=str(uuid.uuid4()),
        patient_id=patient_id,
        patient_name=patient_name,
        bed=bed,
        alert_type=alert_type,
        message=message,
        risk_score=risk_score,
        confidence=confidence,
        timestamp=ts,
        suppressed=False,
    )
    _alerts[alert.id] = alert
    return alert


def suppress_alert(alert_id: str, reason: str) -> Optional[Alert]:
    """
    Suppress an active alert. Suppressed alerts stay in the log but
    are excluded from the active alerts list.
    
    Returns:
        Updated Alert if found, None if not found
    """
    alert = _alerts.get(alert_id)
    if not alert:
        return None
    alert.suppressed = True
    alert.suppressed_at = datetime.now(timezone.utc).isoformat()
    alert.suppressed_reason = reason
    return alert


def get_active_alerts() -> List[Alert]:
    """Return all non-suppressed alerts sorted by timestamp descending."""
    active = [a for a in _alerts.values() if not a.suppressed]
    return sorted(active, key=lambda a: a.timestamp, reverse=True)


def get_alert_log() -> List[Alert]:
    """Return full alert log (active + suppressed) in chronological order."""
    return sorted(_alerts.values(), key=lambda a: a.timestamp, reverse=True)


def get_alert_counts() -> Dict[str, int]:
    """Return counts of triggered and suppressed alerts."""
    total = len(_alerts)
    suppressed = sum(1 for a in _alerts.values() if a.suppressed)
    return {"triggered": total, "suppressed": suppressed}
