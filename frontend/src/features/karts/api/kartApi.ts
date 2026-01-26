import { kartService } from '../services/KartService';
import { syncManager } from '../../sync/services/SyncManager';
import type {
  CreateKartRequest,
  CreateKartsBulkRequest,
  UpdateKartRequest,
  KartResponse,
  KartsResponse,
} from '@/shared/types/kart';

export async function fetchKartsByRace(raceId: number): Promise<KartsResponse> {
  const result = await kartService.getKartsByRace(raceId);
  return {
    success: result.success,
    count: result.data?.length,
    data: result.data,
    error: result.error,
  };
}

export async function fetchKartById(id: number): Promise<KartResponse> {
  const result = await kartService.getKartById(id);
  return {
    success: result.success,
    data: result.data,
    error: result.error,
  };
}

export async function createKart(data: CreateKartRequest): Promise<KartResponse> {
  const result = await kartService.createKart(data);
  if (result.success) {
    syncManager.triggerSync();
  }
  return {
    success: result.success,
    data: result.data,
    error: result.error,
  };
}

export async function createKartsBulk(data: CreateKartsBulkRequest): Promise<KartsResponse> {
  const result = await kartService.createManyKarts(data.raceId, data.count);
  if (result.success) {
    syncManager.triggerSync();
  }
  return {
    success: result.success,
    count: result.data?.length,
    data: result.data,
    error: result.error,
  };
}

export async function updateKart(id: number, data: UpdateKartRequest): Promise<KartResponse> {
  const result = await kartService.updateKart(id, data);
  if (result.success) {
    syncManager.triggerSync();
  }
  return {
    success: result.success,
    data: result.data,
    error: result.error,
  };
}

export async function deleteKart(id: number): Promise<{ success: boolean; message?: string; error?: string }> {
  const result = await kartService.deleteKart(id);
  if (result.success) {
    syncManager.triggerSync();
  }
  return {
    success: result.success,
    message: result.success ? 'Kart deleted successfully' : undefined,
    error: result.error,
  };
}
