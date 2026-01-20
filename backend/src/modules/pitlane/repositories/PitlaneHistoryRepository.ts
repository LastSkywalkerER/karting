import { Repository } from 'typeorm';
import { AppDataSource } from '../../../shared/database/Database';
import { PitlaneHistory } from '../entities/PitlaneHistory';

export class PitlaneHistoryRepository {
  private repository: Repository<PitlaneHistory>;

  constructor() {
    this.repository = AppDataSource.getRepository(PitlaneHistory);
  }

  async findByConfig(configId: number): Promise<PitlaneHistory[]> {
    return await this.repository.find({
      where: { pitlaneConfigId: configId },
      relations: ['team', 'kart'],
      order: { exitedAt: 'DESC' }
    });
  }

  async findByLine(configId: number, lineNumber: number): Promise<PitlaneHistory[]> {
    return await this.repository.find({
      where: { pitlaneConfigId: configId, lineNumber },
      relations: ['team', 'kart'],
      order: { exitedAt: 'DESC' }
    });
  }

  async create(data: {
    pitlaneConfigId: number;
    teamId: number;
    kartId: number;
    lineNumber: number;
    queuePosition: number;
    enteredAt: Date;
    exitedAt?: Date;
  }): Promise<PitlaneHistory> {
    const entry = this.repository.create({
      ...data,
      exitedAt: data.exitedAt ?? new Date()
    });
    return await this.repository.save(entry);
  }
}
