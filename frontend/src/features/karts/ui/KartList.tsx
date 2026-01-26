import type { Kart } from '@/shared/types/kart';
import { KartCard } from './KartCard';

interface KartListProps {
  karts: Kart[];
  loading: boolean;
  onKartClick: (kart: Kart) => void;
  onStatusChange?: (kartId: number, status: number) => void;
}

export function KartList({ karts, loading, onKartClick, onStatusChange }: KartListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <i className="pi pi-spin pi-spinner text-4xl text-emerald-500" />
      </div>
    );
  }

  if (karts.length === 0) {
    return (
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-12 text-center">
        <i className="pi pi-car text-4xl text-slate-600 mb-4" />
        <p className="text-slate-400">No karts found. Add some karts to get started!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
      {karts.map((kart) => (
        <KartCard 
          key={kart.id} 
          kart={kart} 
          onClick={onKartClick}
          onStatusChange={onStatusChange}
        />
      ))}
    </div>
  );
}
