import { Team } from './team';
import { Kart } from './kart';

export interface PitlaneConfig {
  id: number;
  raceId: number;
  linesCount: number;
  queueSize: number;
}

export interface PitlaneCurrent {
  id: number;
  pitlaneConfigId: number;
  teamId: number;
  kartId: number;
  lineNumber: number;
  queuePosition: number;
  enteredAt: string;
  team?: Team;
  kart?: Kart;
}

export interface PitlaneHistory {
  id: number;
  pitlaneConfigId: number;
  teamId: number;
  kartId: number;
  lineNumber: number;
  queuePosition: number;
  enteredAt: string;
  exitedAt: string;
  team?: Team;
  kart?: Kart;
}

export interface CreatePitlaneConfigRequest {
  raceId: number;
  linesCount: number;
  queueSize: number;
}

export interface UpdatePitlaneConfigRequest {
  linesCount?: number;
  queueSize?: number;
}

export interface AddKartToPitlaneRequest {
  pitlaneConfigId: number;
  teamId: number;
  lineNumber: number;
}

export interface RemoveKartFromPitlaneRequest {
  teamId?: number;
}

export interface PitlaneConfigResponse {
  success: boolean;
  data?: PitlaneConfig;
  error?: string;
}

export interface PitlaneCurrentResponse {
  success: boolean;
  count?: number;
  data?: PitlaneCurrent[];
  error?: string;
}

export interface PitlaneHistoryResponse {
  success: boolean;
  count?: number;
  data?: PitlaneHistory[];
  error?: string;
}
