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
                  borderColor: gateClosureHour === option.hour ? '#059669' : '#cbd5e1',
                  background: gateClosureHour === option.hour ? '#059669' : '#ffffff',
                  color: gateClosureHour === option.hour ? '#ffffff' : '#334155'
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
                    borderColor: active ? '#0284c7' : '#cbd5e1',
                    background: active ? '#f0f9ff' : '#ffffff',
                    color: active ? '#0284c7' : '#64748b',
                    fontWeight: active ? 600 : 500
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
            background: '#f1f5f9',
            border: '1px solid #e2e8f0',
            color: 'var(--text-muted)',
            marginLeft: '8px'
          }}>
            <span className="mono" style={{ color: '#059669', fontWeight: 600 }}>{totalIntervals}</span> data points loaded
          </div>
        </div>
      </div>
    </div>
  );
};
