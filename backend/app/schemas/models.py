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

class FinancialImpactResponse(BaseModel):
    total_imbalance_cost_gbp: float
    deficit_cost_gbp: float
    surplus_cost_gbp: float
    deficit_energy_mwh: float
    surplus_energy_mwh: float
    avg_cost_per_interval_gbp: float
    worst_single_deficit_gbp: float
    worst_single_surplus_gbp: float
    deficit_intervals: int
    surplus_intervals: int
    total_intervals: int
    assumptions: Dict[str, float]

class BiasCorrectionComparison(BaseModel):
    raw_mae_mw: float
    corrected_mae_mw: float
    mae_improvement_pct: float
    raw_mean_bias_mw: float
    corrected_mean_bias_mw: float
    bias_reduction_pct: float
    correction_window_days: int
    sample_count: int

class BiasCorrectionPoint(BaseModel):
    startTime: str
    settlementDate: str
    settlementPeriod: int
    actualMW: float
    dayAheadForecastMW: float
    correctedForecastMW: float
    errorMW: float
    correctedErrorMW: float
    absCorrectedErrorMW: float
    biasAppliedMW: float

class BiasCorrectionResponse(BaseModel):
    summary: BiasCorrectionComparison
    data: List[BiasCorrectionPoint]

class GateClosureSensitivityItem(BaseModel):
    closureLabel: str
    closureHour: int
    description: str
    maeMW: float
    rmseMW: float
    meanBiasMW: float
    imbalanceCostGBP: float
    sampleCount: int


class ForecastConfidenceInterval(BaseModel):
    startTime: str
    settlementDate: str
    settlementPeriod: int
    actualMW: float
    dayAheadForecastMW: float
    expectedUncertaintyMW: float
    confidenceScore: float
    confidenceTier: str


class ForecastConfidenceResponse(BaseModel):
    average_confidence_pct: float
    overall_tier: str
    high_confidence_count: int
    medium_confidence_count: int
    low_confidence_count: int
    total_intervals: int
    model_type: str
    feature_importances: Dict[str, float]
    summary_recommendation: str
    data: List[ForecastConfidenceInterval]


