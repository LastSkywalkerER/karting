import { RaceResult } from '../entities/RaceResult';

export interface LapTimesTable {
  lapNumbers: number[];
  competitorNumbers: string[];
  competitorNames?: string[];
  data: (string | null)[][];
}

export interface ILapTimesService {
  buildLapTimesTable(results: RaceResult[]): LapTimesTable;
}

