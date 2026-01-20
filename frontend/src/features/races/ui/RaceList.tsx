import { Button } from '@/shared/ui';
import type { Race } from '@/shared/types/race';

interface RaceListProps {
  races: Race[];
  loading: boolean;
  onRaceClick: (race: Race) => void;
  onDelete: (race: Race, e: React.MouseEvent) => void;
}

export function RaceList({ races, loading, onRaceClick, onDelete }: RaceListProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <i className="pi pi-spin pi-spinner text-4xl text-emerald-500" />
      </div>
    );
  }

  if (races.length === 0) {
    return (
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-12 text-center">
        <i className="pi pi-flag text-4xl text-slate-600 mb-4" />
        <p className="text-slate-400">No races found. Create your first race!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {races.map((race) => (
        <div
          key={race.id}
          onClick={() => onRaceClick(race)}
          className="bg-slate-900 rounded-xl border border-slate-800 p-7 cursor-pointer hover:border-emerald-500/50 transition-all duration-200 group space-y-5"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-lg bg-linear-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
              <i className="pi pi-flag text-xl text-emerald-400" />
            </div>
            <Button
              icon="pi pi-trash"
              rounded
              text
              severity="danger"
              onClick={(e) => onDelete(race, e)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </div>
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white">{race.name}</h3>
            <p className="text-slate-400 text-sm">{formatDate(race.date)}</p>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <i className="pi pi-users" />
              <span>{race.raceTeams?.length || 0} teams</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
