import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import type { DailyBreakdownData } from '../types';

interface DailyBreakdownProps {
  data: DailyBreakdownData[];
  loading: boolean;
}

export const DailyBreakdown: React.FC<DailyBreakdownProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="card" style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading daily trends...</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div style={{
          background: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '8px',
          padding: '10px 14px',
          fontSize: '0.8rem'
        }}>
          <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
            {p.date}
          </div>
          <div style={{ color: '#10b981' }}>Avg Generation: <strong className="mono">{p.avgActualMW.toLocaleString()} MW</strong></div>
          <div style={{ color: '#f59e0b' }}>Forecast Miss: <strong className="mono">{p.maeMW.toLocaleString()} MW</strong></div>
          <div style={{ color: p.meanBiasMW > 0 ? '#ef4444' : '#38bdf8' }}>
            Prediction Lean: <strong className="mono">{p.meanBiasMW > 0 ? `+${p.meanBiasMW}` : p.meanBiasMW} MW</strong>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card">
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>
          Daily Forecast Accuracy Trend (January 1 – 31, 2026)
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Day-by-day forecast miss compared to average daily output
        </p>
      </div>

      <div style={{ width: '100%', height: '240px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
            <XAxis
              dataKey="day"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              tickFormatter={(d) => `Jan ${d}`}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              unit=" MW"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '8px' }} />
            <Bar dataKey="maeMW" name="Daily Forecast Miss (MW)" fill="#f59e0b" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
