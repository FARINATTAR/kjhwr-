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
import { api } from './services/api';
import type {
  TimeSeriesPoint,
  AccuracyMetrics,
  SettlementPeriodData,
  DailyBreakdownData
} from './types';

type ActiveTab = 'hedging' | 'financial' | 'bias' | 'sensitivity';

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

  // Fetch data whenever filters change
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      api.getTimeSeries(startDate, endDate, gateClosureHour),
      api.getMetrics('2026-01-01', '2026-01-31', gateClosureHour),
      api.getSettlementAnalysis('2026-01-01', '2026-01-31', gateClosureHour),
      api.getDailyBreakdown(gateClosureHour)
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
        if (isMounted) setLoading(false);
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

      {/* KPI Cards */}
      <KpiCards metrics={metrics} loading={loading} />

      {/* Time-Series Chart (Actual vs Predicted Wind) */}
      <TimeSeriesChart
        data={timeSeries}
        loading={loading}
        gateClosureHour={gateClosureHour}
      />

      {/* Standout Module Navigation Bar */}
      <div style={{
        display: 'flex',
        gap: '10px',
        margin: '28px 0 16px',
        padding: '6px',
        background: 'rgba(15, 23, 42, 0.7)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setActiveTab('hedging')}
          style={{
            flex: 1,
            minWidth: '180px',
            padding: '10px 16px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'hedging' ? 'rgba(56, 189, 248, 0.18)' : 'transparent',
            color: activeTab === 'hedging' ? '#38bdf8' : '#94a3b8',
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
          onClick={() => setActiveTab('financial')}
          style={{
            flex: 1,
            minWidth: '180px',
            padding: '10px 16px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'financial' ? 'rgba(245, 158, 11, 0.18)' : 'transparent',
            color: activeTab === 'financial' ? '#fbbf24' : '#94a3b8',
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
          onClick={() => setActiveTab('bias')}
          style={{
            flex: 1,
            minWidth: '180px',
            padding: '10px 16px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'bias' ? 'rgba(16, 185, 129, 0.18)' : 'transparent',
            color: activeTab === 'bias' ? '#34d399' : '#94a3b8',
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
          onClick={() => setActiveTab('sensitivity')}
          style={{
            flex: 1,
            minWidth: '180px',
            padding: '10px 16px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'sensitivity' ? 'rgba(139, 92, 246, 0.18)' : 'transparent',
            color: activeTab === 'sensitivity' ? '#c084fc' : '#94a3b8',
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
      </div>

      {/* Tab Content Display */}
      {activeTab === 'hedging' && (
        <>
          <ProcurementInsight
            metrics={metrics}
            gateClosureHour={gateClosureHour}
          />
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
            gap: '24px',
            marginTop: '20px'
          }}>
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
        <span>Data: National Grid ESO Wind Generation Records</span>
      </footer>
    </div>
  );
};

export default App;
