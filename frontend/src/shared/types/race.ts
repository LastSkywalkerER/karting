import type { SyncFields } from '../db/database';
import { Team } from './team';

export interface RaceTeam {
  raceId: number;
  teamId: number;
  number: string | null;
  team: Team;
}

export interface Race {
  id: number;
  name: string;
  date: string;
  raceTeams: RaceTeam[];
}

// Race with sync fields for IndexedDB
export interface RaceWithSync extends Omit<Race, 'raceTeams'>, SyncFields {}

// RaceTeam with sync fields for IndexedDB
export interface RaceTeamWithSync extends Omit<RaceTeam, 'team'>, SyncFields {}

export interface CreateRaceRequest {
  name: string;
  date: string;
}

export interface UpdateRaceRequest {
  name?: string;
  date?: string;
}

export interface AddTeamToRaceRequest {
  teamId: number;
  number: string;
}

export interface RaceResponse {
  success: boolean;
  data?: Race;
  error?: string;
}

export interface RacesResponse {
  success: boolean;
  count?: number;
  data?: Race[];
  error?: string;
}
