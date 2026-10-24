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
            Commercial Dispatch & Backup Reserve Guidance
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Plain-English power hedging advice for Day-Ahead trading decisions at {gateClosureHour}:00 GMT
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
            <strong style={{ fontSize: '0.85rem', color: '#10b981' }}>Recommended Backup Power</strong>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.45' }}>
            To be <strong style={{ color: 'var(--text-main)' }}>90% certain</strong> you won't get hit with emergency power penalty fees, hold ready:
          </p>
          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span className="mono" style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f59e0b' }}>
              +{buf.p90_buffer_mw.toLocaleString()} MW
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>(95% safety: +{buf.p95_buffer_mw.toLocaleString()} MW)</span>
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
            <strong style={{ fontSize: '0.85rem', color: '#ef4444' }}>How Often Wind Under-Delivered</strong>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.45' }}>
            In January 2026, wind generation fell short of the forecast in:
          </p>
          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span className="mono" style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f87171' }}>
              {buf.deficit_probability_pct}%
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              of all half-hour time slots ({buf.deficit_intervals} of {buf.total_intervals})
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
            <strong style={{ fontSize: '0.85rem', color: '#38bdf8' }}>Expensive Peak Hours (16:30 – 19:30 GMT)</strong>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.45' }}>
            Grid penalty rates spike hardest during dinner hours when demand is highest. Forecast conservatively during these hours to protect profit margins.
          </p>
        </div>
      </div>
    </div>
  );
};
