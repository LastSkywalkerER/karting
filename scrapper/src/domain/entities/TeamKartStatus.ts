export interface TeamKartStatusData {
  teamNumber: string;
  kartStatus: number; // 1-5
  lastPitLap?: number;
}

export interface TeamKartStatus extends TeamKartStatusData {
  id?: number;
}

export class TeamKartStatusEntity {
  constructor(
    public readonly teamNumber: string,
    public readonly kartStatus: number,
    public readonly id?: number,
    public readonly lastPitLap?: number
  ) {
    if (kartStatus < 1 || kartStatus > 5) {
      throw new Error('Kart status must be between 1 and 5');
    }
  }

  static create(data: TeamKartStatusData): TeamKartStatusEntity {
    return new TeamKartStatusEntity(
      data.teamNumber,
      data.kartStatus,
      undefined,
      data.lastPitLap
    );
  }

  toPlainObject(): TeamKartStatus {
    return {
      id: this.id,
      teamNumber: this.teamNumber,
      kartStatus: this.kartStatus,
      lastPitLap: this.lastPitLap
    };
  }
}

