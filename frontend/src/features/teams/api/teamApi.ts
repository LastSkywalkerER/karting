import { teamService } from '../services/TeamService';
import { syncManager } from '../../sync/services/SyncManager';
import type {
  CreateTeamRequest,
  UpdateTeamRequest,
  TeamResponse,
  TeamsResponse,
} from '@/shared/types/team';

export async function fetchTeams(): Promise<TeamsResponse> {
  const result = await teamService.getAllTeams();
  return {
    success: result.success,
    count: result.data?.length,
    data: result.data?.map((t) => ({ id: t.id!, name: t.name })),
    error: result.error,
  };
}

export async function fetchTeamById(id: number): Promise<TeamResponse> {
  const result = await teamService.getTeamById(id);
  return {
    success: result.success,
    data: result.data ? { id: result.data.id!, name: result.data.name } : undefined,
    error: result.error,
  };
}

export async function createTeam(data: CreateTeamRequest): Promise<TeamResponse> {
  const result = await teamService.createTeam(data);
  if (result.success) {
    // Trigger sync after successful operation
    syncManager.triggerSync();
  }
  return {
    success: result.success,
    data: result.data ? { id: result.data.id!, name: result.data.name } : undefined,
    error: result.error,
  };
}

export async function updateTeam(id: number, data: UpdateTeamRequest): Promise<TeamResponse> {
  const result = await teamService.updateTeam(id, data);
  if (result.success) {
    syncManager.triggerSync();
  }
  return {
    success: result.success,
    data: result.data ? { id: result.data.id!, name: result.data.name } : undefined,
    error: result.error,
  };
}

export async function deleteTeam(id: number): Promise<{ success: boolean; message?: string; error?: string }> {
  const result = await teamService.deleteTeam(id);
  if (result.success) {
    syncManager.triggerSync();
  }
  return {
    success: result.success,
    message: result.success ? 'Team deleted successfully' : undefined,
    error: result.error,
  };
}
