import { Repository } from 'typeorm';
import { AppDataSource } from '../../../shared/database/Database';
import { Team } from '../entities/Team';

export class TeamRepository {
  private repository: Repository<Team>;

  constructor() {
    this.repository = AppDataSource.getRepository(Team);
  }

  async create(data: { name: string }): Promise<Team> {
    const team = this.repository.create(data);
    return await this.repository.save(team);
  }

  async findById(id: number): Promise<Team | null> {
    return await this.repository.findOneBy({ id });
  }

  async findAll(): Promise<Team[]> {
    return await this.repository.find({ order: { name: 'ASC' } });
  }

  async update(id: number, data: Partial<{ name: string }>): Promise<Team | null> {
    await this.repository.update(id, data);
    return await this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}
