"""
Pydantic schemas for API request validation and structured responses.
"""
from typing import Dict, List, Optional
from pydantic import BaseModel, Field

class HealthResponse(BaseModel):
    status: str
    version: str
    database: Dict[str, int]
    data_scope: str

class OverviewResponse(BaseModel):
    total_intervals: int
    mean_actual_mw: float
    mean_forecast_mw: float
    mae_mw: float
    rmse_mw: float
    mean_bias_mw: float
    p90_buffer_mw: float
    gate_closure_time: str
    date_range: str

class TimeSeriesPoint(BaseModel):
    startTime: str
    settlementDate: str
    settlementPeriod: int
    actualMW: float
    dayAheadForecastMW: float
    dayAheadPublishTime: str
    latestForecastMW: float
    latestPublishTime: str
    errorMW: float
    absErrorMW: float
    isOverforecast: bool

class TimeSeriesResponse(BaseModel):
    total_count: int
    gate_closure_time: str
    data: List[TimeSeriesPoint]

class MetricsResponse(BaseModel):
    sample_count: int
    mae_mw: float
    rmse_mw: float
    mape_pct: float
    mean_bias_mw: float
    nmae_pct: float
    mean_actual_mw: float
    mean_forecast_mw: float
    max_overforecast_mw: float
    max_underforecast_mw: float
    gate_closure_hour: int
    ramp_metrics: Dict[str, float]
    procurement_buffer: Dict[str, float]

class SettlementPeriodItem(BaseModel):
    settlementPeriod: int
    timeSlot: str
    isPeakPeriod: bool
    sampleCount: int
    maeMW: float
    rmseMW: float
    meanBiasMW: float
    avgActualMW: float
    avgForecastMW: float

class DailyBreakdownItem(BaseModel):
    date: str
    day: int
    maeMW: float
    rmseMW: float
    meanBiasMW: float
    avgActualMW: float
    avgForecastMW: float
