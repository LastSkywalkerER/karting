import { useEffect, useRef, useState } from 'react';
import { KART_STATUS_COLORS, KART_STATUS_LABELS } from '@/shared/types/kart';

interface StatusPickerProps {
  visible: boolean;
  position: { x: number; y: number };
  currentStatus: number;
  onSelect: (status: number) => void;
  onClose: () => void;
}

const PICKER_WIDTH = 48; // 40px button + 8px padding
const PICKER_HEIGHT = 240; // 5 buttons * 40px + 4 gaps * 8px + 16px padding
const OFFSET = 10; // Offset from cursor

export function StatusPicker({ visible, position, currentStatus, onSelect, onClose }: StatusPickerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [calculatedPosition, setCalculatedPosition] = useState({ x: 0, y: 0, transform: '' });

  useEffect(() => {
    if (!visible || !ref.current) return;

    // Calculate smart positioning
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let transformX = `${OFFSET}px`; // Default: right of cursor
    let transformY = `-50%`; // Default: vertically centered

    // Check horizontal positioning
    const spaceRight = viewportWidth - position.x;
    const spaceLeft = position.x;
    const minSpaceNeeded = PICKER_WIDTH + OFFSET;
    
    if (spaceRight < minSpaceNeeded && spaceLeft >= minSpaceNeeded) {
      // Not enough space on right, show on left
      transformX = `calc(-100% - ${OFFSET}px)`;
    } else if (spaceRight >= minSpaceNeeded) {
      // Enough space on right, show on right (default)
      transformX = `${OFFSET}px`;
    } else {
      // Not enough space on either side, center horizontally
      transformX = '-50%';
    }

    // Check vertical positioning
    const spaceBelow = viewportHeight - position.y;
    const spaceAbove = position.y;
    const minVerticalSpace = PICKER_HEIGHT / 2 + OFFSET;
    
    if (spaceBelow < minVerticalSpace && spaceAbove >= minVerticalSpace) {
      // Not enough space below, show above
      transformY = `calc(-100% - ${OFFSET}px)`;
    } else if (spaceBelow >= minVerticalSpace) {
      // Enough space below, center vertically (default)
      transformY = '-50%';
    } else {
      // Not enough space on either side, align to available space
      if (spaceBelow > spaceAbove) {
        transformY = `${OFFSET}px`;
      } else {
        transformY = `calc(-100% - ${OFFSET}px)`;
      }
    }

    setCalculatedPosition({
      x: position.x,
      y: position.y,
      transform: `translate(${transformX}, ${transformY})`,
    });
  }, [visible, position]);

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
        left: `${calculatedPosition.x}px`,
        top: `${calculatedPosition.y}px`,
        transform: calculatedPosition.transform,
      }}
    >
      <div className="flex flex-col gap-2">
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
