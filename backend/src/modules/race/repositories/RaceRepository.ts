import { Repository } from 'typeorm';
import { AppDataSource } from '../../../shared/database/Database';
import { Race } from '../entities/Race';
import { Team } from '../../team/entities/Team';
import { RaceTeam } from '../entities/RaceTeam';

export class RaceRepository {
  private repository: Repository<Race>;
  private teamRepository: Repository<Team>;
  private raceTeamRepository: Repository<RaceTeam>;

  constructor() {
    this.repository = AppDataSource.getRepository(Race);
    this.teamRepository = AppDataSource.getRepository(Team);
    this.raceTeamRepository = AppDataSource.getRepository(RaceTeam);
  }

  async create(data: { name: string; date: string }): Promise<Race> {
    const race = this.repository.create({ ...data, raceTeams: [] });
    return await this.repository.save(race);
  }

  async findById(id: number): Promise<Race | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['raceTeams', 'raceTeams.team']
    });
  }

  async findAll(): Promise<Race[]> {
    return await this.repository.find({
      relations: ['raceTeams', 'raceTeams.team'],
      order: { date: 'DESC' }
    });
  }

  async update(id: number, data: Partial<{ name: string; date: string }>): Promise<Race | null> {
    await this.repository.update(id, data);
    return await this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  async addTeam(raceId: number, teamId: number, number: string): Promise<void> {
    const race = await this.repository.findOneBy({ id: raceId });
    if (!race) {
      throw new Error('Race not found');
    }

    const team = await this.teamRepository.findOneBy({ id: teamId });
    if (!team) {
      throw new Error('Team not found');
    }

    const existingTeam = await this.raceTeamRepository.findOneBy({ raceId, teamId });
    if (existingTeam) {
      return;
    }

    const existingNumber = await this.raceTeamRepository.findOneBy({ raceId, number });
    if (existingNumber) {
      throw new Error(`Team number ${number} is already used in this race`);
    }

    const raceTeam = this.raceTeamRepository.create({ raceId, teamId, number });
    await this.raceTeamRepository.save(raceTeam);
  }

  async removeTeam(raceId: number, teamId: number): Promise<void> {
    await this.raceTeamRepository.delete({ raceId, teamId });
  }

  async getTeams(raceId: number): Promise<RaceTeam[]> {
    return await this.raceTeamRepository.find({
      where: { raceId },
      relations: ['team']
    });
  }
}
