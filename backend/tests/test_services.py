"""
Comprehensive Unit & Edge Case Test Suite.
Validates mathematical invariants, numerical edge cases, and trading rule integrity
across all analytical service modules.
"""
import pytest
from app.services.bias_correction import apply_bias_correction, compare_raw_vs_corrected
from app.services.financial import calculate_financial_impact, _empty_impact
from app.services.metrics import (
    calculate_overall_metrics,
    calculate_settlement_period_profile,
    calculate_daily_breakdown,
    calculate_ramp_metrics
)
from app.services.trading import (
    calculate_da_cutoff,
    compute_thermal_procurement_buffer
)
from app.services.forecast_model import ForecastConfidenceModel


# =========================================================================
# 1. Bias Correction & Physical Feasibility Tests
# =========================================================================

def test_bias_correction_empty_series():
    """Empty dataset should gracefully return empty results without crashing."""
    assert apply_bias_correction([]) == []
    summary = compare_raw_vs_corrected([])
    assert summary["raw_mae_mw"] == 0.0

def test_bias_correction_physical_floor_enforcement():
    """Wind generation can never be negative; 800 MW physical floor must be respected."""
    mock_data = [
        {
            "startTime": "2026-01-01T00:00:00Z",
            "settlementDate": "2026-01-01",
            "settlementPeriod": 1,
            "actualMW": 1000.0,
            "dayAheadForecastMW": 500.0,  # Below floor
            "errorMW": -500.0,
            "absErrorMW": 500.0
        }
    ]
    corrected = apply_bias_correction(mock_data, window_days=7)
    assert len(corrected) == 1
    # Physical floor is 800 MW
    assert corrected[0]["correctedForecastMW"] >= 800.0

def test_bias_correction_removes_systematic_overforecast():
    """A persistent 200 MW positive bias should be calibrated down in subsequent days."""
    mock_data = []
    # Day 1: 48 intervals with +200 MW bias
    for sp in range(1, 49):
        mock_data.append({
            "startTime": f"2026-01-01T{sp:02d}:00:00Z",
            "settlementDate": "2026-01-01",
            "settlementPeriod": sp,
            "actualMW": 3000.0,
            "dayAheadForecastMW": 3200.0,
            "errorMW": 200.0,
            "absErrorMW": 200.0
        })
    # Day 2: 48 intervals
    for sp in range(1, 49):
        mock_data.append({
            "startTime": f"2026-01-02T{sp:02d}:00:00Z",
            "settlementDate": "2026-01-02",
            "settlementPeriod": sp,
            "actualMW": 3000.0,
            "dayAheadForecastMW": 3200.0,
            "errorMW": 200.0,
            "absErrorMW": 200.0
        })

    corrected = apply_bias_correction(mock_data, window_days=1)
    day2_items = [it for it in corrected if it["settlementDate"] == "2026-01-02"]
    # On day 2, the trailing 200 MW bias should be subtracted
    assert day2_items[0]["biasAppliedMW"] == 200.0
    assert day2_items[0]["correctedForecastMW"] == 3000.0
    assert day2_items[0]["correctedErrorMW"] == 0.0


# =========================================================================
# 2. Financial Imbalance & Cash-Out Invariants
# =========================================================================

def test_financial_impact_zero_error_yields_zero_penalty():
    """If forecast matches actual perfectly, imbalance cash-out penalty must be 0."""
    perfect_data = [
        {"errorMW": 0.0},
        {"errorMW": 0.0}
    ]
    impact = calculate_financial_impact(perfect_data, sbp=150.0, ssp=30.0, da_price=80.0)
    assert impact["total_imbalance_cost_gbp"] == 0.0
    assert impact["deficit_cost_gbp"] == 0.0
    assert impact["surplus_cost_gbp"] == 0.0

def test_financial_impact_monotonicity():
    """Higher SBP must strictly increase deficit cost exposure."""
    data = [{"errorMW": 100.0}]  # 100 MW deficit
    impact_normal = calculate_financial_impact(data, sbp=120.0, ssp=45.0, da_price=75.0)
    impact_stressed = calculate_financial_impact(data, sbp=200.0, ssp=45.0, da_price=75.0)

    assert impact_stressed["deficit_cost_gbp"] > impact_normal["deficit_cost_gbp"]
    assert impact_stressed["total_imbalance_cost_gbp"] > impact_normal["total_imbalance_cost_gbp"]

def test_financial_impact_interval_conservation():
    """Total intervals must equal deficit intervals + surplus intervals + zero intervals."""
    data = [
        {"errorMW": 50.0},   # deficit
        {"errorMW": -30.0},  # surplus
        {"errorMW": 0.0}     # zero
    ]
    impact = calculate_financial_impact(data)
    assert impact["total_intervals"] == 3
    assert impact["deficit_intervals"] == 1
    assert impact["surplus_intervals"] == 1


# =========================================================================
# 3. Mathematical Metric Invariants & Edge Cases
# =========================================================================

def test_metrics_rmse_greater_equal_mae():
    """By Cauchy-Schwarz inequality, RMSE must always be >= MAE for any distribution."""
    test_cases = [
        [{"actualMW": 1000.0, "dayAheadForecastMW": 1200.0}],
        [{"actualMW": 2000.0, "dayAheadForecastMW": 1500.0}, {"actualMW": 1000.0, "dayAheadForecastMW": 1400.0}],
        [{"actualMW": 500.0, "dayAheadForecastMW": 500.0}]
    ]
    for case in test_cases:
        m = calculate_overall_metrics(case)
        assert m["rmse_mw"] >= m["mae_mw"], f"Invariant failed: RMSE {m['rmse_mw']} < MAE {m['mae_mw']}"

def test_metrics_zero_actuals_division_safety():
    """Metrics calculation must avoid ZeroDivisionError when actual generation is 0."""
    zero_data = [{"actualMW": 0.0, "dayAheadForecastMW": 100.0}]
    m = calculate_overall_metrics(zero_data)
    assert m["mae_mw"] == 100.0
    assert m["mape_pct"] >= 0.0
    assert not (m["mape_pct"] != m["mape_pct"])  # Not NaN

def test_ramp_metrics_single_item_boundary():
    """Single item series cannot produce ramps; must return safe zero values without crash."""
    single_item = [{"settlementDate": "2026-01-01", "actualMW": 1000.0, "dayAheadForecastMW": 1100.0}]
    ramp = calculate_ramp_metrics(single_item)
    assert ramp["ramp_mae_mw"] == 0.0
    assert ramp["max_actual_ramp_mw"] == 0.0


# =========================================================================
# 4. Trading Cutoff & Procurement Quantiles
# =========================================================================

def test_da_cutoff_day_ahead_timing():
    """Verify Day-Ahead gate closure cutoff sets correctly to D-1 11:00 GMT."""
    cutoff = calculate_da_cutoff("2026-01-15", gate_closure_hour=11, gate_closure_minute=0)
    assert cutoff == "2026-01-14T11:00:00Z"

def test_procurement_buffer_monotonicity():
    """P95 procurement reserve must always be >= P90 procurement reserve."""
    mock_paired = [
        {"errorMW": 50.0},
        {"errorMW": 150.0},
        {"errorMW": 200.0},
        {"errorMW": -100.0},  # Underforecast (surplus, not deficit)
        {"errorMW": 350.0}
    ]
    buffer = compute_thermal_procurement_buffer(mock_paired)
    assert buffer["p95_buffer_mw"] >= buffer["p90_buffer_mw"]


# =========================================================================
# 5. Forecast Confidence Scoring Engine Tests
# =========================================================================

def test_forecast_confidence_bounds_and_structure():
    """Confidence scores must always be strictly bounded between 0.0 and 100.0."""
    model = ForecastConfidenceModel()
    mock_series = [
        {
            "startTime": f"2026-01-01T{sp:02d}:00:00Z",
            "settlementDate": "2026-01-01",
            "settlementPeriod": sp,
            "actualMW": 2500.0,
            "dayAheadForecastMW": 2600.0,
            "errorMW": 100.0,
            "absErrorMW": 100.0
        }
        for sp in range(1, 49)
    ]

    res = model.evaluate_confidence(mock_series)
    assert 0.0 <= res["average_confidence_pct"] <= 100.0
    assert res["overall_tier"] in ["High", "Medium", "Low"]
    assert res["total_intervals"] == 48

    for item in res["data"]:
        assert 0.0 <= item["confidenceScore"] <= 100.0
        assert item["confidenceTier"] in ["High", "Medium", "Low"]


# =========================================================================
# 6. DA Gate Closure Cutoff Selection Tests (Issue #6)
# =========================================================================

def test_cutoff_selects_latest_forecast_before_gate():
    """
    When two forecasts exist for the same slot - one published before gate
    closure (10:00 D-1) and one after (16:30 D-1) - only the pre-gate forecast
    should be selected. The 16:30 publish must be dropped when gate=11:00.
    """
    from app.database import get_db, init_db
    from app.services.trading import get_day_ahead_paired_series
    init_db()

    test_date = "2099-01-15"
    test_slot_time = "2099-01-15T00:00:00Z"
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO actual_generation
                (start_time, settlement_date, settlement_period, fuel_type, generation_mw)
                VALUES (?, ?, 1, 'WIND', 10000.0)
            """, (test_slot_time, test_date))

            # Forecast 1: published at 10:00 D-1 (before 11:00 gate) -> should be selected
            cursor.execute("""
                INSERT OR REPLACE INTO forecast_generation
                (start_time, settlement_date, settlement_period, publish_time, generation_mw)
                VALUES (?, ?, 1, '2099-01-14T10:00:00Z', 9500.0)
            """, (test_slot_time, test_date))

            # Forecast 2: published at 16:30 D-1 (after 11:00 gate) -> should be dropped
            cursor.execute("""
                INSERT OR REPLACE INTO forecast_generation
                (start_time, settlement_date, settlement_period, publish_time, generation_mw)
                VALUES (?, ?, 1, '2099-01-14T16:30:00Z', 9800.0)
            """, (test_slot_time, test_date))

        paired = get_day_ahead_paired_series(
            start_date=test_date,
            end_date=test_date,
            gate_closure_hour=11
        )

        test_slot = [p for p in paired if p["startTime"] == test_slot_time]
        assert len(test_slot) == 1
        assert test_slot[0]["dayAheadForecastMW"] == 9500.0
        assert test_slot[0]["dayAheadPublishTime"] == "2099-01-14T10:00:00Z"
    finally:
        with get_db() as conn:
            conn.execute("DELETE FROM actual_generation WHERE settlement_date = ?", (test_date,))
            conn.execute("DELETE FROM forecast_generation WHERE settlement_date = ?", (test_date,))


def test_missing_forecast_excluded_from_paired_series():
    """
    If no forecast exists at or before gate closure for a settlement period,
    that interval must be excluded from the paired series (not imputed with actual).
    """
    from app.database import get_db, init_db
    from app.services.trading import get_day_ahead_paired_series
    init_db()

    test_date = "2099-01-16"
    test_slot_time = "2099-01-16T12:00:00Z"
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            # Insert actual with no matching forecast before gate closure
            cursor.execute("""
                INSERT OR REPLACE INTO actual_generation
                (start_time, settlement_date, settlement_period, fuel_type, generation_mw)
                VALUES (?, ?, 25, 'WIND', 12000.0)
            """, (test_slot_time, test_date))

            # Insert forecast published AFTER gate closure (e.g., 15:00 D-1 when gate is 11:00)
            cursor.execute("""
                INSERT OR REPLACE INTO forecast_generation
                (start_time, settlement_date, settlement_period, publish_time, generation_mw)
                VALUES (?, ?, 25, '2099-01-15T15:00:00Z', 11500.0)
            """, (test_slot_time, test_date))

        paired = get_day_ahead_paired_series(
            start_date=test_date,
            end_date=test_date,
            gate_closure_hour=11
        )

        # Interval should NOT be in paired series because no forecast arrived before 11:00 D-1
        matching = [p for p in paired if p["startTime"] == test_slot_time]
        assert len(matching) == 0, "Unpaired interval should be excluded from paired series, not imputed"
    finally:
        with get_db() as conn:
            conn.execute("DELETE FROM actual_generation WHERE settlement_date = ?", (test_date,))
            conn.execute("DELETE FROM forecast_generation WHERE settlement_date = ?", (test_date,))

