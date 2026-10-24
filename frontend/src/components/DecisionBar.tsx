import { Clock, Calendar } from 'lucide-react';

interface DecisionBarProps {
  gateClosureHour: number;
  onGateClosureChange: (hour: number) => void;
  startDate: string;
  endDate: string;
  onDateChange: (start: string, end: string) => void;
  totalIntervals: number;
}

export const DecisionBar: React.FC<DecisionBarProps> = ({
  gateClosureHour,
  onGateClosureChange,
  startDate,
  endDate,
  onDateChange,
  totalIntervals
}) => {
  const presets = [
    { label: 'Full Month (Jan 1-31)', start: '2026-01-01', end: '2026-01-31' },
    { label: 'Atlantic Storm (Jan 4-7)', start: '2026-01-04', end: '2026-01-07' },
    { label: 'Calm Spell (Jan 9-12)', start: '2026-01-09', end: '2026-01-12' },
    { label: 'Mid-Month Gale (Jan 14-17)', start: '2026-01-14', end: '2026-01-17' },
  ];

  return (
    <div className="card" style={{ marginBottom: '24px', padding: '16px 20px' }}>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        {/* Day-Ahead Gate Closure Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <Clock size={16} color="#f59e0b" />
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Forecast Deadline (Day Before):</span>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { hour: 9, label: '09:00 GMT (Morning)' },
              { hour: 11, label: '11:00 GMT (Midday)' },
              { hour: 17, label: '17:00 GMT (Evening)' }
            ].map((option) => (
              <button
                key={option.hour}
                onClick={() => onGateClosureChange(option.hour)}
                className={`btn ${gateClosureHour === option.hour ? 'btn-primary' : ''}`}
                style={{
                  fontSize: '0.8rem',
                  padding: '6px 12px',
                  borderColor: gateClosureHour === option.hour ? '#10b981' : 'var(--border-subtle)',
                  background: gateClosureHour === option.hour ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-surface-elevated)'
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date Presets & Range */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <Calendar size={15} />
            <span>Preset:</span>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {presets.map((p) => {
              const active = startDate === p.start && endDate === p.end;
              return (
                <button
                  key={p.label}
                  onClick={() => onDateChange(p.start, p.end)}
                  className="btn"
                  style={{
                    fontSize: '0.78rem',
                    padding: '5px 10px',
                    borderColor: active ? '#38bdf8' : 'var(--border-subtle)',
                    background: active ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                    color: active ? '#38bdf8' : 'var(--text-muted)'
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          <div style={{
            fontSize: '0.8rem',
            padding: '4px 10px',
            borderRadius: '6px',
            background: 'rgba(255, 255, 255, 0.05)',
            color: 'var(--text-muted)',
            marginLeft: '8px'
          }}>
            <span className="mono" style={{ color: '#10b981', fontWeight: 600 }}>{totalIntervals}</span> data points loaded
          </div>
        </div>
      </div>
    </div>
  );
};
