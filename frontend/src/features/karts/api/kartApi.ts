import type {
  CreateKartRequest,
  CreateKartsBulkRequest,
  UpdateKartRequest,
  KartResponse,
  KartsResponse,
} from '@/shared/types/kart';

const API_BASE = '/api/karts';

export async function fetchKartsByRace(raceId: number): Promise<KartsResponse> {
  const response = await fetch(`${API_BASE}?raceId=${raceId}`);
  return response.json();
}

export async function fetchKartById(id: number): Promise<KartResponse> {
  const response = await fetch(`${API_BASE}/${id}`);
  return response.json();
}

export async function createKart(data: CreateKartRequest): Promise<KartResponse> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function createKartsBulk(data: CreateKartsBulkRequest): Promise<KartsResponse> {
  const response = await fetch(`${API_BASE}/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function updateKart(id: number, data: UpdateKartRequest): Promise<KartResponse> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function deleteKart(id: number): Promise<{ success: boolean; message?: string; error?: string }> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
  });
  return response.json();
}
