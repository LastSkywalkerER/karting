import { pitlaneService } from '../services/PitlaneService';
import { syncManager } from '../../sync/services/SyncManager';
import type {
  CreatePitlaneConfigRequest,
  UpdatePitlaneConfigRequest,
  AddKartToPitlaneRequest,
  RemoveKartFromPitlaneRequest,
  PitlaneConfigResponse,
  PitlaneCurrentResponse,
  PitlaneHistoryResponse,
} from '@/shared/types/pitlane';

// Config endpoints
export async function fetchPitlaneConfig(raceId: number): Promise<PitlaneConfigResponse> {
  const result = await pitlaneService.getConfigByRaceId(raceId);
  return {
    success: result.success,
    data: result.data,
    error: result.error,
  };
}

export async function createPitlaneConfig(data: CreatePitlaneConfigRequest): Promise<PitlaneConfigResponse> {
  const result = await pitlaneService.createConfig(data);
  if (result.success) {
    syncManager.triggerSync();
  }
  return {
    success: result.success,
    data: result.data,
    error: result.error,
  };
}

export async function updatePitlaneConfig(id: number, data: UpdatePitlaneConfigRequest): Promise<PitlaneConfigResponse> {
  const result = await pitlaneService.updateConfig(id, data);
  if (result.success) {
    syncManager.triggerSync();
  }
  return {
    success: result.success,
    data: result.data,
    error: result.error,
  };
}

// Current state endpoints
export async function fetchPitlaneCurrent(configId: number, lineNumber?: number): Promise<PitlaneCurrentResponse> {
  const result = lineNumber !== undefined
    ? await pitlaneService.getCurrentByLine(configId, lineNumber)
    : await pitlaneService.getCurrentByConfig(configId);
  return {
    success: result.success,
    count: result.data?.length,
    data: result.data,
    error: result.error,
  };
}

export async function addKartToPitlane(data: AddKartToPitlaneRequest): Promise<{ success: boolean; message?: string; error?: string }> {
  const result = await pitlaneService.addKartToPitlane(
    data.pitlaneConfigId,
    data.teamId,
    data.lineNumber
  );
  if (result.success) {
    syncManager.triggerSync();
  }
  return {
    success: result.success,
    message: result.success ? 'Kart added to pitlane successfully' : undefined,
    error: result.error,
  };
}

export async function removeKartFromPitlane(id: number, data?: RemoveKartFromPitlaneRequest): Promise<{ success: boolean; message?: string; error?: string }> {
  const result = await pitlaneService.removeKartFromPitlane(id, data?.teamId);
  if (result.success) {
    syncManager.triggerSync();
  }
  return {
    success: result.success,
    message: result.success ? 'Kart removed from pitlane successfully' : undefined,
    error: result.error,
  };
}

export async function clearPitlaneLine(configId: number, lineNumber: number): Promise<{ success: boolean; message?: string; error?: string }> {
  const result = await pitlaneService.clearPitlaneLine(configId, lineNumber);
  if (result.success) {
    syncManager.triggerSync();
  }
  return {
    success: result.success,
    message: result.success ? 'Pitlane line cleared successfully' : undefined,
    error: result.error,
  };
}

// History endpoints
export async function fetchPitlaneHistory(configId: number, lineNumber?: number): Promise<PitlaneHistoryResponse> {
  const result = lineNumber !== undefined
    ? await pitlaneService.getHistoryByLine(configId, lineNumber)
    : await pitlaneService.getHistoryByConfig(configId);
  return {
    success: result.success,
    count: result.data?.length,
    data: result.data,
    error: result.error,
  };
}
