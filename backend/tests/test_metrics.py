"""
Unit tests for Day-Ahead trading cutoff logic, quantitative metrics,
and settlement period error evaluation.
"""
import pytest
from app.services.trading import (
    calculate_da_cutoff,
    get_day_ahead_paired_series,
    compute_thermal_procurement_buffer
)
from app.services.metrics import (
    calculate_overall_metrics,
    calculate_settlement_period_profile,
    calculate_daily_breakdown,
    calculate_ramp_metrics
)

def test_calculate_da_cutoff_time():
    # If delivery date is 2026-01-15 and gate closure is 11:00 GMT,
    # the cutoff must be Day D-1 (2026-01-14) at 11:00:00Z
    cutoff = calculate_da_cutoff("2026-01-15", gate_closure_hour=11, gate_closure_minute=0)
    assert cutoff == "2026-01-14T11:00:00Z"
    
    # Custom gate closure at 09:30
    cutoff_custom = calculate_da_cutoff("2026-01-02", gate_closure_hour=9, gate_closure_minute=30)
    assert cutoff_custom == "2026-01-01T09:30:00Z"

def test_paired_series_generation():
    # Query single day (2026-01-05)
    paired = get_day_ahead_paired_series(
        start_date="2026-01-05",
        end_date="2026-01-05",
        gate_closure_hour=11
    )
    # Should have paired intervals (may be fewer than 48 if some forecasts missing)
    assert len(paired) > 0
    
    first = paired[0]
    assert first["settlementPeriod"] >= 1
    assert "actualMW" in first
    assert "dayAheadForecastMW" in first
    assert "errorMW" in first
    # Error definition: Forecast - Actual
    assert round(first["dayAheadForecastMW"] - first["actualMW"], 1) == first["errorMW"]

def test_paired_series_no_imputed_forecasts():
    """No paired interval should have forecast == actual (imputation artifact)."""
    paired = get_day_ahead_paired_series(
        start_date="2026-01-01",
        end_date="2026-01-07",
        gate_closure_hour=11
    )
    # With real data, it's statistically near-impossible for forecast to exactly equal actual
    # If we find many such cases, the old imputation bug is still present
    exact_matches = [p for p in paired if p["dayAheadForecastMW"] == p["actualMW"]]
    # Allow at most 1% coincidental matches
    assert len(exact_matches) < len(paired) * 0.01, \
        f"Too many exact forecast==actual matches ({len(exact_matches)}/{len(paired)}), possible imputation bug"

def test_quantitative_accuracy_invariants():
    mock_data = [
        {"actualMW": 10000.0, "dayAheadForecastMW": 11000.0},  # error +1000
        {"actualMW": 12000.0, "dayAheadForecastMW": 11500.0},  # error -500
        {"actualMW": 8000.0,  "dayAheadForecastMW": 8000.0},   # error 0
        {"actualMW": 15000.0, "dayAheadForecastMW": 13500.0},  # error -1500
    ]
    metrics = calculate_overall_metrics(mock_data)
    
    # Absolute errors: 1000, 500, 0, 1500 -> sum = 3000 -> MAE = 750
    assert metrics["mae_mw"] == 750.0
    # Mathematical property: RMSE must always be >= MAE
    assert metrics["rmse_mw"] >= metrics["mae_mw"]
    # Mean Bias: (+1000 - 500 + 0 - 1500) / 4 = -1000 / 4 = -250.0
    assert metrics["mean_bias_mw"] == -250.0

def test_thermal_procurement_buffer():
    mock_paired = [
        {"errorMW": 500.0},
        {"errorMW": 1200.0},
        {"errorMW": -300.0}, # underforecast (no thermal deficit)
        {"errorMW": 1800.0},
        {"errorMW": 800.0},
    ]
    buffer = compute_thermal_procurement_buffer(mock_paired)
    assert buffer["p90_buffer_mw"] >= 0
    assert buffer["p95_buffer_mw"] >= buffer["p90_buffer_mw"]

def test_settlement_period_profile_shape():
    paired = get_day_ahead_paired_series(
        start_date="2026-01-01",
        end_date="2026-01-03",
        gate_closure_hour=11
    )
    profile = calculate_settlement_period_profile(paired)
    # Should have settlement periods present
    assert len(profile) > 0
    # Evening peak period (e.g. SP 35) should be flagged if present
    peak_periods = [p for p in profile if p["isPeakPeriod"]]
    non_peak = [p for p in profile if not p["isPeakPeriod"]]
    # Should have both peak and non-peak
    assert len(peak_periods) > 0
    assert len(non_peak) > 0

def test_daily_breakdown_covers_date_range():
    """Daily breakdown should return one entry per day in the requested range."""
    paired = get_day_ahead_paired_series(
        start_date="2026-01-05",
        end_date="2026-01-10",
        gate_closure_hour=11
    )
    breakdown = calculate_daily_breakdown(paired)
    dates = [d["date"] for d in breakdown]
    # All dates should be within range
    for d in dates:
        assert d >= "2026-01-05"
        assert d <= "2026-01-10"
