import React from 'react';
import { Wind, Download, Activity, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onExportCSV: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onExportCSV }) => {
  return (
    <header className="header-container" style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: '20px',
      borderBottom: '1px solid var(--border-subtle)',
      marginBottom: '24px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)',
          flexShrink: 0
        }}>
          <Wind size={24} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h1 className="header-title" style={{ fontSize: '1.35rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
              Wind Forecasting & Power Trading Decision Desk
            </h1>
            <span className="badge badge-success">
              <ShieldCheck size={12} /> Live Pilot
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            UK Day-Ahead Wholesale Power Market | National Grid Wind Data Analytics | January 2026
          </p>
        </div>
      </div>

      <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          background: '#f1f5f9',
          borderRadius: '8px',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.8rem',
          color: 'var(--text-muted)'
        }}>
          <Activity size={14} color="#059669" />
          <span>Data Source: <strong>1,488 Records</strong></span>
        </div>

        <button className="btn btn-primary" onClick={onExportCSV} title="Export January 2026 Paired Dataset">
          <Download size={15} />
          <span>Export CSV</span>
        </button>
      </div>
    </header>
  );
};
