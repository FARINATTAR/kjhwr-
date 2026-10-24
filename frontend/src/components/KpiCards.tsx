import React from 'react';
import { Zap, TrendingUp, AlertTriangle, ShieldAlert, Scale } from 'lucide-react';
import type { AccuracyMetrics } from '../types';

interface KpiCardsProps {
  metrics: AccuracyMetrics | null;
  loading: boolean;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ metrics, loading }) => {
  if (loading || !metrics) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="card" style={{ height: '110px', opacity: 0.5 }}>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Loading metric...</p>
          </div>
        ))}
      </div>
    );
  }

  // Calculate approximate total energy in GWh (MW * 0.5 hours / 1000)
  const totalGWh = Math.round((metrics.mean_actual_mw * metrics.sample_count * 0.5) / 1000);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
      gap: '16px',
      marginBottom: '24px'
    }}>
      {/* 1. Mean Generation */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Mean Wind Outturn
          </span>
          <Zap size={16} color="#10b981" />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span className="mono" style={{ fontSize: '1.6rem', fontWeight: 700, color: '#10b981' }}>
            {metrics.mean_actual_mw.toLocaleString()}
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>MW</span>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
          Total energy: <strong className="mono" style={{ color: 'var(--text-main)' }}>{totalGWh.toLocaleString()} GWh</strong>
        </p>
      </div>

      {/* 2. MAE (Mean Absolute Error) */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Mean Absolute Error (MAE)
          </span>
          <TrendingUp size={16} color="#f59e0b" />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span className="mono" style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f59e0b' }}>
            {metrics.mae_mw.toLocaleString()}
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>MW</span>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
          Normalized: <strong className="mono" style={{ color: '#f59e0b' }}>{metrics.nmae_pct}%</strong> of fleet outturn
        </p>
      </div>

      {/* 3. RMSE (Root Mean Square Error) */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Root Mean Square (RMSE)
          </span>
          <Scale size={16} color="#38bdf8" />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span className="mono" style={{ fontSize: '1.6rem', fontWeight: 700, color: '#38bdf8' }}>
            {metrics.rmse_mw.toLocaleString()}
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>MW</span>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
          Penalizes volatile ramp swings
        </p>
      </div>

      {/* 4. Forecast Bias */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Forecast Bias (MBE)
          </span>
          <AlertTriangle size={16} color={metrics.mean_bias_mw > 0 ? '#ef4444' : '#38bdf8'} />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span className="mono" style={{
            fontSize: '1.6rem',
            fontWeight: 700,
            color: metrics.mean_bias_mw > 0 ? '#f87171' : '#38bdf8'
          }}>
            {metrics.mean_bias_mw > 0 ? `+${metrics.mean_bias_mw}` : metrics.mean_bias_mw}
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>MW</span>
        </div>
        <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>
          <span className={`badge ${metrics.mean_bias_mw > 0 ? 'badge-danger' : 'badge-info'}`}>
            {metrics.mean_bias_mw > 0 ? 'Net Over-forecast (Deficit Risk)' : 'Net Under-forecast (Spill Risk)'}
          </span>
        </p>
      </div>

      {/* 5. Recommended Thermal Procurement Buffer (P90) */}
      <div className="card" style={{ borderColor: 'rgba(239, 68, 68, 0.4)', background: 'linear-gradient(180deg, #161a29 0%, #111827 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: '#f87171', fontWeight: 600 }}>
            P90 Thermal Buffer
          </span>
          <ShieldAlert size={16} color="#ef4444" />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span className="mono" style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f87171' }}>
            {metrics.procurement_buffer.p90_buffer_mw.toLocaleString()}
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>MW</span>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Recommended thermal reserve margin
        </p>
      </div>
    </div>
  );
};
