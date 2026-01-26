import { teamRepository } from '../db/TeamRepository';
import type { TeamRecord } from '@/shared/db/database';

export interface TeamServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class TeamService {
  async createTeam(data: { name: string }): Promise<TeamServiceResult<TeamRecord>> {
    try {
      if (!data.name || data.name.trim() === '') {
        return { success: false, error: 'Team name is required' };
      }

      const team = await teamRepository.create({ name: data.name.trim() });
      return { success: true, data: team };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async getTeamById(id: number): Promise<TeamServiceResult<TeamRecord>> {
    try {
      const team = await teamRepository.findById(id);
      if (!team) {
        return { success: false, error: 'Team not found' };
      }
      return { success: true, data: team };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async getAllTeams(): Promise<TeamServiceResult<TeamRecord[]>> {
    try {
      const teams = await teamRepository.findAll();
      return { success: true, data: teams };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async updateTeam(
    id: number,
    data: { name?: string }
  ): Promise<TeamServiceResult<TeamRecord>> {
    try {
      const updateData: { name?: string } = {};
      if (data.name !== undefined) {
        if (data.name.trim() === '') {
          return { success: false, error: 'Team name cannot be empty' };
        }
        updateData.name = data.name.trim();
      }

      const team = await teamRepository.update(id, updateData);
      if (!team) {
        return { success: false, error: 'Team not found' };
      }
      return { success: true, data: team };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async deleteTeam(id: number): Promise<TeamServiceResult<void>> {
    try {
      const deleted = await teamRepository.delete(id);
      if (!deleted) {
        return { success: false, error: 'Team not found' };
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}

export const teamService = new TeamService();
