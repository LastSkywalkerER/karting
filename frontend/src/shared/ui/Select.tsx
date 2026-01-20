interface SelectChangeEvent<TValue> {
  value: TValue | null;
}

interface SelectProps<TOption extends Record<string, unknown>, TValue> {
  value: TValue | null;
  onChange: (event: SelectChangeEvent<TValue>) => void;
  options: TOption[];
  optionLabel: keyof TOption;
  optionValue: keyof TOption;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function Select<TOption extends SelectOption, TValue>({
  value,
  onChange,
  options,
  optionLabel,
  optionValue,
  placeholder,
  className = '',
  disabled = false,
}: SelectProps<TOption, TValue>) {
  const selectedValue = value === null ? '' : String(value);

  return (
    <div className={`relative ${className}`}>
      <select
        value={selectedValue}
        disabled={disabled}
        onChange={(event) => {
          const nextValue = event.target.value;
          if (nextValue === '') {
            onChange({ value: null });
            return;
          }
          const match = options.find(
            (option) => String(option[optionValue]) === nextValue
          );
          onChange({ value: (match?.[optionValue] as TValue) ?? null });
        }}
        className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 pr-10 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:opacity-50"
      >
        {placeholder && (
          <option value="" className="text-slate-500">
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={String(option[optionValue])}
            value={String(option[optionValue])}
          >
            {String(option[optionLabel])}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
        <i className="pi pi-chevron-down" />
      </span>
    </div>
  );
}
