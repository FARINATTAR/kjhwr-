import type {
  OverviewData,
  TimeSeriesResponse,
  SettlementPeriodData,
  DailyBreakdownData,
  AccuracyMetrics,
  FinancialImpactData,
  BiasCorrectionData,
  GateClosureSensitivityItem,
  ForecastConfidenceData
} from '../types';


const BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'https://windcast-analytics-api.onrender.com');

export const api = {
  async getOverview(
    startDate: string = '2026-01-01',
    endDate: string = '2026-01-31',
    gateClosureHour: number = 11
  ): Promise<OverviewData> {
    const res = await fetch(
      `${BASE_URL}/api/overview?start_date=${startDate}&end_date=${endDate}&gate_closure_hour=${gateClosureHour}`
    );
    if (!res.ok) throw new Error('Failed to fetch overview metrics');
    return res.json();
  },

  async getTimeSeries(
    startDate: string = '2026-01-01',
    endDate: string = '2026-01-03',
    gateClosureHour: number = 11
  ): Promise<TimeSeriesResponse> {
    const res = await fetch(
      `${BASE_URL}/api/timeseries?start_date=${startDate}&end_date=${endDate}&gate_closure_hour=${gateClosureHour}`
    );
    if (!res.ok) throw new Error('Failed to fetch time series');
    return res.json();
  },

  async getMetrics(
    startDate: string = '2026-01-01',
    endDate: string = '2026-01-31',
    gateClosureHour: number = 11
  ): Promise<AccuracyMetrics> {
    const res = await fetch(
      `${BASE_URL}/api/metrics?start_date=${startDate}&end_date=${endDate}&gate_closure_hour=${gateClosureHour}`
    );
    if (!res.ok) throw new Error('Failed to fetch accuracy metrics');
    return res.json();
  },

  async getSettlementAnalysis(
    startDate: string = '2026-01-01',
    endDate: string = '2026-01-31',
    gateClosureHour: number = 11
  ): Promise<SettlementPeriodData[]> {
    const res = await fetch(
      `${BASE_URL}/api/settlement-analysis?start_date=${startDate}&end_date=${endDate}&gate_closure_hour=${gateClosureHour}`
    );
    if (!res.ok) throw new Error('Failed to fetch settlement analysis');
    return res.json();
  },

  async getDailyBreakdown(gateClosureHour: number = 11): Promise<DailyBreakdownData[]> {
    const res = await fetch(`${BASE_URL}/api/daily-breakdown?gate_closure_hour=${gateClosureHour}`);
    if (!res.ok) throw new Error('Failed to fetch daily breakdown');
    return res.json();
  },

  async getFinancialImpact(
    startDate: string = '2026-01-01',
    endDate: string = '2026-01-31',
    gateClosureHour: number = 11,
    sbp: number = 120,
    ssp: number = 45,
    daPrice: number = 75
  ): Promise<FinancialImpactData> {
    const res = await fetch(
      `${BASE_URL}/api/financial-impact?start_date=${startDate}&end_date=${endDate}&gate_closure_hour=${gateClosureHour}&sbp=${sbp}&ssp=${ssp}&da_price=${daPrice}`
    );
    if (!res.ok) throw new Error('Failed to fetch financial impact');
    return res.json();
  },

  async getBiasCorrection(
    startDate: string = '2026-01-01',
    endDate: string = '2026-01-31',
    gateClosureHour: number = 11,
    windowDays: number = 7
  ): Promise<BiasCorrectionData> {
    const res = await fetch(
      `${BASE_URL}/api/bias-correction?start_date=${startDate}&end_date=${endDate}&gate_closure_hour=${gateClosureHour}&window_days=${windowDays}`
    );
    if (!res.ok) throw new Error('Failed to fetch bias correction data');
    return res.json();
  },

  async getGateClosureSensitivity(
    startDate: string = '2026-01-01',
    endDate: string = '2026-01-31'
  ): Promise<GateClosureSensitivityItem[]> {
    const res = await fetch(
      `${BASE_URL}/api/gate-closure-sensitivity?start_date=${startDate}&end_date=${endDate}`
    );
    if (!res.ok) throw new Error('Failed to fetch gate closure sensitivity');
    return res.json();
  },

  async getForecastConfidence(
    startDate: string = '2026-01-01',
    endDate: string = '2026-01-31',
    gateClosureHour: number = 11
  ): Promise<ForecastConfidenceData> {
    const res = await fetch(
      `${BASE_URL}/api/forecast-confidence?start_date=${startDate}&end_date=${endDate}&gate_closure_hour=${gateClosureHour}`
    );
    if (!res.ok) throw new Error('Failed to fetch forecast confidence data');
    return res.json();
  }
};


