interface CalendarChangeEvent {
  value: Date | null;
}

interface CalendarProps {
  value: Date | null;
  onChange: (event: CalendarChangeEvent) => void;
  className?: string;
  dateFormat?: string;
}

export function Calendar({ value, onChange, className = '' }: CalendarProps) {
  const formattedValue = value ? value.toISOString().split('T')[0] : '';

  return (
    <input
      type="date"
      value={formattedValue}
      onChange={(event) => {
        const nextValue = event.target.value ? new Date(`${event.target.value}T00:00:00`) : null;
        onChange({ value: nextValue });
      }}
      className={`w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${className}`}
    />
  );
}
