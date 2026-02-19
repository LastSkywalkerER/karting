import { useState, useRef } from 'react';
import type { Kart } from '@/shared/types/kart';
import { StatusPicker } from './StatusPicker';

const STATUS_COLORS: Record<number, string> = {
  1: '#22c55e', // green
  2: '#eab308', // yellow
  3: '#f97316', // orange
  4: '#ef4444', // red
  5: '#000000', // black
};

interface KartCardProps {
  kart: Kart;
  onClick: (kart: Kart) => void;
  onStatusChange?: (kartId: number, status: number) => void;
}

export function KartCard({ kart, onClick, onStatusChange }: KartCardProps) {
  const [statusPickerVisible, setStatusPickerVisible] = useState(false);
  const [statusPickerPosition, setStatusPickerPosition] = useState({ x: 0, y: 0 });
  const badgeRef = useRef<HTMLDivElement>(null);
  const statusColor = STATUS_COLORS[kart.status] || STATUS_COLORS[1];

  const handleBadgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (badgeRef.current) {
      const rect = badgeRef.current.getBoundingClientRect();
      setStatusPickerPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
      setStatusPickerVisible(true);
    }
  };

  const handleStatusSelect = (status: number) => {
    if (onStatusChange) {
      onStatusChange(kart.id, status);
    }
  };

  return (
    <>
      <div
        onClick={() => onClick(kart)}
        className="relative bg-slate-900 rounded-lg border border-slate-800 p-2.5 sm:p-3 cursor-pointer hover:border-emerald-500/50 transition-all duration-200 group"
        style={{
          borderColor: statusColor + '40',
          boxShadow: `0 0 12px ${statusColor}15`,
        }}
      >
        <div
          ref={badgeRef}
          onClick={handleBadgeClick}
          className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white text-[10px] sm:text-xs font-bold cursor-pointer hover:scale-110 active:scale-105 transition-transform duration-200 z-10 touch-manipulation"
          style={{
            backgroundColor: statusColor,
            boxShadow: `0 0 10px ${statusColor}cc`,
          }}
        >
          {kart.teamNumber ?? (kart.team?.id ? kart.team.id : '?')}
        </div>
        <div className="space-y-0.5 sm:space-y-1 pr-7 sm:pr-8">
          <div className="text-xs sm:text-sm font-semibold text-slate-300">#{kart.number ?? kart.id}</div>
          {kart.team ? (
            <div className="flex items-center min-w-0">
              <span className="text-slate-200 text-xs sm:text-sm font-medium truncate min-w-0">
                {kart.team.name}
              </span>
            </div>
          ) : (
            <span className="text-slate-500 text-xs sm:text-sm">Unassigned</span>
          )}
        </div>
      </div>
      
      <StatusPicker
        visible={statusPickerVisible}
        position={statusPickerPosition}
        currentStatus={kart.status}
        onSelect={handleStatusSelect}
        onClose={() => setStatusPickerVisible(false)}
      />
    </>
  );
}
