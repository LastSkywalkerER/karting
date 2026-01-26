import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { appStateRepository } from '../db/AppStateRepository';

interface CurrentRaceContextValue {
  currentRaceId: number | null;
  setCurrentRaceId: (raceId: number | null) => Promise<void>;
  isLoading: boolean;
}

const CurrentRaceContext = createContext<CurrentRaceContextValue | null>(null);

export function CurrentRaceProvider({ children }: { children: ReactNode }) {
  const [currentRaceId, setCurrentRaceIdState] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load current race from IndexedDB on mount
  useEffect(() => {
    const loadCurrentRace = async () => {
      try {
        const raceId = await appStateRepository.getCurrentRaceId();
        setCurrentRaceIdState(raceId);
        console.log('[CurrentRaceContext] Loaded current race from storage:', raceId);
      } catch (error) {
        console.error('[CurrentRaceContext] Failed to load current race:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCurrentRace();
  }, []);

  const setCurrentRaceId = useCallback(async (raceId: number | null) => {
    try {
      await appStateRepository.setCurrentRaceId(raceId);
      setCurrentRaceIdState(raceId);
      console.log('[CurrentRaceContext] Saved current race to storage:', raceId);
    } catch (error) {
      console.error('[CurrentRaceContext] Failed to save current race:', error);
    }
  }, []);

  return (
    <CurrentRaceContext.Provider value={{ currentRaceId, setCurrentRaceId, isLoading }}>
      {children}
    </CurrentRaceContext.Provider>
  );
}

export function useCurrentRace(): CurrentRaceContextValue {
  const context = useContext(CurrentRaceContext);
  if (!context) {
    throw new Error('useCurrentRace must be used within a CurrentRaceProvider');
  }
  return context;
}
