import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceArea
} from 'recharts';
import type { SettlementPeriodData } from '../types';

interface SettlementPeriodProfileProps {
  data: SettlementPeriodData[];
  loading: boolean;
}

export const SettlementPeriodProfile: React.FC<SettlementPeriodProfileProps> = ({
  data,
  loading
}) => {
  if (loading) {
    return (
      <div className="card" style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading time-of-day accuracy profile...</p>
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
          padding: '12px 14px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
          fontSize: '0.8rem',
          minWidth: '220px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Time Slot {p.settlementPeriod} ({p.timeSlot})</span>
            {p.isPeakPeriod && <span className="badge badge-warning">Peak Hours</span>}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: '#d97706' }}>Avg Forecast Miss:</span>
            <strong className="mono" style={{ color: '#0f172a' }}>{p.maeMW.toLocaleString()} MW</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: '#059669' }}>Avg Generation:</span>
            <strong className="mono" style={{ color: '#0f172a' }}>{p.avgActualMW.toLocaleString()} MW</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Prediction Lean:</span>
            <strong className="mono" style={{ color: p.meanBiasMW > 0 ? '#dc2626' : '#0284c7' }}>
              {p.meanBiasMW > 0 ? `+${p.meanBiasMW}` : p.meanBiasMW} MW
            </strong>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>
            Time-of-Day Accuracy Profile
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            How forecast accuracy varies across the 48 half-hour slots in a day
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge badge-warning">
            Shaded: Peak Hours (16:00–19:30 GMT)
          </span>
        </div>
      </div>

      <div style={{ width: '100%', height: '280px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="settlementPeriod"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              label={{ value: 'Half-Hour Slot (1 - 48)', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 11 }}
            />
            <YAxis
              yAxisId="left"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              unit=" MW"
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              unit=" MW"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '10px' }} />

            {/* Highlight Peak Demand SP 33 to 39 */}
            <ReferenceArea
              yAxisId="left"
              x1={33}
              x2={39}
              strokeOpacity={0.3}
              fill="#f59e0b"
              fillOpacity={0.12}
            />

            <Bar
              yAxisId="left"
              dataKey="maeMW"
              name="Avg Forecast Miss (MW)"
              fill="#d97706"
              radius={[3, 3, 0, 0]}
              opacity={0.85}
            />

            <Line
              yAxisId="right"
              type="monotone"
              dataKey="avgActualMW"
              name="Avg Actual Generation (MW)"
              stroke="#059669"
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
