import { Button } from '@/shared/ui';
import { KART_STATUS_COLORS } from '@/shared/types/kart';
import type { PitlaneCurrent, PitlaneConfig } from '@/shared/types/pitlane';

interface PitlaneViewProps {
  config: PitlaneConfig;
  currentState: PitlaneCurrent[];
  onAddKart: () => void;
  onRemoveKart: (entry: PitlaneCurrent) => void;
  onLineClick?: (lineNumber: number) => void;
  availableTeamsCount: number;
  teamsCount: number;
}

export function PitlaneView({
  config,
  currentState,
  onAddKart,
  onRemoveKart,
  onLineClick,
  availableTeamsCount,
  teamsCount,
}: PitlaneViewProps) {
  const getStatusColor = (status?: number) =>
    KART_STATUS_COLORS[status ?? 1] || KART_STATUS_COLORS[1];

  // Organize current state by lines
  const lineData: Record<number, PitlaneCurrent[]> = {};
  for (let i = 1; i <= config.linesCount; i++) {
    lineData[i] = currentState
      .filter((entry) => entry.lineNumber === i)
      .sort((a, b) => a.queuePosition - b.queuePosition);
  }

  return (
    <>
      <div className="mb-5">
        <Button
          label="Add Kart to Pitlane"
          icon="pi pi-plus"
          onClick={onAddKart}
          disabled={availableTeamsCount === 0 || teamsCount === 0}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(lineData).map(([lineNumber, entries]) => (
          <div
            key={lineNumber}
            className={`bg-slate-900 rounded-xl border border-slate-800 p-4 ${onLineClick ? 'cursor-pointer' : ''}`}
            onClick={() => onLineClick?.(Number(lineNumber))}
            role={onLineClick ? 'button' : undefined}
            tabIndex={onLineClick ? 0 : undefined}
            onKeyDown={(event) => {
              if (!onLineClick) return;
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onLineClick(Number(lineNumber));
              }
            }}
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-3">
            Line<span className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-bold">
                {lineNumber}
              </span>
            </h3>

            {entries.length === 0 ? (
              <p className="text-slate-500 text-center py-8">Empty</p>
            ) : (
              <div className="space-y-2">
                {entries.map((entry, index) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                    onClick={(event) => {
                      event.stopPropagation();
                      onRemoveKart(entry);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 text-sm w-6">#{index + 1}</span>
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{
                          backgroundColor: getStatusColor(entry.kart?.status),
                          boxShadow: `0 0 16px ${getStatusColor(entry.kart?.status)}cc`,
                        }}
                        title={`Status ${entry.kart?.status ?? 1}`}
                      >
                        {entry.kartId}
                      </div>
                    </div>
                    <Button
                      icon="pi pi-times"
                      rounded
                      text
                      severity="danger"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveKart(entry);
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
