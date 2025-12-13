import { useState, useEffect } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { RaceResultsPage } from './RaceResultsPage';
import { LapTimesPage } from './LapTimesPage';
import { TeamKartStatusPage } from './TeamKartStatusPage';
import { fetchPitlaneKartStatuses, updatePitlaneKartStatuses } from '@/shared/api/raceResultsApi';
import type { PitlaneKartStatus } from '@/shared/types/raceResult';

// Color mapping for kart statuses
const KART_STATUS_COLORS: Record<number, string> = {
  1: '#22c55e', // green
  2: '#eab308', // yellow
  3: '#f97316', // orange
  4: '#ef4444', // red
  5: '#000000', // black
};

export function MainPage() {
  const [sessionId, setSessionId] = useState('0409BF1AD0B97F05-2147486933-1073748974');
  const [currentSessionId, setCurrentSessionId] = useState(sessionId);
  const [pitlaneStatuses, setPitlaneStatuses] = useState<PitlaneKartStatus[]>([]);
  const [openPaletteForPitlane, setOpenPaletteForPitlane] = useState<number | null>(null);

  // Load pitlane kart statuses
  useEffect(() => {
    const loadPitlaneStatuses = async () => {
      try {
        const response = await fetchPitlaneKartStatuses();
        if (response.success) {
          // Sort by pitlaneNumber ascending
          const sorted = [...response.data].sort((a, b) => a.pitlaneNumber - b.pitlaneNumber);
          setPitlaneStatuses(sorted);
        }
      } catch (err) {
        console.error('Failed to load pitlane kart statuses:', err);
      }
    };

    loadPitlaneStatuses();
  }, []);

  // Close palette when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        openPaletteForPitlane !== null &&
        !target.closest('[data-color-palette]') &&
        !target.closest('[data-pitlane-square]')
      ) {
        setOpenPaletteForPitlane(null);
      }
    };

    if (openPaletteForPitlane !== null) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [openPaletteForPitlane]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentSessionId(sessionId);
  };

  // Handle pitlane status change
  const handlePitlaneStatusChange = async (pitlaneNumber: number, newStatus: number) => {
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
            // Update selected pitlane with new kart status
            updates.push({
              pitlaneNumber: i,
              kartStatus: newStatus
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
        const updatedStatuses = pitlaneStatuses.map(pitlane => 
          pitlane.pitlaneNumber === pitlaneNumber 
            ? { ...pitlane, kartStatus: newStatus }
            : pitlane
        );
        setPitlaneStatuses(updatedStatuses);
        setOpenPaletteForPitlane(null);
      }
    } catch (err) {
      console.error('Failed to update pitlane kart statuses:', err);
    }
  };

  // Color Palette Component
  const ColorPalette = ({ pitlaneNumber, onSelect }: { pitlaneNumber: number; onSelect: (status: number) => void }) => {
    const currentStatus = pitlaneStatuses.find(p => p.pitlaneNumber === pitlaneNumber)?.kartStatus || 1;
    
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
              currentStatus === status ? 'border-gray-800 ring-2 ring-gray-400' : 'border-gray-300'
            }`}
            style={{ backgroundColor: KART_STATUS_COLORS[status] }}
            title={`Status ${status}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <div className="shrink-0 px-4 py-4 bg-white border-b border-gray-200">
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Race Statistics</h1>
          <p className="text-gray-600">View race results and lap times analysis</p>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label htmlFor="sessionId" className="block text-sm font-semibold text-gray-700 mb-2">
                Session ID:
              </label>
              <input
                id="sessionId"
                type="text"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Enter session ID"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors shadow-sm"
            >
              Load Data
            </button>
          </div>
        </form>

        {/* Pitlane status display */}
        <div className="mt-4 flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700">Pitlanes:</span>
          <div className="flex gap-2">
            {pitlaneStatuses.map((pitlane) => {
              const bgColor = KART_STATUS_COLORS[pitlane.kartStatus] || '#gray';
              const textColor = pitlane.kartStatus === 5 ? 'text-white' : pitlane.kartStatus === 1 ? 'text-white' : 'text-gray-900';
              
              return (
                <div 
                  key={pitlane.pitlaneNumber} 
                  className="relative" 
                  style={{ zIndex: openPaletteForPitlane === pitlane.pitlaneNumber ? 100 : 'auto' }}
                >
                  <div
                    data-pitlane-square
                    className={`w-12 h-12 rounded border-2 border-gray-300 flex items-center justify-center font-bold text-white shadow-sm cursor-pointer transition-all hover:opacity-80 hover:shadow-lg ${textColor}`}
                    style={{ backgroundColor: bgColor }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenPaletteForPitlane(openPaletteForPitlane === pitlane.pitlaneNumber ? null : pitlane.pitlaneNumber);
                    }}
                    title={`Pitlane ${pitlane.pitlaneNumber} - Status ${pitlane.kartStatus}`}
                  >
                    {pitlane.pitlaneNumber}
                  </div>
                  {openPaletteForPitlane === pitlane.pitlaneNumber && (
                    <ColorPalette
                      pitlaneNumber={pitlane.pitlaneNumber}
                      onSelect={(newStatus) => handlePitlaneStatusChange(pitlane.pitlaneNumber, newStatus)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white overflow-hidden">
        <TabView className="custom-tabview h-full flex flex-col">
          <TabPanel header="Team Kart Status" leftIcon="pi pi-circle-fill">
            <div className="h-full p-4 flex flex-col">
              <TeamKartStatusPage sessionId={currentSessionId} />
            </div>
          </TabPanel>
          <TabPanel header="Lap Times Matrix" leftIcon="pi pi-table">
            <div className="h-full p-4 flex flex-col">
              <LapTimesPage sessionId={currentSessionId} />
            </div>
          </TabPanel>
          <TabPanel header="Race Results" leftIcon="pi pi-list">
            <div className="h-full p-4 flex flex-col">
              <RaceResultsPage sessionId={currentSessionId} />
            </div>
          </TabPanel>
        </TabView>
      </div>
    </div>
  );
}

