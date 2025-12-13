import type { RaceResultsResponse, LapTimesTableResponse } from '../types/raceResult';

const API_BASE_URL = '/api';

export async function fetchLatestResults(sessionId: string): Promise<RaceResultsResponse> {
  const response = await fetch(`${API_BASE_URL}/results/latest?sessionId=${encodeURIComponent(sessionId)}`);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}

export async function fetchLapTimesTable(sessionId: string): Promise<LapTimesTableResponse> {
  const response = await fetch(`${API_BASE_URL}/results/lap-times?sessionId=${encodeURIComponent(sessionId)}`);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}

