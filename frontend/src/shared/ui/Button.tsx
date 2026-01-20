import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonSeverity = 'primary' | 'secondary' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  icon?: string;
  severity?: ButtonSeverity;
  text?: boolean;
  rounded?: boolean;
  size?: 'small' | 'normal';
  className?: string;
  children?: ReactNode;
}

const baseClasses =
  'inline-flex items-center justify-center gap-2 font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed';

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  small: 'text-xs px-2.5 py-1.5',
  normal: 'text-sm px-4 py-2',
};

const severityClasses: Record<ButtonSeverity, string> = {
  primary: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-400 hover:to-teal-500',
  secondary: 'bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700',
  danger: 'bg-red-600 text-white hover:bg-red-500',
};

const textSeverityClasses: Record<ButtonSeverity, string> = {
  primary: 'bg-transparent text-emerald-400 hover:bg-emerald-500/10',
  secondary: 'bg-transparent text-slate-300 hover:bg-slate-800',
  danger: 'bg-transparent text-red-400 hover:bg-red-500/10',
};

export function Button({
  label,
  icon,
  severity = 'primary',
  text = false,
  rounded = false,
  size = 'normal',
  className = '',
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const isIconOnly = Boolean(icon && !label && !children);
  const roundedClass = rounded ? 'rounded-full' : 'rounded-lg';
  const sizeClass = isIconOnly
    ? 'text-sm w-9 h-9'
    : sizeClasses[size];
  const variantClass = text ? textSeverityClasses[severity] : severityClasses[severity];

  return (
    <button
      type={type}
      className={`${baseClasses} ${roundedClass} ${sizeClass} ${variantClass} ${className}`}
      {...rest}
    >
      {icon && <i className={icon} />}
      {label || children}
    </button>
  );
}
