import { KART_STATUS_COLORS, KART_STATUS_LABELS } from '../types/kart';

interface StatusBadgeProps {
  status: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function StatusBadge({ status, size = 'md', showLabel = false }: StatusBadgeProps) {
  const color = KART_STATUS_COLORS[status] || KART_STATUS_COLORS[1];
  const label = KART_STATUS_LABELS[status] || 'Unknown';

  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={`${sizeClasses[size]} rounded-full shadow-lg`}
        style={{
          backgroundColor: color,
          boxShadow: `0 0 12px ${color}40`,
        }}
        title={label}
      />
      {showLabel && (
        <span className="text-sm text-slate-300">{label}</span>
      )}
    </div>
  );
}
