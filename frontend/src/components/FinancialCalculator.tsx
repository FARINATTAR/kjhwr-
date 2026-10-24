import React, { useState, useEffect } from 'react';
import type { FinancialImpactData } from '../types';
import { api } from '../services/api';

interface Props {
  gateClosureHour: number;
}

export const FinancialCalculator: React.FC<Props> = ({ gateClosureHour }) => {
  const [sbp, setSbp] = useState<number>(120);
  const [ssp, setSsp] = useState<number>(45);
  const [daPrice, setDaPrice] = useState<number>(75);
  const [data, setData] = useState<FinancialImpactData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const timer = setTimeout(() => {
      api.getFinancialImpact('2026-01-01', '2026-01-31', gateClosureHour, sbp, ssp, daPrice)
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
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [gateClosureHour, sbp, ssp, daPrice]);

  const formatGBP = (val: number) => {
    if (val >= 1_000_000) return `£${(val / 1_000_000).toFixed(2)}M`;
    if (val >= 1_000) return `£${(val / 1_000).toFixed(1)}k`;
    return `£${val.toFixed(0)}`;
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(26,34,51,0.95), rgba(15,23,42,0.98))',
      border: '1px solid rgba(245, 158, 11, 0.25)',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      marginTop: '24px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>💷</span>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#f8fafc' }}>
              Financial Impact & Imbalance Exposure Calculator
            </h3>
            <span style={{
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#fbbf24',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '20px',
              padding: '2px 10px',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.5px'
            }}>
              P&L RISK
            </span>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#94a3b8', maxWidth: '750px' }}>
            Translates abstract MW deviations into real UK balancing cash-out penalty exposure (Elexon BSC Section T).
            When over-forecasted, you pay SBP cash-out premium; when under-forecasted, surplus energy is dumped at discount SSP.
          </p>
        </div>

        {/* Real-time Total Exposure Badge */}
        <div style={{
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          padding: '12px 20px',
          textAlign: 'right',
          minWidth: '180px'
        }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#f87171', fontWeight: 600 }}>
            Estimated Imbalance Cost
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#fecaca', marginTop: '2px', fontFamily: 'monospace' }}>
            {loading ? '...' : (data ? formatGBP(data.total_imbalance_cost_gbp) : '£0')}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
            Jan 2026 total portfolio loss
          </div>
        </div>
      </div>

      {/* Parameter Control Sliders */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        background: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '20px'
      }}>
        {/* SBP Slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
            <span style={{ color: '#cbd5e1' }}>System Buy Price (SBP)</span>
            <span style={{ color: '#f87171', fontWeight: 700, fontFamily: 'monospace' }}>£{sbp}/MWh</span>
          </div>
          <input
            type="range"
            min="80"
            max="300"
            step="5"
            value={sbp}
            onChange={(e) => setSbp(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#ef4444', cursor: 'pointer' }}
          />
          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>Cash-out penalty when short (Over-forecast)</div>
        </div>

        {/* Day-Ahead Auction Price */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
            <span style={{ color: '#cbd5e1' }}>Day-Ahead Auction Price</span>
            <span style={{ color: '#38bdf8', fontWeight: 700, fontFamily: 'monospace' }}>£{daPrice}/MWh</span>
          </div>
          <input
            type="range"
            min="40"
            max="150"
            step="5"
            value={daPrice}
            onChange={(e) => setDaPrice(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
          />
          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>Day-ahead reference clearing benchmark</div>
        </div>

        {/* SSP Slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
            <span style={{ color: '#cbd5e1' }}>System Sell Price (SSP)</span>
            <span style={{ color: '#fbbf24', fontWeight: 700, fontFamily: 'monospace' }}>£{ssp}/MWh</span>
          </div>
          <input
            type="range"
            min="0"
            max="80"
            step="5"
            value={ssp}
            onChange={(e) => setSsp(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#fbbf24', cursor: 'pointer' }}
          />
          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>Discounted rate received when long (Under-forecast)</div>
        </div>
      </div>

      {/* Financial Exposure Metric Cards */}
      {data && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px'
        }}>
          {/* Deficit Penalty */}
          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '10px',
            padding: '14px'
          }}>
            <div style={{ fontSize: '11px', color: '#f87171', textTransform: 'uppercase', fontWeight: 600 }}>
              Over-Forecast Penalty
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#fecaca', marginTop: '4px', fontFamily: 'monospace' }}>
              {formatGBP(data.deficit_cost_gbp)}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
              {data.deficit_energy_mwh.toLocaleString()} MWh shortfall ({data.deficit_intervals} intervals)
            </div>
          </div>

          {/* Surplus Discount Loss */}
          <div style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            borderRadius: '10px',
            padding: '14px'
          }}>
            <div style={{ fontSize: '11px', color: '#fbbf24', textTransform: 'uppercase', fontWeight: 600 }}>
              Under-Forecast Discount
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#fef3c7', marginTop: '4px', fontFamily: 'monospace' }}>
              {formatGBP(data.surplus_cost_gbp)}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
              {data.surplus_energy_mwh.toLocaleString()} MWh surplus spill ({data.surplus_intervals} intervals)
            </div>
          </div>

          {/* Avg Cost Per Settlement Interval */}
          <div style={{
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            borderRadius: '10px',
            padding: '14px'
          }}>
            <div style={{ fontSize: '11px', color: '#38bdf8', textTransform: 'uppercase', fontWeight: 600 }}>
              Avg Cost / Interval
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#bae6fd', marginTop: '4px', fontFamily: 'monospace' }}>
              £{data.avg_cost_per_interval_gbp.toFixed(0)}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
              Across {data.total_intervals} half-hour periods
            </div>
          </div>

          {/* Worst Single Period Deficit */}
          <div style={{
            background: 'rgba(168, 85, 247, 0.08)',
            border: '1px solid rgba(168, 85, 247, 0.2)',
            borderRadius: '10px',
            padding: '14px'
          }}>
            <div style={{ fontSize: '11px', color: '#c084fc', textTransform: 'uppercase', fontWeight: 600 }}>
              Worst Peak Loss
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#f3e8ff', marginTop: '4px', fontFamily: 'monospace' }}>
              {formatGBP(data.worst_single_deficit_gbp)}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
              Single half-hour max exposure
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
