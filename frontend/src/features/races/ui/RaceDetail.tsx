import { Button } from '@/shared/ui';
import type { Race } from '@/shared/types/race';
import type { Kart } from '@/shared/types/kart';
import type { PitlaneConfig } from '@/shared/types/pitlane';

interface RaceDetailProps {
  race: Race;
  karts: Kart[];
  pitlaneConfig: PitlaneConfig | null;
  onAddTeam: () => void;
  onRemoveTeam: (teamId: number) => void;
  onAddKarts: () => void;
  onManageKarts: () => void;
  onConfigurePitlane: () => void;
  onViewPitlane: () => void;
  availableTeamsCount: number;
}

export function RaceDetail({
  race,
  karts,
  pitlaneConfig,
  onAddTeam,
  onRemoveTeam,
  onAddKarts,
  onManageKarts,
  onConfigurePitlane,
  onViewPitlane,
  availableTeamsCount,
}: RaceDetailProps) {
  const raceTeams = race.raceTeams ?? [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Teams Section */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Teams</h2>
          <Button
            label="Add Team"
            icon="pi pi-plus"
            size="small"
            onClick={onAddTeam}
            disabled={availableTeamsCount === 0}
          />
        </div>
        
        {raceTeams.length === 0 ? (
          <p className="text-slate-500">No teams added yet</p>
        ) : (
          <div className="space-y-2">
            {raceTeams.map((entry) => (
              <div
                key={`${entry.raceId}-${entry.teamId}`}
                className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                    {entry.number ?? '?'}
                  </div>
                  <span className="text-white">{entry.team.name}</span>
                </div>
                <Button
                  icon="pi pi-times"
                  rounded
                  text
                  severity="danger"
                  size="small"
                  onClick={() => onRemoveTeam(entry.teamId)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Karts Section */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Karts</h2>
          <Button
            label="Add Karts"
            icon="pi pi-plus"
            size="small"
            onClick={onAddKarts}
          />
        </div>
        
        <div className="text-slate-400 space-y-2">
          <p className="text-3xl font-bold text-white">{karts.length}</p>
          <p>karts available</p>
          <Button
            label="Manage Karts"
            icon="pi pi-external-link"
            text
            className="mt-2"
            onClick={onManageKarts}
          />
        </div>
      </div>

      {/* Pitlane Config Section */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Pitlane Configuration</h2>
          {!pitlaneConfig && (
            <Button
              label="Configure Pitlane"
              icon="pi pi-cog"
              size="small"
              onClick={onConfigurePitlane}
            />
          )}
        </div>
        
        {pitlaneConfig ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <p className="text-slate-400 text-sm mb-1">Lines</p>
              <p className="text-2xl font-bold text-white">{pitlaneConfig.linesCount}</p>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <p className="text-slate-400 text-sm mb-1">Queue Size</p>
              <p className="text-2xl font-bold text-white">{pitlaneConfig.queueSize}</p>
            </div>
            <div className="col-span-2 flex items-center">
              <Button
                label="View Pitlane"
                icon="pi pi-external-link"
                onClick={onViewPitlane}
              />
            </div>
          </div>
        ) : (
          <p className="text-slate-500">Pitlane not configured yet</p>
        )}
      </div>
    </div>
  );
}
