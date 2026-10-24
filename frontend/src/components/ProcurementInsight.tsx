import React from 'react';
import { ShieldCheck, AlertCircle, ArrowUpRight, Flame } from 'lucide-react';
import type { AccuracyMetrics } from '../types';

interface ProcurementInsightProps {
  metrics: AccuracyMetrics | null;
  gateClosureHour: number;
}

export const ProcurementInsight: React.FC<ProcurementInsightProps> = ({ metrics, gateClosureHour }) => {
  if (!metrics) return null;

  const buf = metrics.procurement_buffer;

  return (
    <div className="card" style={{
      marginBottom: '24px',
      background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
      border: '1px solid rgba(245, 158, 11, 0.3)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: 'rgba(245, 158, 11, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Flame size={18} color="#f59e0b" />
        </div>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>
            Procurement Decision Engine & Balancing Risk Recommendation
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Quantified hedging strategy for UK wholesale Day-Ahead auction at {gateClosureHour}:00 GMT
          </p>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '16px'
      }}>
        {/* Recommendation Box 1 */}
        <div style={{
          padding: '14px',
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <ShieldCheck size={16} color="#10b981" />
            <strong style={{ fontSize: '0.85rem', color: '#10b981' }}>Recommended Thermal Reserve</strong>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.45' }}>
            To achieve <strong style={{ color: 'var(--text-main)' }}>90% confidence</strong> against wind under-generation penalties, contract a flexible thermal buffer of:
          </p>
          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span className="mono" style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f59e0b' }}>
              +{buf.p90_buffer_mw.toLocaleString()} MW
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>(P95: +{buf.p95_buffer_mw.toLocaleString()} MW)</span>
          </div>
        </div>

        {/* Recommendation Box 2 */}
        <div style={{
          padding: '14px',
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <AlertCircle size={16} color="#ef4444" />
            <strong style={{ fontSize: '0.85rem', color: '#ef4444' }}>Deficit Exposure Frequency</strong>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.45' }}>
            In January 2026, wind was lower than Day-Ahead forecast across:
          </p>
          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span className="mono" style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f87171' }}>
              {buf.deficit_probability_pct}%
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              ({buf.deficit_intervals} of {buf.total_intervals} settlement periods)
            </span>
          </div>
        </div>

        {/* Recommendation Box 3 */}
        <div style={{
          padding: '14px',
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <ArrowUpRight size={16} color="#38bdf8" />
            <strong style={{ fontSize: '0.85rem', color: '#38bdf8' }}>Evening Peak Protocol (SP 33–39)</strong>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.45' }}>
            UK System Buy Price (SBP) spikes heavily between 16:30 and 19:30. Apply dynamic derating on wind forecasts during peak periods to avoid peak cash-out penalties.
          </p>
        </div>
      </div>
    </div>
  );
};
