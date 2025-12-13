import { useState, useEffect, useRef } from 'react';
import { fetchLapTimesTable, fetchTeamKartStatuses, updateTeamKartStatuses, fetchPitlaneKartStatuses, updatePitlaneKartStatuses } from '@/shared/api/raceResultsApi';
import type { LapTimesTableResponse, TeamKartStatus, PitlaneKartStatus } from '@/shared/types/raceResult';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';

interface LapTimesPageProps {
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

export function LapTimesPage({ sessionId }: LapTimesPageProps) {
  const [tableData, setTableData] = useState<LapTimesTableResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [teamKartStatuses, setTeamKartStatuses] = useState<Map<string, number>>(new Map());
  const [teamLastPitLaps, setTeamLastPitLaps] = useState<Map<string, number>>(new Map());
  const [openPaletteForTeam, setOpenPaletteForTeam] = useState<string | null>(null);
  const paletteRef = useRef<HTMLDivElement>(null);
  
  // Pitlane modal states
  const [pitlaneStatuses, setPitlaneStatuses] = useState<Map<number, number>>(new Map());
  const [pitlaneModalQueue, setPitlaneModalQueue] = useState<Array<{ teamNumber: string; kartStatus: number; lapNumber: number }>>([]);
  const [currentPitlaneModal, setCurrentPitlaneModal] = useState<{ teamNumber: string; kartStatus: number; lapNumber: number } | null>(null);
  const [processedTeams, setProcessedTeams] = useState<Set<string>>(new Set());
  const isProcessingRef = useRef<boolean>(false);

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
        }
      } catch (err) {
        console.error('Failed to load team kart statuses:', err);
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

  // Handle click outside palette to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (paletteRef.current && !paletteRef.current.contains(event.target as Node)) {
        setOpenPaletteForTeam(null);
      }
    };

    if (openPaletteForTeam) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [openPaletteForTeam]);

  useEffect(() => {
    if (!sessionId) {
      setError('Session ID is required');
      setLoading(false);
      return;
    }

    // Function to fetch data
    const fetchData = async (isInitial = false) => {
      try {
        if (!isInitial) {
          setIsRefreshing(true);
        }
        setError(null);
        const response = await fetchLapTimesTable(sessionId);
        if (response.success) {
          setTableData(response);
        } else {
          setError(response.error || 'Failed to fetch lap times table');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch lap times table');
      } finally {
        if (isInitial) {
          setLoading(false);
        }
        setIsRefreshing(false);
      }
    };

    // Fetch immediately
    fetchData(true);

    // Set up polling every second
    const intervalId = setInterval(() => {
      fetchData(false);
    }, 1000);

    // Cleanup interval on unmount or sessionId change
    return () => {
      clearInterval(intervalId);
    };
  }, [sessionId]);

  // Detect "IN PIT" on last non-empty lap for each team
  useEffect(() => {
    if (!tableData || tableData.data.length === 0) return;

    const newTeamsInPit: Array<{ teamNumber: string; kartStatus: number; lapNumber: number }> = [];

    // Check each competitor
    tableData.competitorNumbers.forEach((competitorNumber) => {
      // Skip if already processed
      if (processedTeams.has(competitorNumber)) return;

      const competitorIndex = tableData.competitorNumbers.indexOf(competitorNumber);
      
      // Find first non-empty lap (last lap chronologically, since lapNumbers is sorted descending)
      for (let lapIndex = 0; lapIndex < tableData.data.length; lapIndex++) {
        const value = tableData.data[lapIndex]?.[competitorIndex];
        
        if (value !== null && value !== undefined && value !== '') {
          // Check if it's "IN PIT"
          const valueStr = String(value).trim().toUpperCase();
          if (valueStr === 'IN PIT') {
            const currentLap = tableData.lapNumbers[lapIndex];
            const savedLastPitLap = teamLastPitLaps.get(competitorNumber);
            
            // Check if current lap matches saved lastPitLap - skip if matches
            if (savedLastPitLap !== undefined && savedLastPitLap === currentLap) {
              // Already processed this pit stop for this lap, skip
              return;
            }
            
            const kartStatus = teamKartStatuses.get(competitorNumber) || 1;
            newTeamsInPit.push({ teamNumber: competitorNumber, kartStatus, lapNumber: currentLap });
          }
          break; // Found first non-empty lap, no need to continue
        }
      }
    });

    // Add new teams to queue if any
    if (newTeamsInPit.length > 0) {
      setPitlaneModalQueue((prevQueue) => {
        // Filter out duplicates
        const existingTeamNumbers = new Set(prevQueue.map(item => item.teamNumber));
        const newItems = newTeamsInPit.filter(item => !existingTeamNumbers.has(item.teamNumber));
        
        if (newItems.length === 0) return prevQueue;
        
        return [...prevQueue, ...newItems];
      });
    }
  }, [tableData, teamKartStatuses, teamLastPitLaps, processedTeams]);

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
    
    // Mark team as processed immediately to prevent re-queuing
    setProcessedTeams((prev) => new Set(prev).add(modalData.teamNumber));
    
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

        // Create updates array with all existing pitlanes, updating the selected one
        const updates: Array<{ pitlaneNumber: number; kartStatus: number }> = [];
        
        // Add all existing pitlanes (1-4), updating the selected one
        for (let i = 1; i <= 4; i++) {
          if (i === pitlaneNumber) {
            // Update selected pitlane with team's kart status
            updates.push({
              pitlaneNumber: i,
              kartStatus: modalData.kartStatus
            });
          } else {
            // Keep existing status or default to 1 if doesn't exist
            updates.push({
              pitlaneNumber: i,
              kartStatus: existingPitlanesMap.get(i) || 1
            });
          }
        }

        // Send update to API
        await updatePitlaneKartStatuses({ updates });

        // Update local state
        const updatedStatuses = new Map(pitlaneStatuses);
        updatedStatuses.set(pitlaneNumber, modalData.kartStatus);
        setPitlaneStatuses(updatedStatuses);

        // Save lapNumber as lastPitLap for the team
        await updateTeamKartStatuses({ 
          updates: [{
            teamNumber: modalData.teamNumber,
            kartStatus: modalData.kartStatus,
            lastPitLap: modalData.lapNumber
          }]
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

  if (!tableData || tableData.data.length === 0) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="text-gray-600">No lap times data found</div>
      </div>
    );
  }

  // Transform data for DataTable
  // Each row represents a lap, columns are competitor numbers
  const tableRows = tableData.lapNumbers.map((lap, lapIndex) => {
    const row: Record<string, string | number | null> = {
      lap: lap
    };
    
    tableData.competitorNumbers.forEach((competitorNumber, competitorIndex) => {
      row[competitorNumber] = tableData.data[lapIndex]?.[competitorIndex] ?? null;
    });
    
    return row;
  });

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
        ref={paletteRef}
        className="absolute z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-2 flex gap-1"
        style={{ top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '4px' }}
      >
        {[1, 2, 3, 4, 5].map((status) => (
          <button
            key={status}
            onClick={() => onSelect(status)}
            className={`w-8 h-8 rounded border-2 transition-all hover:scale-110 ${
              teamKartStatuses.get(teamNumber) === status ? 'border-gray-800 ring-2 ring-gray-400' : 'border-gray-300'
            }`}
            style={{ backgroundColor: KART_STATUS_COLORS[status] }}
            title={`Status ${status}`}
          />
        ))}
      </div>
    );
  };

  // Create dynamic columns for competitors
  const competitorColumns = tableData.competitorNumbers.map((competitorNumber) => {
    const currentStatus = teamKartStatuses.get(competitorNumber) || 1;
    const bgColor = KART_STATUS_COLORS[currentStatus];
    const textColor = currentStatus === 5 ? 'text-white' : currentStatus === 1 ? 'text-white' : 'text-gray-900';

    return (
    <Column
      key={competitorNumber}
      field={competitorNumber}
        header={
          <div className="relative w-full h-full flex items-center justify-center">
            <div
              className={`w-full h-full flex items-center justify-center cursor-pointer transition-all hover:opacity-80 ${textColor}`}
              onClick={(e) => {
                e.stopPropagation();
                setOpenPaletteForTeam(openPaletteForTeam === competitorNumber ? null : competitorNumber);
              }}
            >
              {competitorNumber}
            </div>
            {openPaletteForTeam === competitorNumber && (
              <ColorPalette
                teamNumber={competitorNumber}
                onSelect={(status) => handleStatusChange(competitorNumber, status)}
              />
            )}
          </div>
        }
        pt={{
          headerCell: {
            style: { backgroundColor: bgColor, padding: 0 }
          }
        }}
      style={{ minWidth: '120px', textAlign: 'center' }}
        body={(rowData: Record<string, string | number | null>) => {
        const value = rowData[competitorNumber];
        const valueStr = value ? String(value).trim().toUpperCase() : '';
        const isInPit = valueStr === 'IN PIT';
        
        return value ? (
          <span className={`font-mono text-sm ${isInPit ? 'font-bold text-red-600 bg-red-50 px-2 py-1 rounded' : ''}`}>
            {value as string}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        );
      }}
    />
    );
  });

  return (
    <div className="w-full h-full flex flex-col">
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-600 shrink-0">
        <span>
          Showing lap times matrix: {tableData.lapNumbers.length} laps × {tableData.competitorNumbers.length} competitors
        </span>
        {isRefreshing && (
          <span className="flex items-center gap-1 text-blue-600">
            <span className="animate-spin">⟳</span>
            <span>Updating...</span>
          </span>
        )}
      </div>
      <div className="flex-1 overflow-hidden">
        <DataTable
          value={tableRows}
          className="p-datatable-sm h-full"
          scrollable
          scrollHeight="100%"
          stripedRows
          showGridlines
          size="small"
          pt={{
            root: { className: 'border border-gray-200 rounded-lg shadow-sm h-full flex flex-col' },
            header: { className: 'bg-gray-50 shrink-0' },
            headerCell: { className: 'font-semibold text-gray-700 py-3 px-4' },
            bodyCell: { className: 'py-2 px-4' },
            row: { className: 'hover:bg-gray-50 transition-colors' },
            wrapper: { className: 'flex-1 overflow-auto' }
          } as any}
        >
        <Column
          field="lap"
          header="Lap"
          style={{ minWidth: '80px', fontWeight: 'bold', backgroundColor: '#f9fafb' }}
          frozen
          pt={{
            headerCell: { className: 'bg-gray-100 sticky left-0 z-10' },
            bodyCell: { className: 'bg-gray-50 sticky left-0 z-10 font-semibold' }
          }}
        />
        {competitorColumns}
        </DataTable>
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

