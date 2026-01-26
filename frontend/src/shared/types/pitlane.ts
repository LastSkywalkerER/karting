import type { SyncFields } from '../db/database';
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

// With sync fields for IndexedDB
export interface PitlaneConfigWithSync extends PitlaneConfig, SyncFields {}
export interface PitlaneCurrentWithSync extends Omit<PitlaneCurrent, 'team' | 'kart' | 'enteredAt'>, SyncFields {
  enteredAt: number;
}
export interface PitlaneHistoryWithSync extends Omit<PitlaneHistory, 'team' | 'kart' | 'enteredAt' | 'exitedAt'>, SyncFields {
  enteredAt: number;
  exitedAt: number;
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
