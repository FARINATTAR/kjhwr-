"""
End-to-end integration tests for FastAPI endpoints.
"""
import pytest
from starlette.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "Energy" in data["app"]

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"]["actuals_count"] > 0
    assert data["database"]["forecasts_count"] > 0

def test_overview_endpoint():
    response = client.get("/api/overview?start_date=2026-01-01&end_date=2026-01-31&gate_closure_hour=11")
    assert response.status_code == 200
    data = response.json()
    assert data["total_intervals"] == 1488
    assert data["mae_mw"] > 0
    assert data["rmse_mw"] >= data["mae_mw"]
    assert "p90_buffer_mw" in data

def test_timeseries_endpoint():
    response = client.get("/api/timeseries?start_date=2026-01-01&end_date=2026-01-02&gate_closure_hour=11")
    assert response.status_code == 200
    res = response.json()
    assert res["total_count"] == 96  # 2 days * 48
    points = res["data"]
    assert len(points) == 96
    first = points[0]
    assert "actualMW" in first
    assert "dayAheadForecastMW" in first
    assert "errorMW" in first

def test_metrics_endpoint():
    response = client.get("/api/metrics?start_date=2026-01-01&end_date=2026-01-10&gate_closure_hour=11")
    assert response.status_code == 200
    data = response.json()
    assert "mae_mw" in data
    assert "rmse_mw" in data
    assert "mean_bias_mw" in data
    assert "ramp_metrics" in data
    assert "procurement_buffer" in data

def test_settlement_analysis_endpoint():
    response = client.get("/api/settlement-analysis?start_date=2026-01-01&end_date=2026-01-31&gate_closure_hour=11")
    assert response.status_code == 200
    periods = response.json()
    assert len(periods) == 48
    sp_1 = periods[0]
    assert sp_1["settlementPeriod"] == 1
    assert "timeSlot" in sp_1
    assert "maeMW" in sp_1

def test_daily_breakdown_endpoint():
    response = client.get("/api/daily-breakdown?gate_closure_hour=11")
    assert response.status_code == 200
    days = response.json()
    assert len(days) == 31  # 31 days in January
    assert days[0]["date"] == "2026-01-01"

def test_financial_impact_endpoint():
    response = client.get("/api/financial-impact?start_date=2026-01-01&end_date=2026-01-31&gate_closure_hour=11")
    assert response.status_code == 200
    data = response.json()
    assert data["total_imbalance_cost_gbp"] > 0
    assert "deficit_cost_gbp" in data
    assert "surplus_cost_gbp" in data
    assert data["total_intervals"] == 1488

def test_bias_correction_endpoint():
    response = client.get("/api/bias-correction?start_date=2026-01-01&end_date=2026-01-31&gate_closure_hour=11&window_days=7")
    assert response.status_code == 200
    data = response.json()
    summary = data["summary"]
    assert "raw_mae_mw" in summary
    assert "corrected_mae_mw" in summary
    assert summary["sample_count"] == 1488
    assert len(data["data"]) == 1488

def test_gate_closure_sensitivity_endpoint():
    response = client.get("/api/gate-closure-sensitivity?start_date=2026-01-01&end_date=2026-01-31")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 6
    assert any("Intraday" in item["closureLabel"] for item in data)

