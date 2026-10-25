"""
API Routes for Wind Forecasting and Day-Ahead Trading Analytics.
"""
from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException
from app.config import settings
from app.ingestion.pipeline import pipeline
from app.services.trading import (
    get_day_ahead_paired_series,
    compute_thermal_procurement_buffer
)
from app.services.metrics import (
    calculate_overall_metrics,
    calculate_settlement_period_profile,
    calculate_daily_breakdown,
    calculate_ramp_metrics
)
from app.services.financial import calculate_financial_impact
from app.services.bias_correction import apply_bias_correction, compare_raw_vs_corrected
from app.services.sensitivity import evaluate_gate_closure_sensitivity
from app.services.forecast_model import forecast_model
from app.schemas.models import (
    HealthResponse,
    OverviewResponse,
    TimeSeriesResponse,
    MetricsResponse,
    SettlementPeriodItem,
    DailyBreakdownItem,
    FinancialImpactResponse,
    BiasCorrectionResponse,
    GateClosureSensitivityItem,
    ForecastConfidenceResponse
)


router = APIRouter(prefix="/api")

@router.get("/health")
def get_health():
    """Health check endpoint providing database stats and target scope."""
    stats = pipeline.get_database_stats()
    return {
        "status": "healthy",
        "version": settings.app_version,
        "database": {
            "actuals_count": stats["actuals_count"],
            "forecasts_count": stats["forecasts_count"]
        },
        "data_source": stats.get("data_source", "unknown"),
        "data_scope": f"{settings.target_start_date} to {settings.target_end_date}"
    }

@router.get("/overview", response_model=OverviewResponse)
def get_overview(
    start_date: str = Query(default="2026-01-01", description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(default="2026-01-31", description="End date (YYYY-MM-DD)"),
    gate_closure_hour: int = Query(default=11, ge=0, le=23, description="UK Day-Ahead Gate Closure Hour (GMT)")
):
    """High-level summary metrics for executive dashboard cards."""
    paired = get_day_ahead_paired_series(
        start_date=start_date,
        end_date=end_date,
        gate_closure_hour=gate_closure_hour
    )
    if not paired:
        raise HTTPException(status_code=404, detail="No data available for the requested range")
        
    metrics = calculate_overall_metrics(paired)
    buffer = compute_thermal_procurement_buffer(paired)
    
    return {
        "total_intervals": len(paired),
        "mean_actual_mw": metrics["mean_actual_mw"],
        "mean_forecast_mw": metrics["mean_forecast_mw"],
        "mae_mw": metrics["mae_mw"],
        "rmse_mw": metrics["rmse_mw"],
        "mean_bias_mw": metrics["mean_bias_mw"],
        "p90_buffer_mw": buffer["p90_buffer_mw"],
        "gate_closure_time": f"D-1 at {gate_closure_hour:02d}:00 GMT",
        "date_range": f"{start_date} to {end_date}"
    }

@router.get("/timeseries", response_model=TimeSeriesResponse)
def get_timeseries(
    start_date: str = Query(default="2026-01-01", description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(default="2026-01-31", description="End date (YYYY-MM-DD)"),
    gate_closure_hour: int = Query(default=11, ge=0, le=23, description="Gate closure hour (D-1)"),
    gate_closure_minute: int = Query(default=0, ge=0, le=59, description="Gate closure minute (D-1)")
):
    """Granular 30-minute outturn vs day-ahead gate closure forecast time-series."""
    paired = get_day_ahead_paired_series(
        start_date=start_date,
        end_date=end_date,
        gate_closure_hour=gate_closure_hour,
        gate_closure_minute=gate_closure_minute
    )
    return {
        "total_count": len(paired),
        "gate_closure_time": f"D-1 at {gate_closure_hour:02d}:{gate_closure_minute:02d} GMT",
        "data": paired
    }

@router.get("/metrics", response_model=MetricsResponse)
def get_accuracy_metrics(
    start_date: str = Query(default="2026-01-01", description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(default="2026-01-31", description="End date (YYYY-MM-DD)"),
    gate_closure_hour: int = Query(default=11, ge=0, le=23, description="Gate closure hour (D-1)")
):
    """Quantitative forecast accuracy evaluation (MAE, RMSE, MAPE, Bias, Ramp error, Buffers)."""
    paired = get_day_ahead_paired_series(
        start_date=start_date,
        end_date=end_date,
        gate_closure_hour=gate_closure_hour
    )
    metrics = calculate_overall_metrics(paired)
    ramp = calculate_ramp_metrics(paired)
    buffer = compute_thermal_procurement_buffer(paired)
    
    return {
        **metrics,
        "gate_closure_hour": gate_closure_hour,
        "ramp_metrics": ramp,
        "procurement_buffer": buffer
    }

@router.get("/settlement-analysis", response_model=List[SettlementPeriodItem])
def get_settlement_period_analysis(
    start_date: str = Query(default="2026-01-01", description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(default="2026-01-31", description="End date (YYYY-MM-DD)"),
    gate_closure_hour: int = Query(default=11, ge=0, le=23, description="Gate closure hour (D-1)")
):
    """Profile across all 48 half-hour UK settlement periods."""
    paired = get_day_ahead_paired_series(
        start_date=start_date,
        end_date=end_date,
        gate_closure_hour=gate_closure_hour
    )
    return calculate_settlement_period_profile(paired)

@router.get("/daily-breakdown", response_model=List[DailyBreakdownItem])
def get_daily_performance(
    start_date: str = Query(default="2026-01-01", description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(default="2026-01-31", description="End date (YYYY-MM-DD)"),
    gate_closure_hour: int = Query(default=11, ge=0, le=23, description="Gate closure hour (D-1)")
):
    """Daily breakdown for calendar and heatmap visualization."""
    paired = get_day_ahead_paired_series(
        start_date=start_date,
        end_date=end_date,
        gate_closure_hour=gate_closure_hour
    )
    return calculate_daily_breakdown(paired)

@router.get("/financial-impact", response_model=FinancialImpactResponse)
def get_financial_impact(
    start_date: str = Query(default="2026-01-01", description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(default="2026-01-31", description="End date (YYYY-MM-DD)"),
    gate_closure_hour: int = Query(default=11, ge=0, le=23, description="Gate closure hour (D-1)"),
    sbp: float = Query(default=120.0, description="System Buy Price (£/MWh)"),
    ssp: float = Query(default=45.0, description="System Sell Price (£/MWh)"),
    da_price: float = Query(default=75.0, description="Day-Ahead Price (£/MWh)")
):
    """
    Quantifies the economic imbalance penalty cost in GBP resulting from wind forecast errors.
    Translates abstract MW deviations into real trading P&L exposure.
    """
    paired = get_day_ahead_paired_series(
        start_date=start_date,
        end_date=end_date,
        gate_closure_hour=gate_closure_hour
    )
    return calculate_financial_impact(paired, sbp=sbp, ssp=ssp, da_price=da_price)

@router.get("/bias-correction", response_model=BiasCorrectionResponse)
def get_bias_correction_analysis(
    start_date: str = Query(default="2026-01-01", description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(default="2026-01-31", description="End date (YYYY-MM-DD)"),
    gate_closure_hour: int = Query(default=11, ge=0, le=23, description="Gate closure hour (D-1)"),
    window_days: int = Query(default=7, ge=1, le=14, description="Trailing bias calculation window in days")
):
    """
    Evaluates statistical bias correction layer applied to raw Elexon forecasts.
    Returns side-by-side MAE improvement metrics and corrected time series.
    """
    paired = get_day_ahead_paired_series(
        start_date=start_date,
        end_date=end_date,
        gate_closure_hour=gate_closure_hour
    )
    corrected_data = apply_bias_correction(paired, window_days=window_days)
    summary = compare_raw_vs_corrected(paired, window_days=window_days)
    return {
        "summary": summary,
        "data": corrected_data
    }

@router.get("/gate-closure-sensitivity", response_model=List[GateClosureSensitivityItem])
def get_gate_closure_sensitivity(
    start_date: str = Query(default="2026-01-01", description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(default="2026-01-31", description="End date (YYYY-MM-DD)")
):
    """
    Evaluates forecast accuracy (MAE, RMSE, Bias) and Imbalance Cost across multiple
    UK market gate closures (07:00, 09:00, 11:00, 14:00, 17:00, 22:00, Intraday).
    Demonstrates the quantitative value of updated information closer to physical delivery.
    """
    return evaluate_gate_closure_sensitivity(start_date=start_date, end_date=end_date)


@router.get("/forecast-confidence", response_model=ForecastConfidenceResponse)
def get_forecast_confidence(
    start_date: str = Query(default="2026-01-01", description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(default="2026-01-31", description="End date (YYYY-MM-DD)"),
    gate_closure_hour: int = Query(default=11, ge=0, le=23, description="Gate closure hour (D-1)")
):
    """
    Empirical Forecast Confidence & Uncertainty Score.
    Uses a trailing historical error profile (strictly out-of-sample) to score forecast reliability (0-100%) and volatility drivers.
    Helps traders identify high-risk vs high-confidence settlement periods before submitting bids.
    """
    paired = get_day_ahead_paired_series(
        start_date=start_date,
        end_date=end_date,
        gate_closure_hour=gate_closure_hour
    )
    return forecast_model.evaluate_confidence(paired)


