import { kartRepository } from '../db/KartRepository';
import type { Kart } from '@/shared/types/kart';

export interface KartServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class KartService {
  async createKart(data: {
    raceId: number;
    status?: number;
    teamId?: number | null;
  }): Promise<KartServiceResult<Kart>> {
    try {
      // Validate status if provided
      if (data.status !== undefined && (data.status < 1 || data.status > 5)) {
        return { success: false, error: 'Kart status must be between 1 and 5' };
      }

      const kart = await kartRepository.create(data);
      return { success: true, data: kart };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async createManyKarts(raceId: number, count: number): Promise<KartServiceResult<Kart[]>> {
    try {
      if (count < 1) {
        return { success: false, error: 'Count must be at least 1' };
      }
      if (count > 100) {
        return { success: false, error: 'Cannot create more than 100 karts at once' };
      }

      const karts = await kartRepository.createMany(raceId, count);
      return { success: true, data: karts };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async getKartById(id: number): Promise<KartServiceResult<Kart>> {
    try {
      const kart = await kartRepository.findById(id);
      if (!kart) {
        return { success: false, error: 'Kart not found' };
      }
      return { success: true, data: kart };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async getKartsByRace(raceId: number): Promise<KartServiceResult<Kart[]>> {
    try {
      const karts = await kartRepository.findByRace(raceId);
      return { success: true, data: karts };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async getKartsByTeam(teamId: number): Promise<KartServiceResult<Kart[]>> {
    try {
      const karts = await kartRepository.findByTeam(teamId);
      return { success: true, data: karts };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async updateKart(
    id: number,
    data: { status?: number; teamId?: number | null }
  ): Promise<KartServiceResult<Kart>> {
    try {
      // Validate status if provided
      if (data.status !== undefined && (data.status < 1 || data.status > 5)) {
        return { success: false, error: 'Kart status must be between 1 and 5' };
      }

      const kart = await kartRepository.findById(id);
      if (!kart) {
        return { success: false, error: 'Kart not found' };
      }

      // Handle team assignment - unassign any existing kart from the team
      if (data.teamId !== undefined && data.teamId !== kart.teamId && data.teamId !== null) {
        const existingTeamKarts = await kartRepository.findByTeamAndRace(
          data.teamId,
          kart.raceId
        );
        // Unassign the existing kart from this team (if different kart)
        const existingTeamKart = existingTeamKarts.find((k) => k.id !== kart.id);
        if (existingTeamKart) {
          await kartRepository.assignTeam(existingTeamKart.id, null);
        }
      }

      const updated = await kartRepository.update(id, data);
      if (!updated) {
        return { success: false, error: 'Kart not found' };
      }
      return { success: true, data: updated };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async deleteKart(id: number): Promise<KartServiceResult<void>> {
    try {
      const kart = await kartRepository.findById(id);
      if (!kart) {
        return { success: false, error: 'Kart not found' };
      }

      const deleted = await kartRepository.delete(id);
      if (!deleted) {
        return { success: false, error: 'Failed to delete kart' };
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async assignTeam(kartId: number, teamId: number | null): Promise<KartServiceResult<void>> {
    try {
      const kart = await kartRepository.findById(kartId);
      if (!kart) {
        return { success: false, error: 'Kart not found' };
      }

      const success = await kartRepository.assignTeam(kartId, teamId);
      if (!success) {
        return { success: false, error: 'Failed to assign team' };
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async updateStatus(kartId: number, status: number): Promise<KartServiceResult<void>> {
    try {
      if (status < 1 || status > 5) {
        return { success: false, error: 'Kart status must be between 1 and 5' };
      }

      const kart = await kartRepository.findById(kartId);
      if (!kart) {
        return { success: false, error: 'Kart not found' };
      }

      const success = await kartRepository.updateStatus(kartId, status);
      if (!success) {
        return { success: false, error: 'Failed to update status' };
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}

export const kartService = new KartService();
