"""
Alerts Router – VITALGUARD 2.0 (Layer 4 – Intelligent Alert Engine)
Endpoints: list active alerts, suppress alert, full alert log timeline.
"""

from fastapi import APIRouter, HTTPException
from models.schemas import Alert, AlertSuppressRequest
from services.alert_engine import (
    get_active_alerts, get_alert_log, suppress_alert
)

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])


@router.get("/", response_model=list[Alert])
def list_active_alerts():
    """
    Return all active (non-suppressed) alerts sorted newest-first.
    These are displayed in the Alert Engine Panel (Layer 4, Feature 15).
    """
    return get_active_alerts()


@router.get("/log", response_model=list[Alert])
def get_full_alert_log():
    """
    Return complete alert log timeline including suppressed alerts (Layer 4, Feature 16).
    Suppressed alerts are marked with suppressed=True and show suppression reason.
    """
    return get_alert_log()


@router.post("/suppress/{alert_id}", response_model=Alert)
def suppress_alert_endpoint(alert_id: str, body: AlertSuppressRequest):
    """
    Suppress an active alert. The alert remains in the log but is excluded
    from the active alerts list (Layer 4, Feature 16 - Alert Suppression Logic).
    
    Body: { "reason": "Clinician reviewed - false positive" }
    """
    updated = suppress_alert(alert_id, body.reason)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")
    return updated
