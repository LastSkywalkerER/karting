import { useState, useEffect, useRef } from 'react';
import { fetchTeamKartStatuses, updateTeamKartStatuses, fetchLatestResults, fetchPitlaneKartStatuses, updatePitlaneKartStatuses } from '@/shared/api/raceResultsApi';
import type { TeamKartStatus, PitlaneKartStatus, RaceResult } from '@/shared/types/raceResult';
import { Dialog } from 'primereact/dialog';

interface TeamKartStatusPageProps {
  sessionId: string;
}

// Color mapping for kart statuses
const KART_STATUS_COLORS: Record<number, string> = {
  1: '#22c55e', // green
  2: '#eab308', // yellow
  3: '#f97316', // orange
  4: '#ef4444', // red
  5: '#000000', // black
};

export function TeamKartStatusPage({ sessionId }: TeamKartStatusPageProps) {
  const [teamKartStatuses, setTeamKartStatuses] = useState<Map<string, number>>(new Map());
  const [teamLastPitLaps, setTeamLastPitLaps] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openPaletteForTeam, setOpenPaletteForTeam] = useState<string | null>(null);
  
  // Pitlane modal states
  const [pitlaneStatuses, setPitlaneStatuses] = useState<Map<number, number>>(new Map());
  const [pitlaneModalQueue, setPitlaneModalQueue] = useState<Array<{ teamNumber: string; kartStatus: number; lapNumber: number }>>([]);
  const [currentPitlaneModal, setCurrentPitlaneModal] = useState<{ teamNumber: string; kartStatus: number; lapNumber: number } | null>(null);
  // Track processed team+lap combinations to prevent duplicate modals
  const [processedTeamLaps, setProcessedTeamLaps] = useState<Set<string>>(new Set());
  const processedTeamLapsRef = useRef<Set<string>>(new Set());
  const [latestResults, setLatestResults] = useState<RaceResult[]>([]);
  const isProcessingRef = useRef<boolean>(false);
  
  // Keep ref in sync with state
  useEffect(() => {
    processedTeamLapsRef.current = processedTeamLaps;
  }, [processedTeamLaps]);

  // Load team kart statuses
  useEffect(() => {
    const loadStatuses = async () => {
      try {
        const response = await fetchTeamKartStatuses();
        if (response.success) {
          const statusMap = new Map<string, number>();
          const lastPitLapMap = new Map<string, number>();
          response.data.forEach((status: TeamKartStatus) => {
            statusMap.set(status.teamNumber, status.kartStatus);
            if (status.lastPitLap !== undefined) {
              lastPitLapMap.set(status.teamNumber, status.lastPitLap);
            }
          });
          setTeamKartStatuses(statusMap);
          setTeamLastPitLaps(lastPitLapMap);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load team kart statuses:', err);
        setError(err instanceof Error ? err.message : 'Failed to load team kart statuses');
        setLoading(false);
      }
    };

    loadStatuses();
  }, []);

  // Load pitlane kart statuses
  useEffect(() => {
    const loadPitlaneStatuses = async () => {
      try {
        const response = await fetchPitlaneKartStatuses();
        if (response.success) {
          const statusMap = new Map<number, number>();
          response.data.forEach((status: PitlaneKartStatus) => {
            statusMap.set(status.pitlaneNumber, status.kartStatus);
          });
          setPitlaneStatuses(statusMap);
        }
      } catch (err) {
        console.error('Failed to load pitlane kart statuses:', err);
      }
    };

    loadPitlaneStatuses();
  }, []);


  // Periodically fetch latest results
  useEffect(() => {
    if (!sessionId) {
      setError('Session ID is required');
      return;
    }

    const fetchData = async () => {
      try {
        const response = await fetchLatestResults(sessionId);
        if (response.success) {
          setLatestResults(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch latest results:', err);
      }
    };

    // Fetch immediately
    fetchData();

    // Set up polling every second
    const intervalId = setInterval(() => {
      fetchData();
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [sessionId]);

  // Detect "IN PIT" in latest results
  useEffect(() => {
    if (latestResults.length === 0) return;

    const newTeamsInPit: Array<{ teamNumber: string; kartStatus: number; lapNumber: number }> = [];
    const teamsCurrentlyInPit = new Map<string, number>(); // teamNumber -> lapNumber

    latestResults.forEach((result) => {
      if (!result.competitorNumber) return;

      // Check if lastLapTime contains "IN PIT"
      const isInPit = result.lastLapTime && 
        String(result.lastLapTime).trim().toUpperCase() === 'IN PIT';
      
      const currentLap = result.laps;
      
      if (isInPit && currentLap !== null && currentLap !== undefined) {
        teamsCurrentlyInPit.set(result.competitorNumber, currentLap);
        
        // Create unique key: teamNumber:lapNumber
        const teamLapKey = `${result.competitorNumber}:${currentLap}`;
        
        // Skip if this team+lap combination was already processed in this session
        if (processedTeamLapsRef.current.has(teamLapKey)) {
          return;
        }
        
        // Check if current lap matches saved lastPitLap
        // This means the team was already processed for this lap (e.g., after page refresh)
        // Only skip if savedLastPitLap matches currentLap AND team is still in pit on that lap
        const savedLastPitLap = teamLastPitLaps.get(result.competitorNumber);
        const shouldSkipDueToSavedLap = savedLastPitLap !== undefined && savedLastPitLap === currentLap;
        
        if (shouldSkipDueToSavedLap) {
          // Team was already processed for this lap, mark it as processed to avoid showing modal again
          // Use functional update to ensure we have the latest state
          setProcessedTeamLaps((prev) => {
            const key = `${result.competitorNumber}:${currentLap}`;
            if (prev.has(key)) return prev;
            const updated = new Set(prev);
            updated.add(key);
            return updated;
          });
          return;
        }
        
        // Check if team is already in queue or currently showing modal
        const isInQueue = pitlaneModalQueue.some(item => 
          item.teamNumber === result.competitorNumber && item.lapNumber === currentLap
        );
        const isCurrentlyShowing = currentPitlaneModal?.teamNumber === result.competitorNumber && 
                                  currentPitlaneModal?.lapNumber === currentLap;
        
        if (!isInQueue && !isCurrentlyShowing) {
          const kartStatus = teamKartStatuses.get(result.competitorNumber) || 1;
          newTeamsInPit.push({ teamNumber: result.competitorNumber, kartStatus, lapNumber: currentLap });
        }
      }
    });

    // Clean up processedTeamLaps: remove entries for teams that are no longer in pit or have moved to a different lap
    setProcessedTeamLaps((prev) => {
      const updated = new Set(prev);
      let hasChanges = false;
      
      // Remove entries for teams that are not currently in pit or are on a different lap
      prev.forEach((key) => {
        const [teamNumber, lapNumberStr] = key.split(':');
        const lapNumber = parseInt(lapNumberStr, 10);
        const currentLapForTeam = teamsCurrentlyInPit.get(teamNumber);
        
        // If team is not in pit anymore, or is on a different lap, remove the old entry
        if (currentLapForTeam === undefined || currentLapForTeam !== lapNumber) {
          updated.delete(key);
          hasChanges = true;
        }
      });
      
      return hasChanges ? updated : prev;
    });

    // Add new teams to queue if any
    if (newTeamsInPit.length > 0) {
      setPitlaneModalQueue((prevQueue) => {
        // Filter out duplicates by team+lap combination
        const existingKeys = new Set(prevQueue.map(item => `${item.teamNumber}:${item.lapNumber}`));
        const newItems = newTeamsInPit.filter(item => 
          !existingKeys.has(`${item.teamNumber}:${item.lapNumber}`)
        );
        
        if (newItems.length === 0) return prevQueue;
        
        return [...prevQueue, ...newItems];
      });
    }
  }, [latestResults, teamKartStatuses, teamLastPitLaps, pitlaneModalQueue, currentPitlaneModal]);

  // Process queue: show next modal if none is open
  useEffect(() => {
    if (currentPitlaneModal === null && pitlaneModalQueue.length > 0) {
      const nextTeam = pitlaneModalQueue[0];
      setCurrentPitlaneModal(nextTeam);
      setPitlaneModalQueue((prevQueue) => prevQueue.slice(1));
    }
  }, [currentPitlaneModal, pitlaneModalQueue]);

  // Handle pitlane selection
  const handlePitlaneSelection = async (pitlaneNumber: number) => {
    if (!currentPitlaneModal || isProcessingRef.current) return;
    
    // Prevent double processing
    isProcessingRef.current = true;
    
    // Save modal data before closing
    const modalData = {
      teamNumber: currentPitlaneModal.teamNumber,
      kartStatus: currentPitlaneModal.kartStatus,
      lapNumber: currentPitlaneModal.lapNumber
    };
    
    // Mark team+lap combination as processed immediately to prevent re-queuing
    const teamLapKey = `${modalData.teamNumber}:${modalData.lapNumber}`;
    setProcessedTeamLaps((prev) => new Set(prev).add(teamLapKey));
    
    // Close modal immediately
    setCurrentPitlaneModal(null);

    try {
      // Load current pitlane statuses
      const response = await fetchPitlaneKartStatuses();
      if (response.success) {
        // Create a map of existing pitlanes
        const existingPitlanesMap = new Map<number, number>();
        response.data.forEach((status: PitlaneKartStatus) => {
          existingPitlanesMap.set(status.pitlaneNumber, status.kartStatus);
        });

        // Get current status of selected pitlane before swap
        const pitlaneCurrentStatus = existingPitlanesMap.get(pitlaneNumber) || 1;
        
        // Get current status of team (from modalData, which was saved before closing modal)
        const teamCurrentStatus = modalData.kartStatus;

        // Swap: pitlane gets team's status, team gets pitlane's status
        console.log(`Swapping statuses: Team ${modalData.teamNumber} (${teamCurrentStatus}) <-> Pitlane ${pitlaneNumber} (${pitlaneCurrentStatus})`);

        // Create updates array with all existing pitlanes, updating the selected one
        const updates: Array<{ pitlaneNumber: number; kartStatus: number }> = [];
        
        // Add all existing pitlanes (1-4), updating the selected one
        for (let i = 1; i <= 4; i++) {
          if (i === pitlaneNumber) {
            // Update selected pitlane with team's kart status (swap)
            updates.push({
              pitlaneNumber: i,
              kartStatus: teamCurrentStatus // Pitlane gets team's status
            });
          } else {
            // Keep existing status or default to 1 if doesn't exist
            updates.push({
              pitlaneNumber: i,
              kartStatus: existingPitlanesMap.get(i) || 1
            });
          }
        }

        // Send update to API for pitlanes
        await updatePitlaneKartStatuses({ updates });

        // Reload pitlane statuses from API to ensure sync
        const reloadPitlaneResponse = await fetchPitlaneKartStatuses();
        if (reloadPitlaneResponse.success) {
          const reloadedStatusMap = new Map<number, number>();
          reloadPitlaneResponse.data.forEach((status: PitlaneKartStatus) => {
            reloadedStatusMap.set(status.pitlaneNumber, status.kartStatus);
          });
          setPitlaneStatuses(reloadedStatusMap);
        }

        // Save lapNumber as lastPitLap for the team and swap kart status
        await updateTeamKartStatuses({ 
          updates: [{
            teamNumber: modalData.teamNumber,
            kartStatus: pitlaneCurrentStatus, // Team gets pitlane's status
            lastPitLap: modalData.lapNumber
          }]
        });

        // Update local team kart status (swap)
        setTeamKartStatuses((prev) => {
          const updated = new Map(prev);
          updated.set(modalData.teamNumber, pitlaneCurrentStatus);
          return updated;
        });

        // Update local lastPitLap state
        setTeamLastPitLaps((prev) => {
          const updated = new Map(prev);
          updated.set(modalData.teamNumber, modalData.lapNumber);
          return updated;
        });
      }
    } catch (err) {
      console.error('Failed to update pitlane kart statuses:', err);
    } finally {
      isProcessingRef.current = false;
    }
  };

  // Handle status change
  const handleStatusChange = async (teamNumber: string, newStatus: number) => {
    // Update local state immediately
    const updatedStatuses = new Map(teamKartStatuses);
    updatedStatuses.set(teamNumber, newStatus);
    setTeamKartStatuses(updatedStatuses);
    setOpenPaletteForTeam(null);

    // Convert map to array format for API
    const updates = Array.from(updatedStatuses.entries()).map(([teamNumber, kartStatus]) => ({
      teamNumber,
      kartStatus,
    }));

    // Send entire array to backend
    try {
      await updateTeamKartStatuses({ updates });
    } catch (err) {
      console.error('Failed to update team kart statuses:', err);
      // Revert on error
      setTeamKartStatuses(teamKartStatuses);
    }
  };

  // Color Palette Component
  const ColorPalette = ({ teamNumber, onSelect }: { teamNumber: string; onSelect: (status: number) => void }) => {
    return (
      <div
        data-color-palette
        className="absolute bg-white border border-gray-300 rounded-lg shadow-lg p-2 flex gap-1"
        style={{ 
          top: '100%', 
          left: '50%', 
          transform: 'translateX(-50%)', 
          marginTop: '4px',
          zIndex: 100
        }}
        onMouseDown={(e) => {
          // Prevent closing palette when clicking inside it
          e.stopPropagation();
        }}
        onClick={(e) => {
          // Prevent closing palette when clicking inside it
          e.stopPropagation();
        }}
      >
        {[1, 2, 3, 4, 5].map((status) => (
          <button
            key={status}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect(status);
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className={`w-8 h-8 rounded border-2 transition-all hover:scale-110 cursor-pointer ${
              teamKartStatuses.get(teamNumber) === status ? 'border-gray-800 ring-2 ring-gray-400' : 'border-gray-300'
            }`}
            style={{ backgroundColor: KART_STATUS_COLORS[status] }}
            title={`Status ${status}`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="text-red-600 font-semibold">Error: {error}</div>
      </div>
    );
  }

  // Convert map to array for rendering
  const teamStatusesArray = Array.from(teamKartStatuses.entries()).sort((a, b) => {
    // Sort by team number (assuming numeric or string comparison)
    return a[0].localeCompare(b[0], undefined, { numeric: true, sensitivity: 'base' });
  });

  if (teamStatusesArray.length === 0) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="text-gray-600">No team kart statuses found</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col p-4">
      <div className="mb-4 text-sm text-gray-600 shrink-0">
        <span>Team Kart Statuses: {teamStatusesArray.length} teams</span>
      </div>
      
      <div className="flex-1 overflow-auto" style={{ paddingLeft: '30px', paddingRight: '30px' }}>
        <div className="flex flex-wrap gap-4">
          {teamStatusesArray.map(([teamNumber, status]) => {
            const bgColor = KART_STATUS_COLORS[status];
            const textColor = status === 5 ? 'text-white' : status === 1 ? 'text-white' : 'text-gray-900';
            
            return (
              <div key={teamNumber} className="relative" style={{ zIndex: openPaletteForTeam === teamNumber ? 100 : 'auto' }}>
                <div
                  data-team-square
                  className={`w-24 h-24 rounded-lg border-2 border-gray-300 flex items-center justify-center font-bold text-lg cursor-pointer transition-all hover:opacity-80 hover:shadow-lg shadow-md ${textColor}`}
                  style={{ backgroundColor: bgColor }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenPaletteForTeam(openPaletteForTeam === teamNumber ? null : teamNumber);
                  }}
                  title={`Team ${teamNumber} - Status ${status}`}
                >
                  {teamNumber}
                </div>
                {openPaletteForTeam === teamNumber && (
                  <ColorPalette
                    teamNumber={teamNumber}
                    onSelect={(newStatus) => handleStatusChange(teamNumber, newStatus)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Pitlane Selection Modal */}
      <Dialog
        visible={currentPitlaneModal !== null}
        onHide={() => {}} // Prevent closing by clicking outside
        modal
        header={`Выберите питлейн команды ${currentPitlaneModal?.teamNumber}`}
        className="p-dialog-sm"
        pt={{
          root: { className: 'z-50' },
          header: { className: 'bg-blue-600 text-white' },
          headerTitle: { className: 'text-white font-semibold' },
          content: { className: 'p-6' }
        }}
        closable={false}
        draggable={false}
      >
        <div className="flex flex-col gap-4">
          <p className="text-gray-700 mb-2">
            Выберите номер питлейна для команды {currentPitlaneModal?.teamNumber}
          </p>
          <div className="flex gap-3 justify-center">
            {[1, 2, 3, 4].map((pitlaneNumber) => (
              <button
                key={pitlaneNumber}
                onClick={() => handlePitlaneSelection(pitlaneNumber)}
                className="w-16 h-16 bg-blue-600 text-white font-bold text-xl rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-md hover:shadow-lg"
              >
                {pitlaneNumber}
              </button>
            ))}
          </div>
        </div>
      </Dialog>
    </div>
  );
}

