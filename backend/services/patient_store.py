# In-memory patient store (simulates Firestore in demo mode)
# Each patient has: id, name, age, bed, admit_date, baseline vitals, severity
from models.schemas import Patient, PatientBaseline

PATIENTS: dict[str, dict] = {
    "P001": {
        "id": "P001", "name": "Arjun Mehta", "age": 67, "bed": "B01",
        "admit_date": "2026-02-20", "severity": 2,
        "sodium": 143.0, "bmi": 28.4,
        "baseline": {"hr": 70, "spo2": 97, "sbp": 118, "dbp": 78, "rr": 15, "temp": 36.7}
    },
    "P002": {
        "id": "P002", "name": "Priya Sharma", "age": 54, "bed": "B02",
        "admit_date": "2026-02-22", "severity": 1,
        "sodium": 140.0, "bmi": 26.1,
        "baseline": {"hr": 74, "spo2": 98, "sbp": 122, "dbp": 82, "rr": 17, "temp": 36.9}
    },
    "P003": {
        "id": "P003", "name": "Ravi Kumar", "age": 71, "bed": "B03",
        "admit_date": "2026-02-18", "severity": 2,
        "sodium": 147.0, "bmi": 31.2,
        "baseline": {"hr": 68, "spo2": 96, "sbp": 115, "dbp": 76, "rr": 14, "temp": 36.6}
    },
    "P004": {
        "id": "P004", "name": "Seetha Nair", "age": 45, "bed": "B04",
        "admit_date": "2026-02-24", "severity": 0,
        "sodium": 139.0, "bmi": 23.8,
        "baseline": {"hr": 76, "spo2": 99, "sbp": 125, "dbp": 83, "rr": 18, "temp": 37.0}
    },
    "P005": {
        "id": "P005", "name": "Karthik Bose", "age": 59, "bed": "B05",
        "admit_date": "2026-02-21", "severity": 1,
        "sodium": 141.0, "bmi": 27.3,
        "baseline": {"hr": 72, "spo2": 97, "sbp": 119, "dbp": 79, "rr": 16, "temp": 36.8}
    },
    "P006": {
        "id": "P006", "name": "Meena Pillai", "age": 63, "bed": "B06",
        "admit_date": "2026-02-23", "severity": 0,
        "sodium": 138.0, "bmi": 25.0,
        "baseline": {"hr": 71, "spo2": 98, "sbp": 121, "dbp": 81, "rr": 16, "temp": 36.7}
    },
    "P007": {
        "id": "P007", "name": "Vijay Reddy", "age": 78, "bed": "B07",
        "admit_date": "2026-02-19", "severity": 1,
        "sodium": 146.0, "bmi": 29.5,
        "baseline": {"hr": 69, "spo2": 95, "sbp": 113, "dbp": 74, "rr": 15, "temp": 36.5}
    },
    "P008": {
        "id": "P008", "name": "Anitha Joseph", "age": 50, "bed": "B08",
        "admit_date": "2026-02-25", "severity": 0,
        "sodium": 137.0, "bmi": 22.9,
        "baseline": {"hr": 75, "spo2": 99, "sbp": 123, "dbp": 82, "rr": 17, "temp": 36.9}
    },
}
