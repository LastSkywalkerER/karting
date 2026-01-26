import { Repository } from 'typeorm';
import AppDataSource from '../../../shared/database/Database';
import { PitlaneCurrent } from '../entities/PitlaneCurrent';
import { PitlaneConfig } from '../entities/PitlaneConfig';
import { PitlaneHistory } from '../entities/PitlaneHistory';
import { Kart } from '../../kart/entities/Kart';

export class PitlaneCurrentRepository {
  private repository: Repository<PitlaneCurrent>;
  private configRepository: Repository<PitlaneConfig>;
  private historyRepository: Repository<PitlaneHistory>;
  private kartRepository: Repository<Kart>;

  constructor() {
    this.repository = AppDataSource.getRepository(PitlaneCurrent);
    this.configRepository = AppDataSource.getRepository(PitlaneConfig);
    this.historyRepository = AppDataSource.getRepository(PitlaneHistory);
    this.kartRepository = AppDataSource.getRepository(Kart);
  }

  async findByConfig(configId: number): Promise<PitlaneCurrent[]> {
    return await this.repository.find({
      where: { pitlaneConfigId: configId },
      relations: ['team', 'kart'],
      order: { lineNumber: 'ASC', queuePosition: 'ASC' }
    });
  }

  async findByLine(configId: number, lineNumber: number): Promise<PitlaneCurrent[]> {
    return await this.repository.find({
      where: { pitlaneConfigId: configId, lineNumber },
      relations: ['team', 'kart'],
      order: { queuePosition: 'ASC' }
    });
  }

  async addKart(
    configId: number,
    teamId: number,
    kartId: number,
    lineNumber: number
  ): Promise<void> {
    // Get pitlane config to know queue size
    const config = await this.configRepository.findOneBy({ id: configId });
    if (!config) {
      throw new Error('Pitlane config not found');
    }

    const existingEntry = await this.repository.findOne({
      where: { pitlaneConfigId: configId, kartId }
    });
    if (existingEntry) {
      throw new Error('Kart is already in pitlane');
    }

    // Remove team assignment from the new kart (kart goes to pitlane, so it's no longer assigned to a team)
    await this.kartRepository.update(kartId, { teamId: null });

    // Get current queue for this line
    const currentQueue = await this.findByLine(configId, lineNumber);

    // Check if queue is full
    if (currentQueue.length >= config.queueSize) {
      // Remove the first kart (queue_position = 0) and move to history
      const firstEntry = currentQueue[0];
      
      const now = Date.now();
      
      // Create history entry
      const historyEntry = this.historyRepository.create({
        pitlaneConfigId: firstEntry.pitlaneConfigId,
        teamId: firstEntry.teamId,
        kartId: firstEntry.kartId,
        lineNumber: firstEntry.lineNumber,
        queuePosition: firstEntry.queuePosition,
        enteredAt: firstEntry.enteredAt,
        exitedAt: now,
        updatedAt: now,
        isDeleted: false,
        deletedAt: null
      });
      await this.historyRepository.save(historyEntry);

      // Assign old kart back to the same team
      await this.kartRepository.update(firstEntry.kartId, { teamId: firstEntry.teamId, updatedAt: now });

      // Delete the first entry from current
      await this.repository.delete(firstEntry.id);

      // Shift all positions up (decrease queue_position by 1)
      for (let i = 1; i < currentQueue.length; i++) {
        await this.repository.update(currentQueue[i].id, {
          queuePosition: currentQueue[i].queuePosition - 1,
          updatedAt: now
        });
      }

      // Add new kart at the last position
      const newEntry = this.repository.create({
        pitlaneConfigId: configId,
        teamId,
        kartId,
        lineNumber,
        queuePosition: config.queueSize - 1,
        enteredAt: now,
        updatedAt: now,
        isDeleted: false,
        deletedAt: null
      });
      await this.repository.save(newEntry);
    } else {
      const now = Date.now();
      
      // Queue is not full, find the first available position
      const occupiedPositions = currentQueue.map(e => e.queuePosition);
      let newPosition = 0;
      while (occupiedPositions.includes(newPosition)) {
        newPosition++;
      }

      // Add new kart at the available position
      const newEntry = this.repository.create({
        pitlaneConfigId: configId,
        teamId,
        kartId,
        lineNumber,
        queuePosition: newPosition,
        enteredAt: now,
        updatedAt: now,
        isDeleted: false,
        deletedAt: null
      });
      await this.repository.save(newEntry);
    }
  }

  async removeKart(
    configId: number,
    lineNumber: number,
    queuePosition: number,
    teamId?: number
  ): Promise<void> {
    // Find the entry to remove
    const entry = await this.repository.findOne({
      where: { pitlaneConfigId: configId, lineNumber, queuePosition }
    });

    if (!entry) {
      throw new Error('Pitlane entry not found');
    }

    const now = Date.now();

    // Create history entry
    const historyEntry = this.historyRepository.create({
      pitlaneConfigId: entry.pitlaneConfigId,
      teamId: entry.teamId,
      kartId: entry.kartId,
      lineNumber: entry.lineNumber,
      queuePosition: entry.queuePosition,
      enteredAt: entry.enteredAt,
      exitedAt: now,
      updatedAt: now,
      isDeleted: false,
      deletedAt: null
    });
    await this.historyRepository.save(historyEntry);

    // Assign team to kart if specified
    if (teamId !== undefined) {
      const config = await this.configRepository.findOneBy({ id: configId });
      if (!config) {
        throw new Error('Pitlane config not found');
      }

      const existingTeamKart = await this.kartRepository.findOne({
        where: { teamId, raceId: config.raceId }
      });
      if (existingTeamKart && existingTeamKart.id !== entry.kartId) {
        await this.kartRepository.update(existingTeamKart.id, { teamId: null, updatedAt: now });
      }

      await this.kartRepository.update(entry.kartId, { teamId, updatedAt: now });
    }

    // Delete the entry
    await this.repository.delete(entry.id);

    // Shift all entries with higher queue_position down
    const remainingEntries = await this.findByLine(configId, lineNumber);
    for (const remainingEntry of remainingEntries) {
      if (remainingEntry.queuePosition > queuePosition) {
        await this.repository.update(remainingEntry.id, {
          queuePosition: remainingEntry.queuePosition - 1,
          updatedAt: now
        });
      }
    }
  }

  async clearLine(configId: number, lineNumber: number): Promise<void> {
    const entries = await this.findByLine(configId, lineNumber);
    const now = Date.now();
    
    for (const entry of entries) {
      // Create history entry for each
      const historyEntry = this.historyRepository.create({
        pitlaneConfigId: entry.pitlaneConfigId,
        teamId: entry.teamId,
        kartId: entry.kartId,
        lineNumber: entry.lineNumber,
        queuePosition: entry.queuePosition,
        enteredAt: entry.enteredAt,
        exitedAt: now,
        updatedAt: now,
        isDeleted: false,
        deletedAt: null
      });
      await this.historyRepository.save(historyEntry);
    }

    // Delete all entries for this line
    await this.repository.delete({ pitlaneConfigId: configId, lineNumber });
  }

  async deleteById(id: number, teamId?: number): Promise<void> {
    const entry = await this.repository.findOneBy({ id });
    
    if (!entry) {
      throw new Error('Pitlane entry not found');
    }

    const now = Date.now();

    // Create history entry
    const historyEntry = this.historyRepository.create({
      pitlaneConfigId: entry.pitlaneConfigId,
      teamId: entry.teamId,
      kartId: entry.kartId,
      lineNumber: entry.lineNumber,
      queuePosition: entry.queuePosition,
      enteredAt: entry.enteredAt,
      exitedAt: now,
      updatedAt: now,
      isDeleted: false,
      deletedAt: null
    });
    await this.historyRepository.save(historyEntry);

    // Assign team to kart if specified
    if (teamId !== undefined) {
      const config = await this.configRepository.findOneBy({ id: entry.pitlaneConfigId });
      if (!config) {
        throw new Error('Pitlane config not found');
      }

      const existingTeamKart = await this.kartRepository.findOne({
        where: { teamId, raceId: config.raceId }
      });
      if (existingTeamKart && existingTeamKart.id !== entry.kartId) {
        await this.kartRepository.update(existingTeamKart.id, { teamId: null, updatedAt: now });
      }

      await this.kartRepository.update(entry.kartId, { teamId, updatedAt: now });
    }

    // Delete the entry
    await this.repository.delete(id);

    // Shift remaining entries
    const remainingEntries = await this.findByLine(entry.pitlaneConfigId, entry.lineNumber);
    for (const remainingEntry of remainingEntries) {
      if (remainingEntry.queuePosition > entry.queuePosition) {
        await this.repository.update(remainingEntry.id, {
          queuePosition: remainingEntry.queuePosition - 1,
          updatedAt: now
        });
      }
    }
  }
}
