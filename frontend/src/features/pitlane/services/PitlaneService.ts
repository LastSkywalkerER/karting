import { pitlaneConfigRepository } from '../db/PitlaneConfigRepository';
import { pitlaneCurrentRepository } from '../db/PitlaneCurrentRepository';
import { pitlaneHistoryRepository } from '../db/PitlaneHistoryRepository';
import { kartRepository } from '../../karts/db/KartRepository';
import type { PitlaneConfig, PitlaneCurrent, PitlaneHistory } from '@/shared/types/pitlane';

export interface PitlaneServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class PitlaneService {
  // Config methods
  async createConfig(data: {
    raceId: number;
    linesCount: number;
    queueSize: number;
  }): Promise<PitlaneServiceResult<PitlaneConfig>> {
    try {
      // Check if config already exists for this race
      const existing = await pitlaneConfigRepository.findByRaceId(data.raceId);
      if (existing) {
        return { success: false, error: 'Pitlane config already exists for this race' };
      }

      if (data.linesCount < 1) {
        return { success: false, error: 'Lines count must be at least 1' };
      }
      if (data.queueSize < 1) {
        return { success: false, error: 'Queue size must be at least 1' };
      }

      const config = await pitlaneConfigRepository.create(data);
      return { success: true, data: config };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async getConfigById(id: number): Promise<PitlaneServiceResult<PitlaneConfig>> {
    try {
      const config = await pitlaneConfigRepository.findById(id);
      if (!config) {
        return { success: false, error: 'Pitlane config not found' };
      }
      return { success: true, data: config };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async getConfigByRaceId(raceId: number): Promise<PitlaneServiceResult<PitlaneConfig>> {
    try {
      const config = await pitlaneConfigRepository.findByRaceId(raceId);
      if (!config) {
        return { success: false, error: 'Pitlane config not found' };
      }
      return { success: true, data: config };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async updateConfig(
    id: number,
    data: { linesCount?: number; queueSize?: number }
  ): Promise<PitlaneServiceResult<PitlaneConfig>> {
    try {
      if (data.linesCount !== undefined && data.linesCount < 1) {
        return { success: false, error: 'Lines count must be at least 1' };
      }
      if (data.queueSize !== undefined && data.queueSize < 1) {
        return { success: false, error: 'Queue size must be at least 1' };
      }

      const config = await pitlaneConfigRepository.update(id, data);
      if (!config) {
        return { success: false, error: 'Pitlane config not found' };
      }
      return { success: true, data: config };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async deleteConfig(id: number): Promise<PitlaneServiceResult<void>> {
    try {
      const deleted = await pitlaneConfigRepository.delete(id);
      if (!deleted) {
        return { success: false, error: 'Pitlane config not found' };
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // Current state methods
  async getCurrentByConfig(configId: number): Promise<PitlaneServiceResult<PitlaneCurrent[]>> {
    try {
      const entries = await pitlaneCurrentRepository.findByConfig(configId);
      return { success: true, data: entries };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async getCurrentByLine(
    configId: number,
    lineNumber: number
  ): Promise<PitlaneServiceResult<PitlaneCurrent[]>> {
    try {
      const entries = await pitlaneCurrentRepository.findByLine(configId, lineNumber);
      return { success: true, data: entries };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async addKartToPitlane(
    configId: number,
    teamId: number,
    lineNumber: number
  ): Promise<PitlaneServiceResult<void>> {
    try {
      console.log('PitlaneService.addKartToPitlane', { configId, teamId, lineNumber });
      // Validate config exists
      const config = await pitlaneConfigRepository.findById(configId);
      if (!config) {
        return { success: false, error: 'Pitlane config not found' };
      }

      // Validate line number
      if (lineNumber < 1 || lineNumber > config.linesCount) {
        return { success: false, error: `Line number must be between 1 and ${config.linesCount}` };
      }

      // Find team's assigned kart
      const teamKarts = await kartRepository.findByTeamAndRace(teamId, config.raceId);
      if (teamKarts.length === 0) {
        return { success: false, error: 'Team has no assigned kart' };
      }

      // Check if team's kart is already in pitlane
      const currentEntries = await pitlaneCurrentRepository.findByConfig(configId);
      const currentKartIds = new Set(currentEntries.map((entry) => entry.kartId));
      const availableTeamKarts = teamKarts.filter((kart) => !currentKartIds.has(kart.id));

      if (availableTeamKarts.length === 0) {
        return { success: false, error: 'Team current kart is already in pitlane' };
      }
      if (availableTeamKarts.length > 1) {
        return { success: false, error: 'Team has multiple assigned karts' };
      }

      await pitlaneCurrentRepository.addKart(
        configId,
        teamId,
        availableTeamKarts[0].id,
        lineNumber,
        config.queueSize
      );

      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async removeKartFromPitlane(id: number, teamId?: number): Promise<PitlaneServiceResult<void>> {
    try {
      // Get the entry first to find the config and race
      const db = await (await import('@/shared/db/database')).getDatabase();
      const entry = await db.get('pitlane_current', id);
      if (!entry || entry.isDeleted) {
        return { success: false, error: 'Pitlane entry not found' };
      }

      // Get config to find raceId
      const config = await pitlaneConfigRepository.findById(entry.pitlaneConfigId);
      const raceId = config?.raceId;

      await pitlaneCurrentRepository.deleteById(id, teamId, raceId);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async clearPitlaneLine(configId: number, lineNumber: number): Promise<PitlaneServiceResult<void>> {
    try {
      await pitlaneCurrentRepository.clearLine(configId, lineNumber);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // History methods
  async getHistoryByConfig(configId: number): Promise<PitlaneServiceResult<PitlaneHistory[]>> {
    try {
      const entries = await pitlaneHistoryRepository.findByConfig(configId);
      return { success: true, data: entries };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async getHistoryByLine(
    configId: number,
    lineNumber: number
  ): Promise<PitlaneServiceResult<PitlaneHistory[]>> {
    try {
      const entries = await pitlaneHistoryRepository.findByLine(configId, lineNumber);
      return { success: true, data: entries };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}

export const pitlaneService = new PitlaneService();
