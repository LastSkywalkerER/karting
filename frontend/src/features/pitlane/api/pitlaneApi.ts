import type {
  CreatePitlaneConfigRequest,
  UpdatePitlaneConfigRequest,
  AddKartToPitlaneRequest,
  RemoveKartFromPitlaneRequest,
  PitlaneConfigResponse,
  PitlaneCurrentResponse,
  PitlaneHistoryResponse,
} from '@/shared/types/pitlane';

const API_BASE = '/api/pitlanes';

// Config endpoints
export async function fetchPitlaneConfig(raceId: number): Promise<PitlaneConfigResponse> {
  const response = await fetch(`${API_BASE}/configs?raceId=${raceId}`);
  return response.json();
}

export async function createPitlaneConfig(data: CreatePitlaneConfigRequest): Promise<PitlaneConfigResponse> {
  const response = await fetch(`${API_BASE}/configs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function updatePitlaneConfig(id: number, data: UpdatePitlaneConfigRequest): Promise<PitlaneConfigResponse> {
  const response = await fetch(`${API_BASE}/configs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

// Current state endpoints
export async function fetchPitlaneCurrent(configId: number, lineNumber?: number): Promise<PitlaneCurrentResponse> {
  let url = `${API_BASE}/current?configId=${configId}`;
  if (lineNumber !== undefined) {
    url += `&lineNumber=${lineNumber}`;
  }
  const response = await fetch(url);
  return response.json();
}

export async function addKartToPitlane(data: AddKartToPitlaneRequest): Promise<{ success: boolean; message?: string; error?: string }> {
  const response = await fetch(`${API_BASE}/current/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function removeKartFromPitlane(id: number, data?: RemoveKartFromPitlaneRequest): Promise<{ success: boolean; message?: string; error?: string }> {
  const response = await fetch(`${API_BASE}/current/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: data ? JSON.stringify(data) : undefined,
  });
  return response.json();
}

export async function clearPitlaneLine(configId: number, lineNumber: number): Promise<{ success: boolean; message?: string; error?: string }> {
  const response = await fetch(`${API_BASE}/current/line?configId=${configId}&lineNumber=${lineNumber}`, {
    method: 'DELETE',
  });
  return response.json();
}

// History endpoints
export async function fetchPitlaneHistory(configId: number, lineNumber?: number): Promise<PitlaneHistoryResponse> {
  let url = `${API_BASE}/history?configId=${configId}`;
  if (lineNumber !== undefined) {
    url += `&lineNumber=${lineNumber}`;
  }
  const response = await fetch(url);
  return response.json();
}
