export interface OverviewData {
  total_intervals: number;
  mean_actual_mw: number;
  mean_forecast_mw: number;
  mae_mw: number;
  rmse_mw: number;
  mean_bias_mw: number;
  p90_buffer_mw: number;
  gate_closure_time: string;
  date_range: string;
}

export interface TimeSeriesPoint {
  startTime: string;
  settlementDate: string;
  settlementPeriod: number;
  actualMW: number;
  dayAheadForecastMW: number;
  dayAheadPublishTime: string;
  latestForecastMW: number;
  latestPublishTime: string;
  errorMW: number;
  absErrorMW: number;
  isOverforecast: boolean;
}

export interface TimeSeriesResponse {
  total_count: number;
  gate_closure_time: string;
  data: TimeSeriesPoint[];
}

export interface SettlementPeriodData {
  settlementPeriod: number;
  timeSlot: string;
  isPeakPeriod: boolean;
  sampleCount: number;
  maeMW: number;
  rmseMW: number;
  meanBiasMW: number;
  avgActualMW: number;
  avgForecastMW: number;
}

export interface DailyBreakdownData {
  date: string;
  day: number;
  maeMW: number;
  rmseMW: number;
  meanBiasMW: number;
  avgActualMW: number;
  avgForecastMW: number;
}

export interface AccuracyMetrics {
  sample_count: number;
  mae_mw: number;
  rmse_mw: number;
  mape_pct: number;
  mean_bias_mw: number;
  nmae_pct: number;
  mean_actual_mw: number;
  mean_forecast_mw: number;
  max_overforecast_mw: number;
  max_underforecast_mw: number;
  gate_closure_hour: number;
  ramp_metrics: {
    ramp_mae_mw: number;
    max_actual_ramp_mw: number;
    max_forecast_ramp_mw: number;
  };
  procurement_buffer: {
    p90_buffer_mw: number;
    p95_buffer_mw: number;
    max_deficit_mw: number;
    deficit_probability_pct: number;
    total_intervals: number;
    deficit_intervals: number;
  };
}
