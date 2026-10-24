import React, { useState, useEffect } from 'react';
import type { BiasCorrectionData } from '../types';
import { api } from '../services/api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface Props {
  gateClosureHour: number;
}

export const BiasCorrectionLab: React.FC<Props> = ({ gateClosureHour }) => {
  const [windowDays, setWindowDays] = useState<number>(7);
  const [data, setData] = useState<BiasCorrectionData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewSampleDays, setViewSampleDays] = useState<number>(3);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api.getBiasCorrection('2026-01-01', '2026-01-31', gateClosureHour, windowDays)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error(err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [gateClosureHour, windowDays]);

  // Subset for visualization (first N days to keep chart crisp)
  const chartData = data?.data.slice(0, viewSampleDays * 48).map(d => ({
    time: `${d.settlementDate.slice(5)} SP${d.settlementPeriod}`,
    Actual: d.actualMW,
    'Raw Market Forecast': d.dayAheadForecastMW,
    'Debiased Forecast': d.correctedForecastMW,
    rawError: d.errorMW,
    correctedError: d.correctedErrorMW
  })) || [];

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.03)',
      marginTop: '24px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
              Smart Forecast Tuning (Error Auto-Correction)
            </h3>
            <span style={{
              background: '#ecfdf5',
              color: '#065f46',
              border: '1px solid #a7f3d0',
              borderRadius: '20px',
              padding: '2px 10px',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.5px'
            }}>
              ACCURACY BOOST
            </span>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#64748b', maxWidth: '750px' }}>
            Standard weather forecasts consistently predict too much or too little wind. Our smart tuning engine learns from recent days
            and automatically adjusts the numbers before you commit to trading positions.
          </p>
        </div>

        {/* Window Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Learning Memory:</span>
          {[3, 7, 14].map((days) => (
            <button
              key={days}
              onClick={() => setWindowDays(days)}
              style={{
                background: windowDays === days ? '#ecfdf5' : '#f8fafc',
                color: windowDays === days ? '#047857' : '#64748b',
                border: `1px solid ${windowDays === days ? '#a7f3d0' : '#e2e8f0'}`,
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Past {days} Days
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Badges */}
      {data && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px',
          marginBottom: '20px'
        }}>
          {/* Error Reduction */}
          <div style={{
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: '10px',
            padding: '14px'
          }}>
            <div style={{ fontSize: '11px', color: '#059669', textTransform: 'uppercase', fontWeight: 600 }}>
              Forecast Error Reduction
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#047857', marginTop: '4px', fontFamily: 'monospace' }}>
              {data.summary.mae_improvement_pct > 0 ? `+${data.summary.mae_improvement_pct}%` : `${data.summary.mae_improvement_pct}%`}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              Error dropped from {data.summary.raw_mae_mw} MW to {data.summary.corrected_mae_mw} MW
            </div>
          </div>

          {/* Over-Prediction Eliminated */}
          <div style={{
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '10px',
            padding: '14px'
          }}>
            <div style={{ fontSize: '11px', color: '#0284c7', textTransform: 'uppercase', fontWeight: 600 }}>
              Over-Prediction Cut
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#0369a1', marginTop: '4px', fontFamily: 'monospace' }}>
              {data.summary.bias_reduction_pct.toFixed(1)}%
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              Systematic bias: {data.summary.raw_mean_bias_mw} MW down to {data.summary.corrected_mean_bias_mw} MW
            </div>
          </div>

          {/* Raw Elexon MAE */}
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '10px',
            padding: '14px'
          }}>
            <div style={{ fontSize: '11px', color: '#dc2626', textTransform: 'uppercase', fontWeight: 600 }}>
              Standard Market Miss (Avg)
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#b91c1c', marginTop: '4px', fontFamily: 'monospace' }}>
              {data.summary.raw_mae_mw} MW
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              Standard unadjusted weather forecast
            </div>
          </div>

          {/* Corrected MAE */}
          <div style={{
            background: '#faf5ff',
            border: '1px solid #e9d5ff',
            borderRadius: '10px',
            padding: '14px'
          }}>
            <div style={{ fontSize: '11px', color: '#7e22ce', textTransform: 'uppercase', fontWeight: 600 }}>
              Tuned Model Miss (Avg)
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#6b21a8', marginTop: '4px', fontFamily: 'monospace' }}>
              {data.summary.corrected_mae_mw} MW
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              After learning from past {windowDays} days
            </div>
          </div>
        </div>
      )}


      {/* Visual Chart Comparison */}
      <div style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
            Trajectory Comparison: Actual vs Raw Elexon DA vs Debiased Model
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[1, 3, 7].map((days) => (
              <button
                key={days}
                onClick={() => setViewSampleDays(days)}
                style={{
                  background: viewSampleDays === days ? '#e0f2fe' : 'transparent',
                  color: viewSampleDays === days ? '#0284c7' : '#64748b',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  fontWeight: viewSampleDays === days ? 600 : 500,
                  cursor: 'pointer'
                }}
              >
                {days}d View
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
            Calibrating bias correction model...
          </div>
        ) : (
          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} minTickGap={30} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} unit=" MW" />
                <Tooltip
                  contentStyle={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#0f172a',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line
                  type="monotone"
                  dataKey="Actual"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="Raw Market Forecast"
                  stroke="#dc2626"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="Debiased Forecast"
                  stroke="#059669"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
