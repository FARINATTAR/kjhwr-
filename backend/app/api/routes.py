"""
API Routes for REint Wind Forecasting and Day-Ahead Trading Analytics.
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
from app.schemas.models import (
    HealthResponse,
    OverviewResponse,
    TimeSeriesResponse,
    MetricsResponse,
    SettlementPeriodItem,
    DailyBreakdownItem
)

router = APIRouter(prefix="/api")

@router.get("/health", response_model=HealthResponse)
def get_health():
    """Health check endpoint providing database stats and target scope."""
    stats = pipeline.get_database_stats()
    return {
        "status": "healthy",
        "version": settings.app_version,
        "database": stats,
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
    gate_closure_hour: int = Query(default=11, ge=0, le=23, description="Gate closure hour (D-1)")
):
    """Daily breakdown for January 2026 calendar and heatmap visualization."""
    paired = get_day_ahead_paired_series(
        start_date="2026-01-01",
        end_date="2026-01-31",
        gate_closure_hour=gate_closure_hour
    )
    return calculate_daily_breakdown(paired)
