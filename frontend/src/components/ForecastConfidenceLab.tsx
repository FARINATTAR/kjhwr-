import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { ForecastConfidenceData } from '../types';


interface Props {
  gateClosureHour: number;
}

export const ForecastConfidenceLab: React.FC<Props> = ({ gateClosureHour }) => {
  const [data, setData] = useState<ForecastConfidenceData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterTier, setFilterTier] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');
  const [selectedDay, setSelectedDay] = useState<string>('2026-01-01');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api.getForecastConfidence('2026-01-01', '2026-01-07', gateClosureHour)
      .then((res) => {
        if (!isMounted) return;
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Forecast confidence fetch error:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [gateClosureHour]);

  if (loading) {
    return (
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '36px',
        textAlign: 'center',
        color: '#64748b'
      }}>
        Calculating Machine Learning confidence scores...
      </div>
    );
  }

  if (!data) return null;

  const scoreColor =
    data.average_confidence_pct >= 80 ? '#059669' :
    data.average_confidence_pct >= 60 ? '#d97706' : '#dc2626';

  const scoreBg =
    data.average_confidence_pct >= 80 ? '#ecfdf5' :
    data.average_confidence_pct >= 60 ? '#fffbeb' : '#fef2f2';

  const scoreBorder =
    data.average_confidence_pct >= 80 ? '#a7f3d0' :
    data.average_confidence_pct >= 60 ? '#fde68a' : '#fecaca';

  // Filter intervals for the inspector
  const filteredIntervals = data.data.filter((item) => {
    const matchesDay = !selectedDay || item.settlementDate === selectedDay;
    const matchesTier = filterTier === 'All' || item.confidenceTier === filterTier;
    return matchesDay && matchesTier;
  });

  // Unique dates in the dataset
  const availableDates = Array.from(new Set(data.data.map(d => d.settlementDate))).sort();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner & Model Specs */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '24px 28px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div style={{ maxWidth: '650px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{
              background: '#eff6ff',
              color: '#2563eb',
              border: '1px solid #bfdbfe',
              padding: '3px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Smart Reliability Check
            </span>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Automated Accuracy Analysis
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
            Wind Prediction Trust Score
          </h2>
          <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
            Shows how dependable tomorrow's wind estimate is for each time slot, helping you plan power trades with confidence.
          </p>
        </div>

        {/* Big Radial/Card Score Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '18px',
          background: scoreBg,
          border: `1.5px solid ${scoreBorder}`,
          padding: '16px 24px',
          borderRadius: '14px'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
              Average Trust Score
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: scoreColor, lineHeight: 1.1 }}>
              {data.average_confidence_pct}%
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: scoreColor, marginTop: '2px' }}>
              {data.overall_tier} Dependability
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Strip & Recommendation */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px'
      }}>
        {/* Tier Distribution Cards */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '14px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '12px' }}>
            Score Summary ({data.total_intervals} Slots)
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{
              flex: 1,
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              padding: '10px',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#059669' }}>
                {data.high_confidence_count}
              </div>
              <div style={{ fontSize: '11px', color: '#047857', fontWeight: 600 }}>High Trust (≥80%)</div>
            </div>

            <div style={{
              flex: 1,
              background: '#fffbeb',
              border: '1px solid #fde68a',
              padding: '10px',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#d97706' }}>
                {data.medium_confidence_count}
              </div>
              <div style={{ fontSize: '11px', color: '#b45309', fontWeight: 600 }}>Medium (60-79%)</div>
            </div>

            <div style={{
              flex: 1,
              background: '#fef2f2',
              border: '1px solid #fecaca',
              padding: '10px',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#dc2626' }}>
                {data.low_confidence_count}
              </div>
              <div style={{ fontSize: '11px', color: '#991b1b', fontWeight: 600 }}>Low (&lt;60%)</div>
            </div>
          </div>
        </div>

        {/* Feature Importance Drivers */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '14px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '10px' }}>
            What Influences This Score
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.entries(data.feature_importances).map(([feature, pct]) => (
              <div key={feature}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#334155', marginBottom: '2px' }}>
                  <span>{feature}</span>
                  <span style={{ fontWeight: 600 }}>{pct}%</span>
                </div>
                <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: '#3b82f6',
                    borderRadius: '3px'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actionable Strategy Recommendation */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '14px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>
              Buying Guidance
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#0f172a', lineHeight: 1.5 }}>
              {data.summary_recommendation}
            </p>
          </div>
          <div style={{
            marginTop: '12px',
            padding: '8px 12px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '11px',
            color: '#64748b'
          }}>
            Planning window: <strong>{(24 - gateClosureHour) + 13}h to {(24 - gateClosureHour) + 36.5}h</strong> ahead of time.
          </div>
        </div>
      </div>

      {/* Interval by Interval Inspector Table */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '18px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
              30-Minute Schedule & Reliability Scores
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
              Detailed time slots showing predicted wind, expected variation range, and trustworthiness rating.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* Day Selector */}
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '12px',
                background: '#ffffff',
                color: '#0f172a',
                cursor: 'pointer'
              }}
            >
              {availableDates.map((dt) => (
                <option key={dt} value={dt}>Delivery Date: {dt}</option>
              ))}
            </select>

            {/* Tier Filter */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {(['All', 'High', 'Medium', 'Low'] as const).map((tier) => (
                <button
                  key={tier}
                  onClick={() => setFilterTier(tier)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: filterTier === tier ? '1px solid #2563eb' : '1px solid #e2e8f0',
                    background: filterTier === tier ? '#eff6ff' : '#ffffff',
                    color: filterTier === tier ? '#2563eb' : '#64748b',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '10px 14px', color: '#475569', fontWeight: 600 }}>Slot</th>
                <th style={{ padding: '10px 14px', color: '#475569', fontWeight: 600 }}>Time Window</th>
                <th style={{ padding: '10px 14px', color: '#475569', fontWeight: 600 }}>Predicted Wind</th>
                <th style={{ padding: '10px 14px', color: '#475569', fontWeight: 600 }}>Actual Wind Output</th>
                <th style={{ padding: '10px 14px', color: '#475569', fontWeight: 600 }}>Possible Variation (±MW)</th>
                <th style={{ padding: '10px 14px', color: '#475569', fontWeight: 600 }}>Trust Score</th>
                <th style={{ padding: '10px 14px', color: '#475569', fontWeight: 600 }}>Reliability Level</th>
              </tr>
            </thead>
            <tbody>
              {filteredIntervals.slice(0, 48).map((item) => {
                const sp = item.settlementPeriod;
                const startHour = Math.floor((sp - 1) / 2);
                const startMin = (sp % 2 === 0) ? '30' : '00';
                const endHour = Math.floor(sp / 2);
                const endMin = (sp % 2 === 0) ? '00' : '30';
                const timeSlot = `${String(startHour).padStart(2, '0')}:${startMin} - ${String(endHour).padStart(2, '0')}:${endMin}`;

                const badgeColor =
                  item.confidenceTier === 'High' ? '#059669' :
                  item.confidenceTier === 'Medium' ? '#d97706' : '#dc2626';

                const badgeBg =
                  item.confidenceTier === 'High' ? '#ecfdf5' :
                  item.confidenceTier === 'Medium' ? '#fffbeb' : '#fef2f2';

                return (
                  <tr key={item.startTime} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0f172a' }}>
                      Slot {sp}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#64748b' }}>
                      {timeSlot}
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0f172a' }}>
                      {item.dayAheadForecastMW.toLocaleString()} MW
                    </td>
                    <td style={{ padding: '10px 14px', color: '#334155' }}>
                      {item.actualMW.toLocaleString()} MW
                    </td>
                    <td style={{ padding: '10px 14px', color: '#64748b' }}>
                      ±{item.expectedUncertaintyMW} MW
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: badgeColor }}>
                      {item.confidenceScore}%
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: badgeBg,
                        color: badgeColor
                      }}>
                        {item.confidenceTier}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

