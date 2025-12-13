import type { RaceResultsResponse, LapTimesTableResponse, TeamKartStatusResponse, UpdateTeamKartStatusRequest } from '../types/raceResult';

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

export async function fetchTeamKartStatuses(): Promise<TeamKartStatusResponse> {
  const response = await fetch(`${API_BASE_URL}/teams/kart-status`);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}

export async function updateTeamKartStatuses(request: UpdateTeamKartStatusRequest): Promise<{ success: boolean; message?: string; error?: string }> {
  const response = await fetch(`${API_BASE_URL}/teams/kart-status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}

