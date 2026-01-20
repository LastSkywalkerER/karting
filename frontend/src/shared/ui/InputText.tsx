import type { InputHTMLAttributes } from 'react';

interface InputTextProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export function InputText({ className = '', ...rest }: InputTextProps) {
  return (
    <input
      className={`w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${className}`}
      {...rest}
    />
  );
}
