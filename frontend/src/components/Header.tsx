import React from 'react';
import { Wind, Download, Activity, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onExportCSV: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onExportCSV }) => {
  return (
    <header style={{
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
          boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)'
        }}>
          <Wind size={24} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
              REint Wind Procurement & Forecast Desk
            </h1>
            <span className="badge badge-success">
              <ShieldCheck size={12} /> Live Pilot
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            UK Day-Ahead Wholesale Power Market | Elexon BMRS FUELHH & WINDFOR Analytics | January 2026
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '8px',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.8rem',
          color: 'var(--text-muted)'
        }}>
          <Activity size={14} color="#10b981" />
          <span>Elexon Sync: <strong>1,488 Intervals</strong></span>
        </div>

        <button className="btn btn-primary" onClick={onExportCSV} title="Export January 2026 Paired Dataset">
          <Download size={15} />
          <span>Export CSV</span>
        </button>
      </div>
    </header>
  );
};
