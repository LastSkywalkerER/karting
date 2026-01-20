import { Team } from './team';

export interface Race {
  id: number;
  name: string;
  date: string;
  teams: Team[];
}

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
