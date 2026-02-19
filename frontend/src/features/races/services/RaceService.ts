import { raceRepository } from '../db/RaceRepository';
import { isValidSpeedhiveUrl } from '@/shared/utils/speedhiveUrl';
import type { Race, RaceTeam } from '@/shared/types/race';

export interface RaceServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class RaceService {
  async createRace(data: {
    name: string;
    date: string;
    speedhiveUrl?: string | null;
  }): Promise<RaceServiceResult<Race>> {
    try {
      if (!data.name || data.name.trim() === '') {
        return { success: false, error: 'Race name is required' };
      }
      if (!data.date) {
        return { success: false, error: 'Race date is required' };
      }
      if (data.speedhiveUrl !== undefined && data.speedhiveUrl !== null && data.speedhiveUrl !== '') {
        if (!isValidSpeedhiveUrl(data.speedhiveUrl)) {
          return {
            success: false,
            error:
              'Invalid SpeedHive URL. Example: https://speedhive.mylaps.com/livetiming/.../sessions/...',
          };
        }
      }

      const race = await raceRepository.create({
        name: data.name.trim(),
        date: data.date,
        speedhiveUrl: data.speedhiveUrl,
      });
      return { success: true, data: race };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async getRaceById(id: number): Promise<RaceServiceResult<Race>> {
    try {
      const race = await raceRepository.findById(id);
      if (!race) {
        return { success: false, error: 'Race not found' };
      }
      return { success: true, data: race };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async getAllRaces(): Promise<RaceServiceResult<Race[]>> {
    try {
      const races = await raceRepository.findAll();
      return { success: true, data: races };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async updateRace(
    id: number,
    data: { name?: string; date?: string; speedhiveUrl?: string | null }
  ): Promise<RaceServiceResult<Race>> {
    try {
      const updateData: { name?: string; date?: string; speedhiveUrl?: string | null } = {};

      if (data.name !== undefined) {
        if (data.name.trim() === '') {
          return { success: false, error: 'Race name cannot be empty' };
        }
        updateData.name = data.name.trim();
      }

      if (data.date !== undefined) {
        updateData.date = data.date;
      }

      if (data.speedhiveUrl !== undefined) {
        if (data.speedhiveUrl && !isValidSpeedhiveUrl(data.speedhiveUrl)) {
          return {
            success: false,
            error:
              'Invalid SpeedHive URL. Example: https://speedhive.mylaps.com/livetiming/.../sessions/...',
          };
        }
        updateData.speedhiveUrl = data.speedhiveUrl;
      }

      const race = await raceRepository.update(id, updateData);
      if (!race) {
        return { success: false, error: 'Race not found' };
      }
      return { success: true, data: race };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async deleteRace(id: number): Promise<RaceServiceResult<void>> {
    try {
      const deleted = await raceRepository.delete(id);
      if (!deleted) {
        return { success: false, error: 'Race not found' };
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async addTeamToRace(
    raceId: number,
    teamId: number,
    number: string
  ): Promise<RaceServiceResult<void>> {
    try {
      if (!number || number.trim() === '') {
        return { success: false, error: 'Team number is required' };
      }

      const success = await raceRepository.addTeam(raceId, teamId, number.trim());
      if (!success) {
        return { success: false, error: 'Race or team not found' };
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async removeTeamFromRace(raceId: number, teamId: number): Promise<RaceServiceResult<void>> {
    try {
      const success = await raceRepository.removeTeam(raceId, teamId);
      if (!success) {
        return { success: false, error: 'Race team not found' };
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async getRaceTeams(raceId: number): Promise<RaceServiceResult<RaceTeam[]>> {
    try {
      const teams = await raceRepository.getTeams(raceId);
      return { success: true, data: teams };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}

export const raceService = new RaceService();
