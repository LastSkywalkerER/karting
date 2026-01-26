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
        className="relative bg-slate-900 rounded-xl border border-slate-800 p-5 cursor-pointer hover:border-emerald-500/50 transition-all duration-200 group"
        style={{
          borderColor: statusColor + '40',
          boxShadow: `0 0 20px ${statusColor}15`,
        }}
      >
        <div
          ref={badgeRef}
          onClick={handleBadgeClick}
          className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:scale-110 transition-transform duration-200 z-10"
          style={{
            backgroundColor: statusColor,
            boxShadow: `0 0 16px ${statusColor}cc`,
          }}
        >
          {kart.teamNumber ?? (kart.team?.id ? kart.team.id : '?')}
        </div>
        <div className="space-y-3">
          <div className="text-sm font-semibold text-slate-300">#{kart.id}</div>
          {kart.team ? (
            <div className="flex items-center min-w-0">
              <span className="text-slate-200 text-sm font-medium truncate min-w-0">
                {kart.team.name}
              </span>
            </div>
          ) : (
            <span className="text-slate-500 text-sm">Unassigned</span>
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
