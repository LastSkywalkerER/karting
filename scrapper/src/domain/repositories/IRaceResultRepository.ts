import { RaceResult, RaceResultEntity } from '../entities/RaceResult';

export interface QueryOptions {
  limit?: number;
  offset?: number;
  sessionId?: string;
}

export interface IRaceResultRepository {
  save(result: RaceResultEntity): void;
  saveMany(results: RaceResultEntity[]): void;
  findAll(options?: QueryOptions): RaceResult[];
  findLatestBySessionId(sessionId: string): RaceResult[];
  findTimestampsBySessionId(sessionId: string): string[];
}

