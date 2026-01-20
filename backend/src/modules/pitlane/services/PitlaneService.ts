import { PitlaneConfigRepository } from '../repositories/PitlaneConfigRepository';
import { PitlaneCurrentRepository } from '../repositories/PitlaneCurrentRepository';
import { PitlaneHistoryRepository } from '../repositories/PitlaneHistoryRepository';
import { PitlaneConfig } from '../entities/PitlaneConfig';
import { PitlaneCurrent } from '../entities/PitlaneCurrent';
import { PitlaneHistory } from '../entities/PitlaneHistory';

export class PitlaneService {
  private configRepository: PitlaneConfigRepository;
  private currentRepository: PitlaneCurrentRepository;
  private historyRepository: PitlaneHistoryRepository;

  constructor() {
    this.configRepository = new PitlaneConfigRepository();
    this.currentRepository = new PitlaneCurrentRepository();
    this.historyRepository = new PitlaneHistoryRepository();
  }

  // Config methods
  async createConfig(data: { raceId: number; linesCount: number; queueSize: number }): Promise<PitlaneConfig> {
    // Check if config already exists for this race
    const existing = await this.configRepository.findByRaceId(data.raceId);
    if (existing) {
      throw new Error('Pitlane config already exists for this race');
    }

    if (data.linesCount < 1) {
      throw new Error('Lines count must be at least 1');
    }
    if (data.queueSize < 1) {
      throw new Error('Queue size must be at least 1');
    }

    return await this.configRepository.create(data);
  }

  async getConfigById(id: number): Promise<PitlaneConfig | null> {
    return await this.configRepository.findById(id);
  }

  async getConfigByRaceId(raceId: number): Promise<PitlaneConfig | null> {
    return await this.configRepository.findByRaceId(raceId);
  }

  async updateConfig(id: number, data: Partial<{ linesCount: number; queueSize: number }>): Promise<PitlaneConfig | null> {
    if (data.linesCount !== undefined && data.linesCount < 1) {
      throw new Error('Lines count must be at least 1');
    }
    if (data.queueSize !== undefined && data.queueSize < 1) {
      throw new Error('Queue size must be at least 1');
    }

    return await this.configRepository.update(id, data);
  }

  async deleteConfig(id: number): Promise<void> {
    await this.configRepository.delete(id);
  }

  // Current state methods
  async getCurrentByConfig(configId: number): Promise<PitlaneCurrent[]> {
    return await this.currentRepository.findByConfig(configId);
  }

  async getCurrentByLine(configId: number, lineNumber: number): Promise<PitlaneCurrent[]> {
    return await this.currentRepository.findByLine(configId, lineNumber);
  }

  async addKartToPitlane(
    configId: number,
    teamId: number,
    kartId: number,
    lineNumber: number,
    assignTeamIdToOldKart?: number
  ): Promise<void> {
    // Validate line number
    const config = await this.configRepository.findById(configId);
    if (!config) {
      throw new Error('Pitlane config not found');
    }
    if (lineNumber < 1 || lineNumber > config.linesCount) {
      throw new Error(`Line number must be between 1 and ${config.linesCount}`);
    }

    await this.currentRepository.addKart(configId, teamId, kartId, lineNumber, assignTeamIdToOldKart);
  }

  async removeKartFromPitlane(id: number, teamId?: number): Promise<void> {
    await this.currentRepository.deleteById(id, teamId);
  }

  async clearPitlaneLine(configId: number, lineNumber: number): Promise<void> {
    await this.currentRepository.clearLine(configId, lineNumber);
  }

  // History methods
  async getHistoryByConfig(configId: number): Promise<PitlaneHistory[]> {
    return await this.historyRepository.findByConfig(configId);
  }

  async getHistoryByLine(configId: number, lineNumber: number): Promise<PitlaneHistory[]> {
    return await this.historyRepository.findByLine(configId, lineNumber);
  }
}
