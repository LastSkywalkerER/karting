interface InputNumberChangeEvent {
  value: number | null;
}

interface InputNumberProps {
  value: number | null;
  onValueChange: (event: InputNumberChangeEvent) => void;
  min?: number;
  max?: number;
  className?: string;
  placeholder?: string;
}

export function InputNumber({
  value,
  onValueChange,
  min,
  max,
  className = '',
  placeholder,
}: InputNumberProps) {
  return (
    <input
      type="number"
      value={value ?? ''}
      min={min}
      max={max}
      placeholder={placeholder}
      onChange={(event) => {
        const nextValue = event.target.value === '' ? null : Number(event.target.value);
        onValueChange({ value: Number.isNaN(nextValue) ? null : nextValue });
      }}
      className={`w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${className}`}
    />
  );
}
