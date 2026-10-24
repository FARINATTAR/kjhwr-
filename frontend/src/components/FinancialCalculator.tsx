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
              Financial Penalty & Risk Calculator
            </h3>
            <span style={{
              background: '#fffbeb',
              color: '#92400e',
              border: '1px solid #fde68a',
              borderRadius: '20px',
              padding: '2px 10px',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.5px'
            }}>
              ESTIMATED LOSSES
            </span>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#64748b', maxWidth: '750px' }}>
            Translates forecast misses into real money. If wind produces less than expected, you pay high penalty rates for emergency grid power.
            If wind produces more than expected, excess power is sold at a steep discount.
          </p>
        </div>

        {/* Real-time Total Exposure Badge */}
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '12px',
          padding: '12px 20px',
          textAlign: 'right',
          minWidth: '180px'
        }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#dc2626', fontWeight: 600 }}>
            Estimated Imbalance Loss
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#991b1b', marginTop: '2px', fontFamily: 'monospace' }}>
            {loading ? '...' : (data ? formatGBP(data.total_imbalance_cost_gbp) : '£0')}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            Total January 2026 penalty exposure
          </div>
        </div>
      </div>

      {/* Parameter Control Sliders */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '20px'
      }}>
        {/* SBP Slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
            <span style={{ color: '#1e293b', fontWeight: 500 }}>Emergency Power Penalty (SBP)</span>
            <span style={{ color: '#dc2626', fontWeight: 700, fontFamily: 'monospace' }}>£{sbp}/MWh</span>
          </div>
          <input
            type="range"
            min="80"
            max="300"
            step="5"
            value={sbp}
            onChange={(e) => setSbp(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#dc2626', cursor: 'pointer' }}
          />
          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>Rate paid when wind under-produces</div>
        </div>

        {/* Day-Ahead Auction Price */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
            <span style={{ color: '#1e293b', fontWeight: 500 }}>Day-Ahead Wholesale Price</span>
            <span style={{ color: '#0284c7', fontWeight: 700, fontFamily: 'monospace' }}>£{daPrice}/MWh</span>
          </div>
          <input
            type="range"
            min="40"
            max="150"
            step="5"
            value={daPrice}
            onChange={(e) => setDaPrice(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#0284c7', cursor: 'pointer' }}
          />
          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>Standard wholesale auction clearing rate</div>
        </div>

        {/* SSP Slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
            <span style={{ color: '#1e293b', fontWeight: 500 }}>Surplus Power Rate (SSP)</span>
            <span style={{ color: '#d97706', fontWeight: 700, fontFamily: 'monospace' }}>£{ssp}/MWh</span>
          </div>
          <input
            type="range"
            min="0"
            max="80"
            step="5"
            value={ssp}
            onChange={(e) => setSsp(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#d97706', cursor: 'pointer' }}
          />
          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>Discounted rate received when wind over-produces</div>
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
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '10px',
            padding: '14px'
          }}>
            <div style={{ fontSize: '11px', color: '#dc2626', textTransform: 'uppercase', fontWeight: 600 }}>
              Under-Production Penalty
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#991b1b', marginTop: '4px', fontFamily: 'monospace' }}>
              {formatGBP(data.deficit_cost_gbp)}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              {data.deficit_energy_mwh.toLocaleString()} MWh shortfall ({data.deficit_intervals} time slots)
            </div>
          </div>

          {/* Surplus Discount Loss */}
          <div style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '10px',
            padding: '14px'
          }}>
            <div style={{ fontSize: '11px', color: '#b45309', textTransform: 'uppercase', fontWeight: 600 }}>
              Over-Production Discount Loss
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#92400e', marginTop: '4px', fontFamily: 'monospace' }}>
              {formatGBP(data.surplus_cost_gbp)}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              {data.surplus_energy_mwh.toLocaleString()} MWh surplus dumped ({data.surplus_intervals} time slots)
            </div>
          </div>

          {/* Avg Cost Per Settlement Interval */}
          <div style={{
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '10px',
            padding: '14px'
          }}>
            <div style={{ fontSize: '11px', color: '#0369a1', textTransform: 'uppercase', fontWeight: 600 }}>
              Average Cost / Half-Hour
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#075985', marginTop: '4px', fontFamily: 'monospace' }}>
              £{data.avg_cost_per_interval_gbp.toFixed(0)}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              Across {data.total_intervals} half-hour periods
            </div>
          </div>

          {/* Worst Single Period Deficit */}
          <div style={{
            background: '#faf5ff',
            border: '1px solid #e9d5ff',
            borderRadius: '10px',
            padding: '14px'
          }}>
            <div style={{ fontSize: '11px', color: '#7e22ce', textTransform: 'uppercase', fontWeight: 600 }}>
              Worst Single Half-Hour Loss
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#6b21a8', marginTop: '4px', fontFamily: 'monospace' }}>
              {formatGBP(data.worst_single_deficit_gbp)}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              Single biggest shortfall event
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
