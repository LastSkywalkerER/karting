import type { SyncFields } from '../db/database';

export interface Team {
  id: number;
  name: string;
}

// Team with sync fields for IndexedDB
export interface TeamWithSync extends Team, SyncFields {}

export interface CreateTeamRequest {
  name: string;
}

export interface UpdateTeamRequest {
  name?: string;
}

export interface TeamResponse {
  success: boolean;
  data?: Team;
  error?: string;
}

export interface TeamsResponse {
  success: boolean;
  count?: number;
  data?: Team[];
  error?: string;
}
