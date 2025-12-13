export interface RaceResultData {
  position: number | null;
  competitorNumber: string | null;
  competitorName: string | null;
  laps: number | null;
  lastLapTime: string | null;
  bestLapTime: string | null;
  gap: string | null;
  diff: string | null;
  rawData?: Record<string, unknown>;
}

export interface RaceResult extends RaceResultData {
  id?: number;
  timestamp: string;
  sessionId: string;
}

export class RaceResultEntity {
  constructor(
    public readonly sessionId: string,
    public readonly position: number | null,
    public readonly competitorNumber: string | null,
    public readonly competitorName: string | null,
    public readonly laps: number | null,
    public readonly lastLapTime: string | null,
    public readonly bestLapTime: string | null,
    public readonly gap: string | null,
    public readonly diff: string | null,
    public readonly timestamp: string = new Date().toISOString(),
    public readonly id?: number,
    public readonly rawData?: Record<string, unknown>
  ) {}

  static create(data: RaceResultData, sessionId: string): RaceResultEntity {
    return new RaceResultEntity(
      sessionId,
      data.position,
      data.competitorNumber,
      data.competitorName,
      data.laps,
      data.lastLapTime,
      data.bestLapTime,
      data.gap,
      data.diff,
      new Date().toISOString(),
      undefined,
      data.rawData
    );
  }

  toPlainObject(): RaceResult {
    return {
      id: this.id,
      timestamp: this.timestamp,
      sessionId: this.sessionId,
      position: this.position,
      competitorNumber: this.competitorNumber,
      competitorName: this.competitorName,
      laps: this.laps,
      lastLapTime: this.lastLapTime,
      bestLapTime: this.bestLapTime,
      gap: this.gap,
      diff: this.diff,
      rawData: this.rawData
    };
  }
}

