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

export interface FinancialImpactData {
  total_imbalance_cost_gbp: number;
  deficit_cost_gbp: number;
  surplus_cost_gbp: number;
  deficit_energy_mwh: number;
  surplus_energy_mwh: number;
  avg_cost_per_interval_gbp: number;
  worst_single_deficit_gbp: number;
  worst_single_surplus_gbp: number;
  deficit_intervals: number;
  surplus_intervals: number;
  total_intervals: number;
  assumptions: {
    system_buy_price_gbp_mwh: number;
    system_sell_price_gbp_mwh: number;
    day_ahead_price_gbp_mwh: number;
  };
}

export interface BiasCorrectionPoint {
  startTime: string;
  settlementDate: string;
  settlementPeriod: number;
  actualMW: number;
  dayAheadForecastMW: number;
  correctedForecastMW: number;
  errorMW: number;
  correctedErrorMW: number;
  absCorrectedErrorMW: number;
  biasAppliedMW: number;
}

export interface BiasCorrectionData {
  summary: {
    raw_mae_mw: number;
    corrected_mae_mw: number;
    mae_improvement_pct: number;
    raw_mean_bias_mw: number;
    corrected_mean_bias_mw: number;
    bias_reduction_pct: number;
    correction_window_days: number;
    sample_count: number;
  };
  data: BiasCorrectionPoint[];
}

export interface GateClosureSensitivityItem {
  closureLabel: string;
  closureHour: number;
  description: string;
  maeMW: number;
  rmseMW: number;
  meanBiasMW: number;
  imbalanceCostGBP: number;
  sampleCount: number;
}

export interface ForecastConfidenceInterval {
  startTime: string;
  settlementDate: string;
  settlementPeriod: number;
  actualMW: number;
  dayAheadForecastMW: number;
  expectedUncertaintyMW: number;
  confidenceScore: number;
  confidenceTier: 'High' | 'Medium' | 'Low';
}

export interface ForecastConfidenceData {
  average_confidence_pct: number;
  overall_tier: 'High' | 'Medium' | 'Low';
  high_confidence_count: number;
  medium_confidence_count: number;
  low_confidence_count: number;
  total_intervals: number;
  model_type: string;
  feature_importances: Record<string, number>;
  summary_recommendation: string;
  data: ForecastConfidenceInterval[];
}


