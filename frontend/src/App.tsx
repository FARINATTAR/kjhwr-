import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DecisionBar } from './components/DecisionBar';
import { KpiCards } from './components/KpiCards';
import { TimeSeriesChart } from './components/TimeSeriesChart';
import { ProcurementInsight } from './components/ProcurementInsight';
import { SettlementPeriodProfile } from './components/SettlementPeriodProfile';
import { DailyBreakdown } from './components/DailyBreakdown';
import { api } from './services/api';
import type {
  TimeSeriesPoint,
  AccuracyMetrics,
  SettlementPeriodData,
  DailyBreakdownData
} from './types';

export const App: React.FC = () => {
  const [gateClosureHour, setGateClosureHour] = useState<number>(11);
  const [startDate, setStartDate] = useState<string>('2026-01-01');
  const [endDate, setEndDate] = useState<string>('2026-01-05');

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
      // Export all 1488 intervals of January 2026 at current gate closure
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
      link.setAttribute('download', `REint_UK_Wind_Jan2026_Gate${gateClosureHour}h.csv`);
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

      {/* KPI Cards (MAE, RMSE, Bias, P90 Buffer) */}
      <KpiCards metrics={metrics} loading={loading} />

      {/* Time-Series Chart (Actual vs DA Gate-Closure Forecast) */}
      <TimeSeriesChart
        data={timeSeries}
        loading={loading}
        gateClosureHour={gateClosureHour}
      />

      {/* Actionable Trading Procurement & Hedging Insight */}
      <ProcurementInsight
        metrics={metrics}
        gateClosureHour={gateClosureHour}
      />

      {/* Two-Column Analytics Layout: Settlement Periods 1-48 & Daily Trends */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
        gap: '24px'
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

      <footer style={{
        marginTop: '36px',
        paddingTop: '20px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.78rem',
        color: 'var(--text-dim)'
      }}>
        <span>REint Energy Analytics Pilot | UK Wholesale Day-Ahead Trading Desk</span>
        <span>Data: National Grid ESO via Elexon BMRS (FUELHH / WINDFOR)</span>
      </footer>
    </div>
  );
};

export default App;
