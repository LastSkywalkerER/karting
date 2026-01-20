import { Team } from './team';
import { Race } from './race';

export interface Kart {
  id: number;
  raceId: number;
  status: number;
  teamId: number | null;
  race?: Race;
  team?: Team | null;
}

export interface CreateKartRequest {
  raceId: number;
  status?: number;
  teamId?: number | null;
}

export interface CreateKartsBulkRequest {
  raceId: number;
  count: number;
}

export interface UpdateKartRequest {
  status?: number;
  teamId?: number | null;
}

export interface KartResponse {
  success: boolean;
  data?: Kart;
  error?: string;
}

export interface KartsResponse {
  success: boolean;
  count?: number;
  data?: Kart[];
  error?: string;
}

// Kart status colors mapping
export const KART_STATUS_COLORS: Record<number, string> = {
  1: '#22c55e', // green
  2: '#eab308', // yellow
  3: '#f97316', // orange
  4: '#ef4444', // red
  5: '#000000', // black
};

export const KART_STATUS_LABELS: Record<number, string> = {
  1: 'Good',
  2: 'Warning',
  3: 'Caution',
  4: 'Critical',
  5: 'Out of Service',
};
