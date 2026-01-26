import { Repository, MoreThan } from 'typeorm';
import { AppDataSource } from '../../../shared/database/Database';
import { Team } from '../../team/entities/Team';
import { Race } from '../../race/entities/Race';
import { RaceTeam } from '../../race/entities/RaceTeam';
import { Kart } from '../../kart/entities/Kart';
import { PitlaneConfig } from '../../pitlane/entities/PitlaneConfig';
import { PitlaneCurrent } from '../../pitlane/entities/PitlaneCurrent';
import { PitlaneHistory } from '../../pitlane/entities/PitlaneHistory';

export interface SyncChanges {
  teams: Partial<Team>[];
  races: Partial<Race>[];
  race_teams: Partial<RaceTeam>[];
  karts: Partial<Kart>[];
  pitlane_configs: Partial<PitlaneConfig>[];
  pitlane_current: Partial<PitlaneCurrent>[];
  pitlane_history: Partial<PitlaneHistory>[];
}

export interface SyncRequest {
  lastSyncTimestamp: number;
  changes: SyncChanges;
}

export interface SyncResponse {
  serverTimestamp: number;
  changes: SyncChanges;
}

export class SyncService {
  private teamRepo: Repository<Team>;
  private raceRepo: Repository<Race>;
  private raceTeamRepo: Repository<RaceTeam>;
  private kartRepo: Repository<Kart>;
  private pitlaneConfigRepo: Repository<PitlaneConfig>;
  private pitlaneCurrentRepo: Repository<PitlaneCurrent>;
  private pitlaneHistoryRepo: Repository<PitlaneHistory>;

  constructor() {
    this.teamRepo = AppDataSource.getRepository(Team);
    this.raceRepo = AppDataSource.getRepository(Race);
    this.raceTeamRepo = AppDataSource.getRepository(RaceTeam);
    this.kartRepo = AppDataSource.getRepository(Kart);
    this.pitlaneConfigRepo = AppDataSource.getRepository(PitlaneConfig);
    this.pitlaneCurrentRepo = AppDataSource.getRepository(PitlaneCurrent);
    this.pitlaneHistoryRepo = AppDataSource.getRepository(PitlaneHistory);
  }

  async sync(request: SyncRequest): Promise<SyncResponse> {
    const serverTimestamp = Date.now();
    const { lastSyncTimestamp, changes } = request;

    // Apply client changes (last-write-wins)
    await this.applyClientChanges(changes);

    // Get server changes since last sync
    const serverChanges = await this.getServerChanges(lastSyncTimestamp);

    return {
      serverTimestamp,
      changes: serverChanges,
    };
  }

  private async applyClientChanges(changes: SyncChanges): Promise<void> {
    // Apply teams
    for (const record of changes.teams) {
      if (record.id) {
        const existing = await this.teamRepo.findOneBy({ id: record.id });
        if (!existing || (record.updatedAt && record.updatedAt > existing.updatedAt)) {
          await this.teamRepo.save(record);
        }
      } else {
        // New record - save and get generated ID
        await this.teamRepo.save(record);
      }
    }

    // Apply races
    for (const record of changes.races) {
      if (record.id) {
        const existing = await this.raceRepo.findOneBy({ id: record.id });
        if (!existing || (record.updatedAt && record.updatedAt > existing.updatedAt)) {
          await this.raceRepo.save(record);
        }
      } else {
        await this.raceRepo.save(record);
      }
    }

    // Apply race_teams
    for (const record of changes.race_teams) {
      if (record.raceId && record.teamId) {
        const existing = await this.raceTeamRepo.findOneBy({
          raceId: record.raceId,
          teamId: record.teamId,
        });
        if (!existing || (record.updatedAt && record.updatedAt > existing.updatedAt)) {
          await this.raceTeamRepo.save(record);
        }
      }
    }

    // Apply karts
    for (const record of changes.karts) {
      if (record.id) {
        const existing = await this.kartRepo.findOneBy({ id: record.id });
        if (!existing || (record.updatedAt && record.updatedAt > existing.updatedAt)) {
          await this.kartRepo.save(record);
        }
      } else {
        await this.kartRepo.save(record);
      }
    }

    // Apply pitlane_configs
    for (const record of changes.pitlane_configs) {
      if (record.id) {
        const existing = await this.pitlaneConfigRepo.findOneBy({ id: record.id });
        if (!existing || (record.updatedAt && record.updatedAt > existing.updatedAt)) {
          await this.pitlaneConfigRepo.save(record);
        }
      } else {
        await this.pitlaneConfigRepo.save(record);
      }
    }

    // Apply pitlane_current
    for (const record of changes.pitlane_current) {
      if (record.id) {
        const existing = await this.pitlaneCurrentRepo.findOneBy({ id: record.id });
        if (!existing || (record.updatedAt && record.updatedAt > existing.updatedAt)) {
          await this.pitlaneCurrentRepo.save(record);
        }
      } else {
        await this.pitlaneCurrentRepo.save(record);
      }
    }

    // Apply pitlane_history
    for (const record of changes.pitlane_history) {
      if (record.id) {
        const existing = await this.pitlaneHistoryRepo.findOneBy({ id: record.id });
        if (!existing || (record.updatedAt && record.updatedAt > existing.updatedAt)) {
          await this.pitlaneHistoryRepo.save(record);
        }
      } else {
        await this.pitlaneHistoryRepo.save(record);
      }
    }
  }

  private async getServerChanges(since: number): Promise<SyncChanges> {
    const whereCondition = since > 0 ? { updatedAt: MoreThan(since) } : {};

    const [teams, races, race_teams, karts, pitlane_configs, pitlane_current, pitlane_history] =
      await Promise.all([
        this.teamRepo.find({ where: whereCondition }),
        this.raceRepo.find({ where: whereCondition }),
        this.raceTeamRepo.find({ where: whereCondition }),
        this.kartRepo.find({ where: whereCondition }),
        this.pitlaneConfigRepo.find({ where: whereCondition }),
        this.pitlaneCurrentRepo.find({ where: whereCondition }),
        this.pitlaneHistoryRepo.find({ where: whereCondition }),
      ]);

    return {
      teams,
      races,
      race_teams,
      karts,
      pitlane_configs,
      pitlane_current,
      pitlane_history,
    };
  }
}

export const syncService = new SyncService();
