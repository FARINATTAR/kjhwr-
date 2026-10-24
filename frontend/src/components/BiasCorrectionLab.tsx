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
    'Raw Elexon DA': d.dayAheadForecastMW,
    'Debiased Forecast': d.correctedForecastMW,
    rawError: d.errorMW,
    correctedError: d.correctedErrorMW
  })) || [];

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(26,34,51,0.95), rgba(15,23,42,0.98))',
      border: '1px solid rgba(16, 185, 129, 0.25)',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      marginTop: '24px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#f8fafc' }}>
              Statistical Bias-Correction Engine
            </h3>
            <span style={{
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '20px',
              padding: '2px 10px',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.5px'
            }}>
              ANALYTICAL ALPHA
            </span>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#94a3b8', maxWidth: '750px' }}>
            Demonstrates the value-add of an adaptive debiasing layer on top of raw Elexon forecasts. A trailing-window rolling bias correction
            removes systematic over-forecasting errors before placing Day-Ahead bids.
          </p>
        </div>

        {/* Window Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Calibration Window:</span>
          {[3, 7, 14].map((days) => (
            <button
              key={days}
              onClick={() => setWindowDays(days)}
              style={{
                background: windowDays === days ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255,255,255,0.05)',
                color: windowDays === days ? '#34d399' : '#94a3b8',
                border: `1px solid ${windowDays === days ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {days} Days
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
          {/* MAE Improvement */}
          <div style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '10px',
            padding: '14px'
          }}>
            <div style={{ fontSize: '11px', color: '#34d399', textTransform: 'uppercase', fontWeight: 600 }}>
              MAE Improvement
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#6ee7b7', marginTop: '4px', fontFamily: 'monospace' }}>
              {data.summary.mae_improvement_pct > 0 ? `-${data.summary.mae_improvement_pct}%` : `${data.summary.mae_improvement_pct}%`}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
              {data.summary.raw_mae_mw} MW → {data.summary.corrected_mae_mw} MW
            </div>
          </div>

          {/* Bias Reduction */}
          <div style={{
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            borderRadius: '10px',
            padding: '14px'
          }}>
            <div style={{ fontSize: '11px', color: '#38bdf8', textTransform: 'uppercase', fontWeight: 600 }}>
              Systematic Bias Reduction
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#7dd3fc', marginTop: '4px', fontFamily: 'monospace' }}>
              {data.summary.bias_reduction_pct.toFixed(1)}%
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
              {data.summary.raw_mean_bias_mw} MW → {data.summary.corrected_mean_bias_mw} MW
            </div>
          </div>

          {/* Raw Elexon MAE */}
          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '10px',
            padding: '14px'
          }}>
            <div style={{ fontSize: '11px', color: '#f87171', textTransform: 'uppercase', fontWeight: 600 }}>
              Raw Elexon Baseline MAE
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#fca5a5', marginTop: '4px', fontFamily: 'monospace' }}>
              {data.summary.raw_mae_mw} MW
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
              Uncorrected Day-Ahead Forecast
            </div>
          </div>

          {/* Corrected MAE */}
          <div style={{
            background: 'rgba(168, 85, 247, 0.08)',
            border: '1px solid rgba(168, 85, 247, 0.2)',
            borderRadius: '10px',
            padding: '14px'
          }}>
            <div style={{ fontSize: '11px', color: '#c084fc', textTransform: 'uppercase', fontWeight: 600 }}>
              Corrected Model MAE
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#d8b4fe', marginTop: '4px', fontFamily: 'monospace' }}>
              {data.summary.corrected_mae_mw} MW
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
              With {windowDays}d rolling debiasing
            </div>
          </div>
        </div>
      )}

      {/* Visual Chart Comparison */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '12px',
        padding: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>
            Trajectory Comparison: Actual vs Raw Elexon DA vs Debiased Model
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[1, 3, 7].map((days) => (
              <button
                key={days}
                onClick={() => setViewSampleDays(days)}
                style={{
                  background: viewSampleDays === days ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                  color: viewSampleDays === days ? '#38bdf8' : '#64748b',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                {days}d View
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
            Calibrating bias correction model...
          </div>
        ) : (
          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} minTickGap={30} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} unit=" MW" />
                <Tooltip
                  contentStyle={{
                    background: '#0f172a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line
                  type="monotone"
                  dataKey="Actual"
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="Raw Elexon DA"
                  stroke="#ef4444"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="Debiased Forecast"
                  stroke="#10b981"
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
