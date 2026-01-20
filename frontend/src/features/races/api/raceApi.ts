import type {
  CreateRaceRequest,
  UpdateRaceRequest,
  RaceResponse,
  RacesResponse,
} from '@/shared/types/race';

const API_BASE = '/api/races';

export async function fetchRaces(): Promise<RacesResponse> {
  const response = await fetch(API_BASE);
  return response.json();
}

export async function fetchRaceById(id: number): Promise<RaceResponse> {
  const response = await fetch(`${API_BASE}/${id}`);
  return response.json();
}

export async function createRace(data: CreateRaceRequest): Promise<RaceResponse> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function updateRace(id: number, data: UpdateRaceRequest): Promise<RaceResponse> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function deleteRace(id: number): Promise<{ success: boolean; message?: string; error?: string }> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
  });
  return response.json();
}

export async function addTeamToRace(raceId: number, teamId: number): Promise<{ success: boolean; message?: string; error?: string }> {
  const response = await fetch(`${API_BASE}/${raceId}/teams`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamId }),
  });
  return response.json();
}

export async function removeTeamFromRace(raceId: number, teamId: number): Promise<{ success: boolean; message?: string; error?: string }> {
  const response = await fetch(`${API_BASE}/${raceId}/teams/${teamId}`, {
    method: 'DELETE',
  });
  return response.json();
}
