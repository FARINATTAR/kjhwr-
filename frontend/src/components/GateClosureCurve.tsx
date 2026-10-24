import React, { useState, useEffect } from 'react';
import type { GateClosureSensitivityItem } from '../types';
import { api } from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export const GateClosureCurve: React.FC = () => {
  const [data, setData] = useState<GateClosureSensitivityItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    api.getGateClosureSensitivity('2026-01-01', '2026-01-31')
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
  }, []);

  const chartData = data.map((d) => ({
    name: d.closureHour === 24 ? 'Intraday (1h before)' : `D-1 ${String(d.closureHour).padStart(2, '0')}:00`,
    'Average Error (MW)': d.maeMW,
    'Large Miss Volatility (MW)': d.rmseMW,
    'Cost (£k)': Math.round(d.imbalanceCostGBP / 1000),
    description: d.description
  }));

  const daPoint = data.find(d => d.closureHour === 11);
  const intradayPoint = data.find(d => d.closureHour === 24);
  const maeDelta = daPoint && intradayPoint ? Math.round(daPoint.maeMW - intradayPoint.maeMW) : 0;
  const costDelta = daPoint && intradayPoint ? Math.round((daPoint.imbalanceCostGBP - intradayPoint.imbalanceCostGBP) / 1000) : 0;

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
              Decision Timing: Accuracy Gains Closer to Delivery
            </h3>
            <span style={{
              background: '#ede9fe',
              color: '#5b21b6',
              border: '1px solid #ddd6fe',
              borderRadius: '20px',
              padding: '2px 10px',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.5px'
            }}>
              TIMING ADVANTAGE
            </span>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#64748b', maxWidth: '750px' }}>
            Shows how forecast accuracy improves as delivery gets closer. Locking contracts at 11:00 AM Day-Ahead secures volume,
            but trading intraday provides fresher weather information and cuts penalty risks.
          </p>
        </div>

        {/* Quantified Timing Benefit Badge */}
        {daPoint && intradayPoint && (
          <div style={{
            background: '#faf5ff',
            border: '1px solid #e9d5ff',
            borderRadius: '12px',
            padding: '10px 18px',
            textAlign: 'right'
          }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#7e22ce', fontWeight: 600 }}>
              Intraday Trading Value
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#6b21a8', marginTop: '2px', fontFamily: 'monospace' }}>
              +{maeDelta} MW Accuracy / £{costDelta}k Risk Saved
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              By trading closer to delivery
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      <div style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '16px'
      }}>
        {loading ? (
          <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
            Evaluating market gate closure horizons...
          </div>
        ) : (
          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
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
                <Bar dataKey="Average Error (MW)" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Large Miss Volatility (MW)" fill="#db2777" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
