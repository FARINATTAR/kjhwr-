import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DecisionBar } from './components/DecisionBar';
import { KpiCards } from './components/KpiCards';
import { TimeSeriesChart } from './components/TimeSeriesChart';
import { ProcurementInsight } from './components/ProcurementInsight';
import { SettlementPeriodProfile } from './components/SettlementPeriodProfile';
import { DailyBreakdown } from './components/DailyBreakdown';
import { FinancialCalculator } from './components/FinancialCalculator';
import { BiasCorrectionLab } from './components/BiasCorrectionLab';
import { GateClosureCurve } from './components/GateClosureCurve';
import { ForecastConfidenceLab } from './components/ForecastConfidenceLab';
import { api } from './services/api';
import type {
  TimeSeriesPoint,
  AccuracyMetrics,
  SettlementPeriodData,
  DailyBreakdownData
} from './types';

type ActiveTab = 'hedging' | 'financial' | 'bias' | 'sensitivity' | 'confidence';


export const App: React.FC = () => {
  const [gateClosureHour, setGateClosureHour] = useState<number>(11);
  const [startDate, setStartDate] = useState<string>('2026-01-01');
  const [endDate, setEndDate] = useState<string>('2026-01-05');
  const [activeTab, setActiveTab] = useState<ActiveTab>('hedging');

  const [loading, setLoading] = useState<boolean>(true);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([]);
  const [metrics, setMetrics] = useState<AccuracyMetrics | null>(null);
  const [settlementProfile, setSettlementProfile] = useState<SettlementPeriodData[]>([]);
  const [dailyTrends, setDailyTrends] = useState<DailyBreakdownData[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  // Fetch data whenever filters change
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    setApiError(null);

    Promise.all([
      api.getTimeSeries(startDate, endDate, gateClosureHour),
      api.getMetrics(startDate, endDate, gateClosureHour),
      api.getSettlementAnalysis(startDate, endDate, gateClosureHour),
      api.getDailyBreakdown(startDate, endDate, gateClosureHour)
    ])
      .then(([ts, met, sp, dt]) => {
        if (!isMounted) return;
        setTimeSeries(ts.data);
        setMetrics(met);
        setSettlementProfile(sp);
        setDailyTrends(dt);
        setLoading(false);
      })
      .catch((err) => {
        console.error('API Fetch error:', err);
        if (isMounted) {
          setApiError(`Failed to load data: ${err.message}`);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [gateClosureHour, startDate, endDate]);

  const handleExportCSV = async () => {
    try {
      const fullSeries = await api.getTimeSeries('2026-01-01', '2026-01-31', gateClosureHour);
      const rows = fullSeries.data;
      if (!rows.length) return;

      const headers = Object.keys(rows[0]).join(',');
      const csvContent = [
        headers,
        ...rows.map((r: any) => Object.values(r).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `UK_Wind_Jan2026_Gate${gateClosureHour}h.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Export failed:', e);
    }
  };

  return (
    <div className="app-container">
      {/* Header with Branding and Export */}
      <Header onExportCSV={handleExportCSV} />

      {/* Decision Gate & Date Control Bar */}
      <DecisionBar
        gateClosureHour={gateClosureHour}
        onGateClosureChange={setGateClosureHour}
        startDate={startDate}
        endDate={endDate}
        onDateChange={(s, e) => {
          setStartDate(s);
          setEndDate(e);
        }}
        totalIntervals={timeSeries.length}
      />

      {/* Error Banner */}
      {apiError && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '10px',
          padding: '12px 18px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#991b1b',
          fontSize: '0.9rem'
        }}>
          <span style={{ fontWeight: 600 }}>⚠ API Error</span>
          <span>{apiError}</span>
          <button
            onClick={() => setApiError(null)}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: '#991b1b',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >×</button>
        </div>
      )}

      {/* KPI Cards */}
      <KpiCards metrics={metrics} loading={loading} />

      {/* Time-Series Chart (Actual vs Predicted Wind) */}
      <TimeSeriesChart
        data={timeSeries}
        loading={loading}
        gateClosureHour={gateClosureHour}
      />

      {/* Standout Module Navigation Bar */}
      <div className="tab-nav-bar" style={{
        display: 'flex',
        gap: '10px',
        margin: '28px 0 16px',
        padding: '6px',
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        flexWrap: 'wrap'
      }}>
        <button
          className="tab-btn"
          onClick={() => setActiveTab('hedging')}
          style={{
            flex: 1,
            minWidth: '180px',
            padding: '10px 16px',
            borderRadius: '8px',
            border: activeTab === 'hedging' ? '1px solid #bae6fd' : '1px solid transparent',
            background: activeTab === 'hedging' ? '#f0f9ff' : 'transparent',
            color: activeTab === 'hedging' ? '#0284c7' : '#64748b',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <span>Buying Guidance & Daily Patterns</span>
        </button>

        <button
          className="tab-btn"
          onClick={() => setActiveTab('financial')}
          style={{
            flex: 1,
            minWidth: '180px',
            padding: '10px 16px',
            borderRadius: '8px',
            border: activeTab === 'financial' ? '1px solid #fde68a' : '1px solid transparent',
            background: activeTab === 'financial' ? '#fffbeb' : 'transparent',
            color: activeTab === 'financial' ? '#b45309' : '#64748b',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <span>Penalty & Risk Calculator</span>
        </button>

        <button
          className="tab-btn"
          onClick={() => setActiveTab('bias')}
          style={{
            flex: 1,
            minWidth: '180px',
            padding: '10px 16px',
            borderRadius: '8px',
            border: activeTab === 'bias' ? '1px solid #a7f3d0' : '1px solid transparent',
            background: activeTab === 'bias' ? '#ecfdf5' : 'transparent',
            color: activeTab === 'bias' ? '#047857' : '#64748b',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <span>Smart Forecast Tuning</span>
        </button>

        <button
          className="tab-btn"
          onClick={() => setActiveTab('sensitivity')}
          style={{
            flex: 1,
            minWidth: '180px',
            padding: '10px 16px',
            borderRadius: '8px',
            border: activeTab === 'sensitivity' ? '1px solid #ddd6fe' : '1px solid transparent',
            background: activeTab === 'sensitivity' ? '#ede9fe' : 'transparent',
            color: activeTab === 'sensitivity' ? '#6d28d9' : '#64748b',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <span>Timing & Accuracy</span>
        </button>

        <button
          className="tab-btn"
          onClick={() => setActiveTab('confidence')}
          style={{
            flex: 1,
            minWidth: '180px',
            padding: '10px 16px',
            borderRadius: '8px',
            border: activeTab === 'confidence' ? '1px solid #93c5fd' : '1px solid transparent',
            background: activeTab === 'confidence' ? '#eff6ff' : 'transparent',
            color: activeTab === 'confidence' ? '#1d4ed8' : '#64748b',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <span>Smart Reliability Scores</span>
        </button>

      </div>

      {/* Tab Content Display */}
      {activeTab === 'hedging' && (
        <>
          <ProcurementInsight
            metrics={metrics}
            gateClosureHour={gateClosureHour}
          />
          <div className="responsive-grid-2" style={{ marginTop: '20px' }}>
            <SettlementPeriodProfile
              data={settlementProfile}
              loading={loading}
            />
            <DailyBreakdown
              data={dailyTrends}
              loading={loading}
            />
          </div>
        </>
      )}

      {activeTab === 'financial' && (
        <FinancialCalculator gateClosureHour={gateClosureHour} />
      )}

      {activeTab === 'bias' && (
        <BiasCorrectionLab gateClosureHour={gateClosureHour} />
      )}

      {activeTab === 'sensitivity' && (
        <GateClosureCurve />
      )}

      {activeTab === 'confidence' && (
        <ForecastConfidenceLab gateClosureHour={gateClosureHour} />
      )}



      <footer style={{
        marginTop: '36px',
        paddingTop: '20px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.78rem',
        color: 'var(--text-dim)'
      }}>
        <span>UK Wholesale Day-Ahead Wind Forecasting & Decision Desk</span>
        <span>Data: Elexon BMRS FUELHH &amp; WINDFOR | January 2026</span>
      </footer>
    </div>
  );
};

export default App;
