import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine
} from 'recharts';

import { Eye, EyeOff } from 'lucide-react';
import type { TimeSeriesPoint } from '../types';

interface TimeSeriesChartProps {
  data: TimeSeriesPoint[];
  loading: boolean;
  gateClosureHour: number;
}

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  data,
  loading,
  gateClosureHour
}) => {
  const [showIntraday, setShowIntraday] = useState(false);

  if (loading) {
    return (
      <div className="card" style={{ height: '420px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading time-series data...</p>
      </div>
    );
  }

  // Format data for chart display
  const chartData = data.map((d) => ({
    ...d,
    displayTime: d.startTime.slice(5, 16).replace('T', ' '),
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div style={{
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '8px',
          padding: '12px 16px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
          fontSize: '0.8rem',
          minWidth: '220px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
            <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{p.displayTime} GMT</span>
            <span className="badge badge-info">Slot {p.settlementPeriod}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: '#059669' }}>● Actual Wind:</span>
            <strong className="mono" style={{ color: '#0f172a' }}>{p.actualMW.toLocaleString()} MW</strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: '#d97706' }}>● Predicted Wind ({gateClosureHour}:00):</span>
            <strong className="mono" style={{ color: '#0f172a' }}>{p.dayAheadForecastMW.toLocaleString()} MW</strong>
          </div>

          {showIntraday && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#7c3aed' }}>● Updated Forecast:</span>
              <strong className="mono" style={{ color: '#0f172a' }}>{p.latestForecastMW.toLocaleString()} MW</strong>
            </div>
          )}

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '8px',
            paddingTop: '6px',
            borderTop: '1px solid #e2e8f0'
          }}>
            <span style={{ color: p.errorMW > 0 ? '#dc2626' : '#0284c7' }}>
              Forecast Gap:
            </span>
            <strong className="mono" style={{ color: p.errorMW > 0 ? '#dc2626' : '#0284c7' }}>
              {p.errorMW > 0 ? `+${p.errorMW}` : p.errorMW} MW
            </strong>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Published: {p.dayAheadPublishTime.replace('T', ' ').slice(0, 16)}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>
            Actual Wind vs Predicted Wind
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Comparing real wind output against the day-ahead forecast locked in at {gateClosureHour}:00 GMT
          </p>
        </div>

        <button
          className="btn"
          onClick={() => setShowIntraday(!showIntraday)}
          style={{
            fontSize: '0.8rem',
            borderColor: showIntraday ? '#7c3aed' : '#cbd5e1',
            color: showIntraday ? '#7c3aed' : 'var(--text-muted)',
            background: showIntraday ? '#f5f3ff' : '#ffffff'
          }}
        >
          {showIntraday ? <Eye size={14} /> : <EyeOff size={14} />}
          <span>{showIntraday ? 'Hide Updated Forecast' : 'Compare Updated Forecast'}</span>
        </button>
      </div>

      <div style={{ width: '100%', height: '360px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#059669" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="displayTime"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              interval={Math.floor(chartData.length / 8)}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              domain={['auto', 'auto']}
              unit=" MW"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '10px' }} />

            <Area
              type="monotone"
              dataKey="actualMW"
              name="Actual Wind Output"
              stroke="#059669"
              strokeWidth={2}
              fill="url(#actualGrad)"
            />

            <Line
              type="monotone"
              dataKey="dayAheadForecastMW"
              name={`Predicted Wind (${gateClosureHour}:00 Day Before)`}
              stroke="#d97706"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
            />

            {showIntraday && (
              <Line
                type="monotone"
                dataKey="latestForecastMW"
                name="Updated Forecast (Same Day)"
                stroke="#7c3aed"
                strokeWidth={1.5}
                strokeDasharray="2 2"
                dot={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Sub-chart: Error Magnitude Delta */}
      <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Forecast Gap (MW) = Predicted - Actual
          </span>
          <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem' }}>
            <span style={{ color: '#dc2626', fontWeight: 500 }}>■ Over-predicted (Expected More)</span>
            <span style={{ color: '#0284c7', fontWeight: 500 }}>■ Under-predicted (Expected Less)</span>
          </div>
        </div>

        <div style={{ width: '100%', height: '110px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="displayTime" hide />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit=" MW" />
              <ReferenceLine y={0} stroke="#94a3b8" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="errorMW" name="Gap MW">
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.errorMW >= 0 ? '#dc2626' : '#0284c7'}
                  />
                ))}
              </Bar>

            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
