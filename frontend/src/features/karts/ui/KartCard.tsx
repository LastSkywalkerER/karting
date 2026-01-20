import type { Kart } from '@/shared/types/kart';

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
}

export function KartCard({ kart, onClick }: KartCardProps) {
  const statusColor = STATUS_COLORS[kart.status] || STATUS_COLORS[1];

  return (
    <div
      onClick={() => onClick(kart)}
      className="relative bg-slate-900 rounded-xl border border-slate-800 p-5 cursor-pointer hover:border-emerald-500/50 transition-all duration-200 group"
      style={{
        borderColor: statusColor + '40',
        boxShadow: `0 0 20px ${statusColor}15`,
      }}
    >
      <div
        className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
        style={{
          backgroundColor: statusColor,
          boxShadow: `0 0 16px ${statusColor}cc`,
        }}
      >
        {kart.team?.number ?? '?'}
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
  );
}
