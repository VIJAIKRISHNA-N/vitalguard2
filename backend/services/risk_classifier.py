"""
Risk Classifier for VITALGUARD 2.0
Converts a raw 0-100 risk score into a color-coded classification.
"""

from models.schemas import RiskLevel


def classify_risk(risk_score: float) -> RiskLevel:
    """
    Classify risk score into Green / Yellow / Red levels.
    
    Args:
        risk_score: Float 0.0 to 100.0 (percentage)
    
    Returns:
        RiskLevel enum value
    """
    if risk_score < 40.0:
        return RiskLevel.GREEN    # Stable: 0-40%
    elif risk_score < 70.0:
        return RiskLevel.YELLOW   # Moderate: 40-70%
    else:
        return RiskLevel.RED      # Critical: 70-100%


def get_risk_color_hex(risk_level: RiskLevel) -> str:
    """Return hex color for a risk level (for UI rendering)."""
    return {
        RiskLevel.GREEN: "#22c55e",
        RiskLevel.YELLOW: "#f59e0b",
        RiskLevel.RED: "#ef4444",
    }[risk_level]


def sort_patients_by_risk(patients: list) -> list:
    """Sort patient list by descending risk score (highest risk first)."""
    return sorted(patients, key=lambda p: p.get("risk_score", 0), reverse=True)
