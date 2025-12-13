import { PitlaneKartStatus, PitlaneKartStatusEntity } from '../entities/PitlaneKartStatus';

export interface IPitlaneKartStatusRepository {
  findAll(): PitlaneKartStatus[];
  findByPitlaneNumber(pitlaneNumber: number): PitlaneKartStatus | null;
  save(pitlaneKartStatus: PitlaneKartStatusEntity): void;
  updateMany(updates: Array<{ pitlaneNumber: number; kartStatus: number }>): void;
}

