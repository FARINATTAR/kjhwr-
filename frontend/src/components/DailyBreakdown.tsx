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
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '8px',
          padding: '10px 14px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
          fontSize: '0.8rem'
        }}>
          <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
            {p.date}
          </div>
          <div style={{ color: '#059669' }}>Avg Generation: <strong className="mono" style={{ color: '#0f172a' }}>{p.avgActualMW.toLocaleString()} MW</strong></div>
          <div style={{ color: '#d97706' }}>Forecast Miss: <strong className="mono" style={{ color: '#0f172a' }}>{p.maeMW.toLocaleString()} MW</strong></div>
          <div style={{ color: p.meanBiasMW > 0 ? '#dc2626' : '#0284c7' }}>
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
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
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
            <Bar dataKey="maeMW" name="Daily Forecast Miss (MW)" fill="#d97706" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
