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
        <p style={{ color: 'var(--text-muted)' }}>Loading settlement period profile...</p>
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
          padding: '12px 14px',
          fontSize: '0.8rem',
          minWidth: '220px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Period {p.settlementPeriod} ({p.timeSlot})</span>
            {p.isPeakPeriod && <span className="badge badge-warning">UK Peak</span>}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: '#f59e0b' }}>MAE (Error):</span>
            <strong className="mono">{p.maeMW.toLocaleString()} MW</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: '#10b981' }}>Avg Generation:</span>
            <strong className="mono">{p.avgActualMW.toLocaleString()} MW</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Mean Bias:</span>
            <strong className="mono" style={{ color: p.meanBiasMW > 0 ? '#ef4444' : '#38bdf8' }}>
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
            Settlement Period Error Profile (SP 1 to 48)
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Average error across the 48 half-hour trading blocks in the UK day
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge badge-warning">
            Shaded: SP 33–39 (UK Peak 16:00–19:30 GMT)
          </span>
        </div>
      </div>

      <div style={{ width: '100%', height: '280px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
            <XAxis
              dataKey="settlementPeriod"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              label={{ value: 'Settlement Period (1 - 48)', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 11 }}
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
              fillOpacity={0.08}
            />

            <Bar
              yAxisId="left"
              dataKey="maeMW"
              name="Mean Absolute Error (MW)"
              fill="#f59e0b"
              radius={[3, 3, 0, 0]}
              opacity={0.85}
            />

            <Line
              yAxisId="right"
              type="monotone"
              dataKey="avgActualMW"
              name="Avg Outturn (MW)"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
