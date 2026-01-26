import { raceService } from '../services/RaceService';
import { syncManager } from '../../sync/services/SyncManager';
import type {
  CreateRaceRequest,
  UpdateRaceRequest,
  RaceResponse,
  RacesResponse,
} from '@/shared/types/race';

export async function fetchRaces(): Promise<RacesResponse> {
  const result = await raceService.getAllRaces();
  return {
    success: result.success,
    count: result.data?.length,
    data: result.data,
    error: result.error,
  };
}

export async function fetchRaceById(id: number): Promise<RaceResponse> {
  const result = await raceService.getRaceById(id);
  return {
    success: result.success,
    data: result.data,
    error: result.error,
  };
}

export async function createRace(data: CreateRaceRequest): Promise<RaceResponse> {
  const result = await raceService.createRace(data);
  if (result.success) {
    syncManager.triggerSync();
  }
  return {
    success: result.success,
    data: result.data,
    error: result.error,
  };
}

export async function updateRace(id: number, data: UpdateRaceRequest): Promise<RaceResponse> {
  const result = await raceService.updateRace(id, data);
  if (result.success) {
    syncManager.triggerSync();
  }
  return {
    success: result.success,
    data: result.data,
    error: result.error,
  };
}

export async function deleteRace(id: number): Promise<{ success: boolean; message?: string; error?: string }> {
  const result = await raceService.deleteRace(id);
  if (result.success) {
    syncManager.triggerSync();
  }
  return {
    success: result.success,
    message: result.success ? 'Race deleted successfully' : undefined,
    error: result.error,
  };
}

export async function addTeamToRace(
  raceId: number,
  teamId: number,
  number: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const result = await raceService.addTeamToRace(raceId, teamId, number);
  if (result.success) {
    syncManager.triggerSync();
  }
  return {
    success: result.success,
    message: result.success ? 'Team added to race successfully' : undefined,
    error: result.error,
  };
}

export async function removeTeamFromRace(raceId: number, teamId: number): Promise<{ success: boolean; message?: string; error?: string }> {
  const result = await raceService.removeTeamFromRace(raceId, teamId);
  if (result.success) {
    syncManager.triggerSync();
  }
  return {
    success: result.success,
    message: result.success ? 'Team removed from race successfully' : undefined,
    error: result.error,
  };
}
