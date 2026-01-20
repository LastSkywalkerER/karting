export interface Team {
  id: number;
  name: string;
  number: string;
}

export interface CreateTeamRequest {
  name: string;
  number: string;
}

export interface UpdateTeamRequest {
  name?: string;
  number?: string;
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
