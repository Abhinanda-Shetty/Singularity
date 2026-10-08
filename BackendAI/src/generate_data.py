"""
generate_data.py - Generates medical_demand_training_90.csv for training.
Run once to produce the dataset: python src/generate_data.py
"""
import numpy as np
import pandas as pd
from pathlib import Path

np.random.seed(42)

# -- Constants ----------------------------------------------------------------
HOSPITALS = [
    ("H001", "City General Hospital",   "urban"),
    ("H002", "Rural Health Centre",     "rural"),
    ("H003", "District Medical Centre", "semi-urban"),
    ("H004", "Metro Specialty Hospital","urban"),
    ("H005", "Community Health Post",   "rural"),
]

HOSPITAL_COORDS = {
    "H001": (12.9716, 77.5946),
    "H002": (15.3647, 75.1240),
    "H003": (13.0827, 80.2707),
    "H004": (28.6139, 77.2090),
    "H005": (26.8467, 80.9462),
}

MEDICINES = [
    (1001, "Paracetamol 500mg",    "Analgesic"),
    (1002, "Amoxicillin 250mg",    "Antibiotic"),
    (1003, "Metformin 500mg",      "Antidiabetic"),
    (1004, "Amlodipine 5mg",       "Antihypertensive"),
    (1005, "Omeprazole 20mg",      "Gastric"),
    (1006, "Ciprofloxacin 500mg",  "Antibiotic"),
]

N_ROWS = 90
START_DATE = pd.Timestamp("2024-01-01")


def generate_row(i: int) -> dict:
    h_id, h_name, region = HOSPITALS[i % len(HOSPITALS)]
    lat, lon = HOSPITAL_COORDS[h_id]
    m_id, m_name, m_cat = MEDICINES[i % len(MEDICINES)]

    date = START_DATE + pd.Timedelta(weeks=i // len(HOSPITALS))

    # Base demand varies by medicine and hospital type
    base_demand = {"urban": 400, "semi-urban": 250, "rural": 120}[region]
    base_demand += m_id % 100  # slight per-medicine variation

    # Seasonal noise
    month = date.month
    seasonality = 1.0 + 0.15 * np.sin(2 * np.pi * month / 12)

    # Outbreak boosts demand
    outbreak = int(np.random.rand() < 0.12)
    outbreak_boost = 1.4 if outbreak else 1.0

    # Emergency demand
    emergency = int(np.random.randint(0, base_demand // 4))

    patient_load = int(np.random.randint(80, 400))

    consumption = int(base_demand * seasonality * 0.8 + np.random.normal(0, 20))
    consumption = max(10, consumption)

    current_stock = int(consumption * np.random.uniform(0.5, 3.5))
    safety_stock = int(consumption * 0.3)
    lead_time = int(np.random.randint(3, 15))

    future_demand = int(
        base_demand * seasonality * outbreak_boost
        + 0.3 * patient_load
        + 0.5 * emergency
        + np.random.normal(0, 15)
    )
    future_demand = max(10, future_demand)

    return {
        "date": date.strftime("%Y-%m-%d"),
        "hospital_id": h_id,
        "hospital_name": h_name,
        "region_type": region,
        "latitude": lat,
        "longitude": lon,
        "medicine_id": m_id,
        "medicine_name": m_name,
        "medicine_category": m_cat,
        "current_stock": current_stock,
        "safety_stock": safety_stock,
        "consumption": consumption,
        "patient_load": patient_load,
        "emergency_demand": emergency,
        "outbreak_indicator": outbreak,
        "lead_time_days": lead_time,
        "future_demand": future_demand,
    }


def main() -> None:
    rows = [generate_row(i) for i in range(N_ROWS)]
    df = pd.DataFrame(rows)

    out_path = Path(__file__).parent.parent / "data" / "medical_demand_training_90.csv"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(out_path, index=False)
    print(f"Saved {len(df)} rows -> {out_path}")
    print(df.head(3).to_string())


if __name__ == "__main__":
    main()
