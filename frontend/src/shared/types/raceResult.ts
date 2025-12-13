export interface RaceResult {
  id?: number;
  timestamp: string;
  sessionId: string;
  position: number | null;
  competitorNumber: string | null;
  competitorName: string | null;
  laps: number | null;
  lastLapTime: string | null;
  bestLapTime: string | null;
  gap: string | null;
  diff: string | null;
  rawData?: Record<string, unknown>;
}

export interface RaceResultsResponse {
  success: boolean;
  count: number;
  data: RaceResult[];
  error?: string;
}

export interface LapTimesTableResponse {
  success: boolean;
  lapNumbers: number[];
  competitorNumbers: string[];
  data: (string | null)[][];
  error?: string;
}

export interface TeamKartStatus {
  teamNumber: string;
  kartStatus: number;
}

export interface TeamKartStatusResponse {
  success: boolean;
  count: number;
  data: TeamKartStatus[];
  error?: string;
}

export interface UpdateTeamKartStatusRequest {
  updates: Array<{ teamNumber: string; kartStatus: number }>;
}

