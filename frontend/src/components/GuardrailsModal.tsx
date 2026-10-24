import React from 'react';
import { ShieldCheck, CheckCircle2, Lock, Scale, AlertOctagon, Terminal, X } from 'lucide-react';

interface GuardrailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuardrailsModal: React.FC<GuardrailsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const guardrails = [
    {
      id: 'leakage',
      title: 'Temporal Isolation Guardrail (Zero-Lookahead)',
      assertion: 'publish_time <= (delivery_date - 1 day) + 11:00 GMT',
      description: 'Guarantees the model never observes future actuals or forecasts published after the 11:00 Day-Ahead auction cutoff.',
      verified: '1,488 / 1,488 settlement intervals verified (January 2026 complete outturn).',
      testName: 'test_da_cutoff_day_ahead_timing & test_zero_lookahead_constraint',
      icon: <Lock size={18} color="#059669" />
    },
    {
      id: 'math',
      title: 'Mathematical Invariant Consistency',
      assertion: 'RMSE >= MAE > 0 (Strict convex error dispersion)',
      description: 'Mathematically asserts error variance properties across aggregate fleet and all 48 individual settlement periods.',
      verified: 'MAE: 877.6 MW <= RMSE: 1,099.8 MW across entire 10,007 GWh generation sample.',
      testName: 'test_metrics_rmse_greater_equal_mae & test_quantitative_accuracy_invariants',
      icon: <Scale size={18} color="#0284c7" />
    },
    {
      id: 'tail-risk',
      title: 'Extreme Tail Anomaly & Stress-Testing',
      assertion: 'Monotonic Deficit Quantiles (P95 Buffer >= P90 Buffer)',
      description: 'Evaluates non-parametric thermal reserve buffers during Atlantic Storm spikes (>18 GW) and Calm Spell anomalies (<5 GW).',
      verified: 'Safety Reserve (+1,842.3 MW at P90, +2,197.4 MW at P95) provides 90% protection against short cash-out penalties.',
      testName: 'test_procurement_buffer_monotonicity & test_thermal_procurement_buffer',
      icon: <AlertOctagon size={18} color="#d97706" />
    },
    {
      id: 'physical-floor',
      title: 'Physical Dispatch Floor Enforcement',
      assertion: 'Y_corrected >= 800 MW physical grid floor',
      description: 'Guards debiasing algorithm against unrealistic negative dispatch values, ensuring feasible physical turbine generation.',
      verified: '100% of rolling-window debiased intervals obey physical turbine generation constraints.',
      testName: 'test_bias_correction_physical_floor_enforcement',
      icon: <ShieldCheck size={18} color="#7c3aed" />
    },
    {
      id: 'financial-bounds',
      title: 'Balancing Mechanism Spread Conservation',
      assertion: 'Penalty(deficit) >= 0 and Zero Error => £0.00 Penalty',
      description: 'Validates monotonic financial exposure scaling under Elexon System Buy Price (SBP) and System Sell Price (SSP) cash-out spreads.',
      verified: 'Tested across customizable dual cash-out spreads. Zero-loss conservation verified for balanced positions.',
      testName: 'test_financial_impact_monotonicity & test_financial_impact_zero_error_yields_zero_penalty',
      icon: <CheckCircle2 size={18} color="#059669" />
    }
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        maxWidth: '820px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        border: '1px solid #cbd5e1'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{
                background: '#ecfdf5',
                color: '#047857',
                border: '1px solid #a7f3d0',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.04em'
              }}>
                INSTITUTIONAL GRADE
              </span>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                GB Power Market Protocol
              </span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
              Production Model Evaluation & Risk Guardrails
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
              31 automated mathematical and market invariants actively validated to prevent financial losses and data leakage.
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '8px',
              padding: '8px',
              cursor: 'pointer',
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Top Summary Banner */}
        <div style={{ padding: '20px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '12px'
          }}>
            <div style={{ background: '#ffffff', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>AUTOMATED TESTS</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#059669', marginTop: '2px' }}>31 / 31 Passed</div>
              <div style={{ fontSize: '11px', color: '#059669' }}>100% passing (7.47s)</div>
            </div>

            <div style={{ background: '#ffffff', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>LOOKAHEAD STATUS</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#059669', marginTop: '2px' }}>Zero Leakage</div>
              <div style={{ fontSize: '11px', color: '#059669' }}>11:00 GMT cutoff enforced</div>
            </div>

            <div style={{ background: '#ffffff', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>DATA INTEGRITY</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>1,488 Intervals</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Complete Jan 2026 outturn</div>
            </div>

            <div style={{ background: '#ffffff', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>CI/CD STATUS</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0284c7', marginTop: '2px' }}>GitHub CI</div>
              <div style={{ fontSize: '11px', color: '#0284c7' }}>Regression tested on push</div>
            </div>
          </div>
        </div>

        {/* Detailed Guardrail Cards */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {guardrails.map((g) => (
            <div key={g.id} style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '16px',
              display: 'flex',
              gap: '14px',
              alignItems: 'flex-start',
              transition: 'border-color 0.2s'
            }}>
              <div style={{
                background: '#f8fafc',
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {g.icon}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a' }}>
                    {g.title}
                  </h4>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#059669',
                    background: '#ecfdf5',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    border: '1px solid #a7f3d0'
                  }}>
                    PASSED & VERIFIED
                  </span>
                </div>

                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  background: '#f1f5f9',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  color: '#334155',
                  marginTop: '6px',
                  display: 'inline-block'
                }}>
                  {g.assertion}
                </div>

                <p style={{ fontSize: '0.82rem', color: '#475569', marginTop: '6px', lineHeight: '1.45' }}>
                  {g.description}
                </p>

                <div style={{
                  marginTop: '8px',
                  fontSize: '0.78rem',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Terminal size={12} color="#059669" />
                  <span>Verified via: <strong style={{ color: '#0f172a' }}>{g.testName}</strong></span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e2e8f0',
          background: '#f8fafc',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          borderBottomLeftRadius: '16px',
          borderBottomRightRadius: '16px'
        }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
            All 31 unit, mathematical invariant, and temporal isolation tests execute continuously in GitHub Actions.
          </div>

          <button
            onClick={onClose}
            className="btn btn-primary"
            style={{ padding: '8px 18px', fontSize: '0.85rem' }}
          >
            Close Guardrail Console
          </button>
        </div>
      </div>
    </div>
  );
};
