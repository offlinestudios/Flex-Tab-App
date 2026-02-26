import { useState } from "react";

interface CalendarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workoutDates: string[];
  selectedDate?: string;
  onDateSelect: (date: string | undefined) => void;
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
}: CalendarModalProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  if (!open) return null;

  // Build set of workout date strings for O(1) lookup
  const workoutSet = new Set(workoutDates);

  const todayStr = today.toLocaleDateString();

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
    const str = d.toLocaleDateString();
    onDateSelect(selectedDate === str ? undefined : str);
    onOpenChange(false);
  };

  // Build grid cells
  const cells: Array<number | null> = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => onOpenChange(false)}
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
            const str = d.toLocaleDateString();
            const isWorkout = workoutSet.has(str);
            const isToday = str === todayStr;
            const isSelected = str === selectedDate;

            let bg = 'transparent';
            let color = 'var(--foreground)';
            let border = 'none';
            let fontWeight = 400;

            if (isWorkout && !isToday) {
              bg = 'var(--foreground)';
              color = 'var(--background)';
              fontWeight = 700;
            } else if (isToday) {
              bg = 'transparent';
              color = '#3b82f6';
              border = '2px solid #3b82f6';
              fontWeight = 700;
            } else if (isSelected) {
              bg = 'var(--foreground)';
              color = 'var(--background)';
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
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateX(-50%) translateY(100%) } to { transform: translateX(-50%) translateY(0) } }
      `}</style>
    </>
  );
}
