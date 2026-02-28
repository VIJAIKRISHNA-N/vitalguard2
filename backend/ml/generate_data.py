"""
Dummy ICU Training Data Generator for VITALGUARD 2.0
Generates 2000 synthetic patient records with engineered features and risk labels.
Run this script once to produce dummy_vitals.csv, then train with train_model.py.
"""

import numpy as np
import pandas as pd
import random
from pathlib import Path

random.seed(42)
np.random.seed(42)

N_SAMPLES = 2000
OUTPUT_PATH = Path(__file__).parent.parent / "data" / "dummy_vitals.csv"


def generate_sample(severity: int) -> dict:
    """
    Generate one synthetic patient feature set.
    
    severity:
      0 = Stable   → mostly within normal ranges → label=0 (low risk)
      1 = Moderate → some deviations            → label=1 (medium risk)
      2 = Critical → significant deviations      → label=1 (high risk)
    """
    # Baseline vitals (healthy adult)
    base_hr = random.gauss(72, 5)
    base_spo2 = random.gauss(98, 0.5)
    base_rr = random.gauss(16, 1.5)
    base_temp = random.gauss(36.8, 0.2)
    base_sbp = random.gauss(120, 5)

    if severity == 0:  # Stable
        hr_mean = base_hr + random.gauss(0, 4)
        hr_trend = random.gauss(0, 0.1)
        hr_variability = abs(random.gauss(2, 1))
        spo2_mean = base_spo2 + random.gauss(0, 0.5)
        spo2_deviation = random.gauss(0, 0.5)
        rr_mean = base_rr + random.gauss(0, 1)
        rr_rate_of_change = random.gauss(0, 0.3)
        temp_deviation = random.gauss(0, 0.15)
        sbp_mean = base_sbp + random.gauss(0, 5)
        label = 0  # Low risk

    elif severity == 1:  # Moderate
        hr_mean = base_hr + random.gauss(15, 6)
        hr_trend = random.gauss(0.5, 0.3)
        hr_variability = abs(random.gauss(7, 2))
        spo2_mean = base_spo2 - random.gauss(4, 1.5)
        spo2_deviation = random.gauss(-4, 1.5)
        rr_mean = base_rr + random.gauss(6, 2)
        rr_rate_of_change = random.gauss(1.5, 0.6)
        temp_deviation = random.gauss(0.9, 0.3)
        sbp_mean = base_sbp + random.gauss(15, 7)
        label = 1  # High risk

    else:  # Critical
        hr_mean = base_hr + random.gauss(35, 10)
        hr_trend = random.gauss(1.5, 0.6)
        hr_variability = abs(random.gauss(15, 5))
        spo2_mean = base_spo2 - random.gauss(10, 2.5)
        spo2_deviation = random.gauss(-10, 2.5)
        rr_mean = base_rr + random.gauss(14, 4)
        rr_rate_of_change = random.gauss(3.5, 1.2)
        temp_deviation = random.gauss(1.8, 0.6)
        sbp_mean = base_sbp - random.gauss(20, 8)  # Hypotension
        label = 1  # High risk

    return {
        "hr_mean": round(hr_mean, 3),
        "hr_trend": round(hr_trend, 4),
        "hr_variability": round(abs(hr_variability), 3),
        "spo2_mean": round(np.clip(spo2_mean, 60, 100), 3),
        "spo2_deviation": round(spo2_deviation, 3),
        "rr_mean": round(np.clip(rr_mean, 6, 50), 3),
        "rr_rate_of_change": round(rr_rate_of_change, 3),
        "temp_deviation": round(temp_deviation, 3),
        "sbp_mean": round(np.clip(sbp_mean, 70, 220), 3),
        "label": label,
    }


if __name__ == "__main__":
    records = []
    # 50% stable, 25% moderate, 25% critical
    for _ in range(int(N_SAMPLES * 0.5)):
        records.append(generate_sample(0))
    for _ in range(int(N_SAMPLES * 0.25)):
        records.append(generate_sample(1))
    for _ in range(int(N_SAMPLES * 0.25)):
        records.append(generate_sample(2))

    random.shuffle(records)
    df = pd.DataFrame(records)
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUTPUT_PATH, index=False)

    print(f"Generated {len(df)} samples -> {OUTPUT_PATH}")
    print(f"Label distribution:\n{df['label'].value_counts()}")
