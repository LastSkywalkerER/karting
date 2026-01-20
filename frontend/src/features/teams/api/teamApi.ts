import type {
  CreateTeamRequest,
  UpdateTeamRequest,
  TeamResponse,
  TeamsResponse,
} from '@/shared/types/team';

const API_BASE = '/api/teams';

export async function fetchTeams(): Promise<TeamsResponse> {
  const response = await fetch(API_BASE);
  return response.json();
}

export async function fetchTeamById(id: number): Promise<TeamResponse> {
  const response = await fetch(`${API_BASE}/${id}`);
  return response.json();
}

export async function createTeam(data: CreateTeamRequest): Promise<TeamResponse> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function updateTeam(id: number, data: UpdateTeamRequest): Promise<TeamResponse> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function deleteTeam(id: number): Promise<{ success: boolean; message?: string; error?: string }> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
  });
  return response.json();
}
