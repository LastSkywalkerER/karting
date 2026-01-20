import { Repository } from 'typeorm';
import { AppDataSource } from '../../../shared/database/Database';
import { PitlaneConfig } from '../entities/PitlaneConfig';

export class PitlaneConfigRepository {
  private repository: Repository<PitlaneConfig>;

  constructor() {
    this.repository = AppDataSource.getRepository(PitlaneConfig);
  }

  async create(data: { raceId: number; linesCount: number; queueSize: number }): Promise<PitlaneConfig> {
    const config = this.repository.create(data);
    return await this.repository.save(config);
  }

  async findById(id: number): Promise<PitlaneConfig | null> {
    return await this.repository.findOneBy({ id });
  }

  async findByRaceId(raceId: number): Promise<PitlaneConfig | null> {
    return await this.repository.findOneBy({ raceId });
  }

  async update(id: number, data: Partial<{ linesCount: number; queueSize: number }>): Promise<PitlaneConfig | null> {
    await this.repository.update(id, data);
    return await this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}
