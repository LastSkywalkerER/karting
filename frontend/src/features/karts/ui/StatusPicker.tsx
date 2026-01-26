import { useEffect, useRef } from 'react';
import { KART_STATUS_COLORS, KART_STATUS_LABELS } from '@/shared/types/kart';

interface StatusPickerProps {
  visible: boolean;
  position: { x: number; y: number };
  currentStatus: number;
  onSelect: (status: number) => void;
  onClose: () => void;
}

export function StatusPicker({ visible, position, currentStatus, onSelect, onClose }: StatusPickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [visible, onClose]);

  if (!visible) return null;

  const statuses = [1, 2, 3, 4, 5] as const;

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-2"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, 10px)',
      }}
    >
      <div className="flex gap-2">
        {statuses.map((status) => {
          const color = KART_STATUS_COLORS[status];
          const isSelected = status === currentStatus;
          
          return (
            <button
              key={status}
              onClick={() => {
                onSelect(status);
                onClose();
              }}
              className={`
                w-10 h-10 rounded-full
                transition-all duration-200
                hover:scale-110 hover:shadow-lg
                focus:outline-none focus:ring-2 focus:ring-emerald-500/50
                ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}
              `}
              style={{
                backgroundColor: color,
                boxShadow: `0 0 16px ${color}cc`,
              }}
              title={KART_STATUS_LABELS[status]}
            />
          );
        })}
      </div>
    </div>
  );
}
