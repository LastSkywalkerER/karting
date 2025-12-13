export interface PitlaneKartStatusData {
  pitlaneNumber: number; // 1-4
  kartStatus: number; // 1-5
}

export interface PitlaneKartStatus extends PitlaneKartStatusData {
  id?: number;
}

export class PitlaneKartStatusEntity {
  constructor(
    public readonly pitlaneNumber: number,
    public readonly kartStatus: number,
    public readonly id?: number
  ) {
    if (pitlaneNumber < 1 || pitlaneNumber > 4) {
      throw new Error('Pitlane number must be between 1 and 4');
    }
    if (kartStatus < 1 || kartStatus > 5) {
      throw new Error('Kart status must be between 1 and 5');
    }
  }

  static create(data: PitlaneKartStatusData): PitlaneKartStatusEntity {
    return new PitlaneKartStatusEntity(
      data.pitlaneNumber,
      data.kartStatus
    );
  }

  toPlainObject(): PitlaneKartStatus {
    return {
      id: this.id,
      pitlaneNumber: this.pitlaneNumber,
      kartStatus: this.kartStatus
    };
  }
}

