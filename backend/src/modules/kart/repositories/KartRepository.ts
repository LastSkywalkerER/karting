import { Repository } from 'typeorm';
import AppDataSource from '../../../shared/database/Database';
import { Kart } from '../entities/Kart';

export class KartRepository {
  private repository: Repository<Kart>;

  constructor() {
    this.repository = AppDataSource.getRepository(Kart);
  }

  private async getNextNumberForRace(raceId: number): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('k')
      .select('COALESCE(MAX(k.number), 0) + 1', 'next')
      .where('k.race_id = :raceId', { raceId })
      .andWhere('k.is_deleted = 0')
      .getRawOne<{ next: number }>();
    return result?.next ?? 1;
  }

  async create(data: {
    raceId: number;
    status?: number;
    teamId?: number | null;
    number?: number;
  }): Promise<Kart> {
    const number =
      data.number ?? (await this.getNextNumberForRace(data.raceId));
    const kart = this.repository.create({
      raceId: data.raceId,
      number,
      status: data.status ?? 5,
      teamId: data.teamId ?? null
    });
    return await this.repository.save(kart);
  }

  async createMany(raceId: number, count: number): Promise<Kart[]> {
    let nextNumber = await this.getNextNumberForRace(raceId);
    const karts: Kart[] = [];
    for (let i = 0; i < count; i++) {
      const kart = this.repository.create({
        raceId,
        number: nextNumber++,
        status: 5,
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
      order: { number: 'ASC' }
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
