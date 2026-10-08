"""
test_endpoints.py - Automated test script for all FastAPI endpoints.
Tests every endpoint in api.main via FastAPI TestClient.
"""
import sys
from pathlib import Path

# Add src and parent directory to path
sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, str(Path(__file__).parent / "src"))

from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)

def run_tests():
    print("=" * 65)
    print("  SINGULARITY - FastAPI Endpoints Comprehensive Test Suite")
    print("=" * 65)

    # 1. Health check
    print("\n[1/8] Testing GET / (Health Check) ...")
    r = client.get("/")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    print(f"      Status: {r.status_code} OK | Response: {r.json()}")

    # 2. Model metadata
    print("\n[2/8] Testing GET /model/info ...")
    r = client.get("/model/info")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    data = r.json()
    print(f"      Status: {r.status_code} OK | Model Type: {data['model_type']} | Features: {len(data['features'])}")

    # Sample dataset for testing
    sample_records = [
        {
            "date": "2024-01-08",
            "hospital_id": "H001",
            "hospital_name": "City General Hospital",
            "region_type": "urban",
            "latitude": 12.9716,
            "longitude": 77.5946,
            "medicine_id": 1001,
            "medicine_name": "Paracetamol 500mg",
            "medicine_category": "Analgesic",
            "current_stock": 250,
            "safety_stock": 100,
            "consumption": 300,
            "patient_load": 200,
            "emergency_demand": 40,
            "outbreak_indicator": 0,
            "lead_time_days": 7
        },
        {
            "date": "2024-01-08",
            "hospital_id": "H002",
            "hospital_name": "Rural Health Centre",
            "region_type": "rural",
            "latitude": 15.3647,
            "longitude": 75.124,
            "medicine_id": 1001,
            "medicine_name": "Paracetamol 500mg",
            "medicine_category": "Analgesic",
            "current_stock": 900,
            "safety_stock": 80,
            "consumption": 120,
            "patient_load": 90,
            "emergency_demand": 10,
            "outbreak_indicator": 0,
            "lead_time_days": 7
        }
    ]

    # 3. Forecast endpoint
    print("\n[3/8] Testing POST /forecast ...")
    r = client.post("/forecast", json={"records": sample_records, "days_per_period": 7})
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    forecast_resp = r.json()
    forecasts = forecast_resp["forecasts"]
    print(f"      Status: {r.status_code} OK | Forecast count: {forecast_resp['count']}")
    for fc in forecasts:
        print(f"      - {fc['hospital_id']} {fc['medicine_name']}: pred_demand={fc['predicted_future_demand']}, days_to_stockout={fc['days_to_stockout']}")

    # 4. Stockout endpoint
    print("\n[4/8] Testing POST /stockout ...")
    r = client.post("/stockout", json={"forecast_records": forecasts, "lead_time_days_default": 7, "safety_horizon": 14})
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    stockout_resp = r.json()
    print(f"      Status: {r.status_code} OK | Summary: {stockout_resp['summary']}")

    # 5. Expiry endpoint
    print("\n[5/8] Testing POST /expiry ...")
    sample_batches = [
        {
            "hospital_id": "H002",
            "hospital_name": "Rural Health Centre",
            "medicine_id": 1001,
            "medicine_name": "Paracetamol 500mg",
            "medicine_category": "Analgesic",
            "region_type": "rural",
            "latitude": 15.3647,
            "longitude": 75.124,
            "batch_id": "BATCH-2024-A",
            "batch_qty": 400,
            "expiry_date": "2024-02-10",
            "current_date": "2024-01-08",
            "predicted_daily_demand": 15.0,
            "lead_time_days": 7
        }
    ]
    r = client.post("/expiry", json={"batches": sample_batches, "wastage_horizon": 30, "medium_horizon": 60})
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    expiry_resp = r.json()
    print(f"      Status: {r.status_code} OK | Summary: {expiry_resp['summary']}")

    # 6. Priority endpoint
    print("\n[6/8] Testing POST /priority ...")
    risk_records = stockout_resp["risk_records"]
    r = client.post("/priority", json={"deficit_records": risk_records, "safety_horizon": 14})
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    priority_resp = r.json()
    print(f"      Status: {r.status_code} OK | Ranked deficits count: {priority_resp['count']}")

    # 7. Redistribute endpoint (PuLP)
    print("\n[7/8] Testing POST /redistribute (PuLP Optimizer) ...")
    deficits = [
        {
            "hospital_id": "H001",
            "hospital_name": "City General Hospital",
            "medicine_id": 1001,
            "medicine_name": "Paracetamol 500mg",
            "medicine_category": "Analgesic",
            "latitude": 12.9716,
            "longitude": 77.5946,
            "shortage_quantity": 200.0,
            "priority_score": 85.0
        }
    ]
    surpluses = [
        {
            "hospital_id": "H002",
            "hospital_name": "Rural Health Centre",
            "medicine_id": 1001,
            "medicine_name": "Paracetamol 500mg",
            "medicine_category": "Analgesic",
            "latitude": 15.3647,
            "longitude": 75.124,
            "current_stock": 900,
            "safety_stock": 80,
            "predicted_future_demand": 150.0,
            "surplus": 670.0
        }
    ]
    r = client.post("/redistribute", json={
        "deficits": deficits,
        "surpluses": surpluses,
        "min_transfer_qty": 5
    })
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    redis_resp = r.json()
    print(f"      Status: {r.status_code} OK | Total transfers: {redis_resp['total_transfers']}")
    for mid, tlist in redis_resp["transfers_by_medicine"].items():
        for t in tlist:
            print(f"      - {t['donor_hospital_name']} -> {t['recipient_hospital_name']}: {t['transfer_qty']} units ({t['distance_km']:.1f} km)")

    # 8. Full Analyse Pipeline endpoint
    print("\n[8/11] Testing POST /analyse (End-to-End Orchestration) ...")
    r = client.post("/analyse", json={
        "records": sample_records,
        "batches": sample_batches,
        "days_per_period": 7,
        "min_transfer_qty": 5
    })
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    analyse_resp = r.json()
    print(f"      Status: {r.status_code} OK | Pipeline: {analyse_resp['pipeline']}")
    print(f"      Forecasts: {analyse_resp['forecast_count']} | Risk summary: {analyse_resp['risk_summary']}")
    print(f"      Total transfers generated: {analyse_resp['total_transfers']}")

    # 9. Dynamic database forecast endpoint
    print("\n[9/11] Testing GET /forecast/db (Live DB Parameters) ...")
    r = client.get("/forecast/db")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    db_fc = r.json()
    print(f"      Status: {r.status_code} OK | DB Forecasts count: {db_fc['count']}")

    # 10. Dynamic database stockout endpoint
    print("\n[10/11] Testing GET /stockout/db (Live DB Risk Classification) ...")
    r = client.get("/stockout/db")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    db_so = r.json()
    print(f"      Status: {r.status_code} OK | Records assessed: {db_so['summary']['records_assessed']}")

    # 11. Dynamic database end-to-end analyse endpoint
    print("\n[11/11] Testing GET /analyse/db (Live DB Orchestration) ...")
    r = client.get("/analyse/db")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    db_an = r.json()
    print(f"      Status: {r.status_code} OK | Pipeline: {db_an['pipeline']} | Transfers: {db_an['total_transfers']}")

    print("\n" + "=" * 65)
    print("  ALL 11 ENDPOINTS PASSED WITH 200 OK STATUS!")
    print("=" * 65)

if __name__ == "__main__":
    run_tests()

