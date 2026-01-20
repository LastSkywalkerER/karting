import { Repository } from 'typeorm';
import { AppDataSource } from '../../../shared/database/Database';
import { Kart } from '../entities/Kart';

export class KartRepository {
  private repository: Repository<Kart>;

  constructor() {
    this.repository = AppDataSource.getRepository(Kart);
  }

  async create(data: { raceId: number; status?: number; teamId?: number | null }): Promise<Kart> {
    const kart = this.repository.create({
      raceId: data.raceId,
      status: data.status ?? 1,
      teamId: data.teamId ?? null
    });
    return await this.repository.save(kart);
  }

  async createMany(raceId: number, count: number): Promise<Kart[]> {
    const karts: Kart[] = [];
    for (let i = 0; i < count; i++) {
      const kart = this.repository.create({
        raceId,
        status: 1,
        teamId: null
      });
      karts.push(kart);
    }
    return await this.repository.save(karts);
  }

  async findById(id: number): Promise<Kart | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['race', 'team']
    });
  }

  async findByRace(raceId: number): Promise<Kart[]> {
    return await this.repository.find({
      where: { raceId },
      relations: ['team'],
      order: { id: 'ASC' }
    });
  }

  async findByTeam(teamId: number): Promise<Kart[]> {
    return await this.repository.find({
      where: { teamId },
      relations: ['race']
    });
  }

  async findByTeamAndRace(teamId: number, raceId: number): Promise<Kart[]> {
    return await this.repository.find({
      where: { teamId, raceId },
      relations: ['race']
    });
  }

  async update(id: number, data: Partial<{ status: number; teamId: number | null }>): Promise<Kart | null> {
    await this.repository.update(id, data);
    return await this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  async assignTeam(kartId: number, teamId: number | null): Promise<void> {
    await this.repository.update(kartId, { teamId });
  }

  async updateStatus(kartId: number, status: number): Promise<void> {
    await this.repository.update(kartId, { status });
  }
}
