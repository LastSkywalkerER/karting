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
      <div className="mb-2 sm:mb-3">
        <Button
          label="Add Kart to Pitlane"
          icon="pi pi-plus"
          onClick={onAddKart}
          disabled={availableTeamsCount === 0 || teamsCount === 0}
          className="min-h-[40px]"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2">
        {Object.entries(lineData).map(([lineNumber, entries]) => (
          <div
            key={lineNumber}
            className={`bg-slate-900 rounded-lg border border-slate-800 p-2 sm:p-3 ${onLineClick ? 'cursor-pointer' : ''}`}
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
            <div className="text-xs text-slate-400 mb-1.5 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                {lineNumber}
              </span>
              Line
            </div>

            {entries.length === 0 ? (
              <p className="text-slate-500 text-center py-3 text-xs">Empty</p>
            ) : (
              <div className="space-y-1">
                {entries.map((entry, index) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-1.5 sm:p-2 bg-slate-800/50 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
                    onClick={(event) => {
                      event.stopPropagation();
                      onRemoveKart(entry);
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-slate-500 text-xs w-4 shrink-0">#{index + 1}</span>
                      <div
                        className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{
                          backgroundColor: getStatusColor(entry.kart?.status),
                          boxShadow: `0 0 8px ${getStatusColor(entry.kart?.status)}cc`,
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
                      className="p-1.5! min-w-0! shrink-0"
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
