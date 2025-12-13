import { TeamKartStatus, TeamKartStatusEntity } from '../entities/TeamKartStatus';

export interface ITeamKartStatusRepository {
  findAll(): TeamKartStatus[];
  findByTeamNumber(teamNumber: string): TeamKartStatus | null;
  save(teamKartStatus: TeamKartStatusEntity): void;
  updateMany(updates: Array<{ teamNumber: string; kartStatus: number }>): void;
}

