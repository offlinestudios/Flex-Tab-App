import { useState } from "react";

interface CalendarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workoutDates: string[];
  selectedDate?: string;
  onDateSelect: (date: string | undefined) => void;
  /** Called when the user wants to log a workout for a past date */
  onLogForDate?: (dateKey: string) => void;
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function CalendarModal({
  open,
  onOpenChange,
  workoutDates,
  selectedDate,
  onDateSelect,
  onLogForDate,
}: CalendarModalProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  // The date the user tapped — drives the action panel
  const [tappedDate, setTappedDate] = useState<string | null>(null);

  if (!open) return null;

  // Normalise any date string to YYYY-MM-DD (locale-independent)
  const toYMD = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  // Incoming workoutDates may be 'M/D/YYYY' (en-US locale) — normalise all to YYYY-MM-DD
  const normaliseDate = (raw: string): string => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    const parsed = new Date(raw);
    if (!isNaN(parsed.getTime())) return toYMD(parsed);
    return raw;
  };

  // Convert YYYY-MM-DD back to M/D/YYYY locale key used by handleLogSet
  const toLocaleKey = (ymd: string): string => {
    const [y, m, d] = ymd.split('-').map(Number);
    return `${m}/${d}/${y}`;
  };

  // Build set of workout date strings for O(1) lookup
  const workoutSet = new Set(workoutDates.map(normaliseDate));

  const todayStr = toYMD(today);

  // First day of month and total days
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const handleDayClick = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    const str = toYMD(d);
    if (str === todayStr) {
      // Today — just close (no action panel needed)
      onDateSelect(undefined);
      onOpenChange(false);
      return;
    }
    // Past date — show action panel
    setTappedDate(str);
  };

  // Human-readable label for the tapped date
  const tappedLabel = tappedDate
    ? (() => {
        const [y, m, d] = tappedDate.split('-').map(Number);
        return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
      })()
    : '';

  const hasWorkout = tappedDate ? workoutSet.has(tappedDate) : false;

  // Build grid cells
  const cells: Array<number | null> = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => { setTappedDate(null); onOpenChange(false); }}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          zIndex: 200, animation: 'fadeIn .2s ease',
        }}
      />
      {/* Bottom sheet */}
      <div
        style={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 500,
          background: 'var(--card)',
          borderRadius: '24px 24px 0 0',
          zIndex: 201,
          padding: '12px 20px 32px',
          animation: 'slideUp .3s cubic-bezier(.4,0,.2,1)',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
        }}
      >
        {/* Drag handle */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: '#d1d5db', margin: '0 auto 20px' }} />

        {/* Month navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <button
            onClick={prevMonth}
            style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--secondary)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--foreground)' }}>
            {MONTHS[viewMonth]} {viewYear}
          </span>
          <button
            onClick={nextMonth}
            style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--secondary)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 8 }}>
          {DAYS.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#9ca3af', padding: '4px 0' }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px 0' }}>
          {cells.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} />;
            const d = new Date(viewYear, viewMonth, day);
            const str = toYMD(d);
            const isWorkout = workoutSet.has(str);
            const isToday = str === todayStr;
            const isSelected = str === selectedDate || str === tappedDate;

            let bg = 'transparent';
            let color = 'var(--foreground)';
            let border = 'none';
            let fontWeight: number = 400;

            if (isSelected && !isToday) {
              bg = '#3b82f6';
              color = '#ffffff';
              fontWeight = 700;
            } else if (isWorkout && !isToday) {
              bg = 'var(--foreground)';
              color = 'var(--background)';
              fontWeight = 700;
            } else if (isToday) {
              bg = 'transparent';
              color = '#3b82f6';
              border = '2px solid #3b82f6';
              fontWeight = 700;
            }

            // Future days are dimmed
            const isFuture = d > today && str !== todayStr;

            return (
              <div
                key={day}
                onClick={() => !isFuture && handleDayClick(day)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  aspectRatio: '1',
                  cursor: isFuture ? 'default' : 'pointer',
                }}
              >
                <div style={{
                  width: 36, height: 36,
                  borderRadius: '50%',
                  background: bg,
                  border,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14,
                  fontWeight,
                  color: isFuture ? '#d1d5db' : color,
                  transition: 'background .15s',
                }}>
                  {day}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--foreground)' }} />
            <span style={{ fontSize: 12, color: '#6b7280' }}>Workout</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--secondary)', border: '1.5px solid #d1d5db' }} />
            <span style={{ fontSize: 12, color: '#6b7280' }}>Rest</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'transparent', border: '2px solid #3b82f6' }} />
            <span style={{ fontSize: 12, color: '#6b7280' }}>Today</span>
          </div>
        </div>

        {/* ── Action panel — appears when a past date is tapped ── */}
        {tappedDate && (
          <div style={{
            marginTop: 20,
            borderTop: '1px solid var(--border)',
            paddingTop: 20,
          }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)', margin: '0 0 12px', textAlign: 'center' }}>
              {tappedLabel}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Log workout for this date */}
              <button
                onClick={() => {
                  if (onLogForDate) onLogForDate(toLocaleKey(tappedDate));
                  setTappedDate(null);
                  onOpenChange(false);
                }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '14px 0', borderRadius: 14, border: 'none',
                  background: 'var(--foreground)', color: 'var(--background)',
                  fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                {hasWorkout ? 'Add More to This Day' : 'Log Workout for This Day'}
              </button>

              {/* View history for this date */}
              {hasWorkout && (
                <button
                  onClick={() => {
                    onDateSelect(tappedDate);
                    setTappedDate(null);
                    onOpenChange(false);
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '14px 0', borderRadius: 14,
                    border: '1.5px solid var(--border)',
                    background: 'var(--secondary)', color: 'var(--foreground)',
                    fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                  View Workout Log
                </button>
              )}

              {/* Cancel */}
              <button
                onClick={() => setTappedDate(null)}
                style={{
                  padding: '10px 0', borderRadius: 14, border: 'none',
                  background: 'transparent', color: '#9ca3af',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateX(-50%) translateY(100%) } to { transform: translateX(-50%) translateY(0) } }
      `}</style>
    </>
  );
}
