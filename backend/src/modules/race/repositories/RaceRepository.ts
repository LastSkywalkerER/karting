import { Repository } from 'typeorm';
import { AppDataSource } from '../../../shared/database/Database';
import { Race } from '../entities/Race';
import { Team } from '../../team/entities/Team';

export class RaceRepository {
  private repository: Repository<Race>;
  private teamRepository: Repository<Team>;

  constructor() {
    this.repository = AppDataSource.getRepository(Race);
    this.teamRepository = AppDataSource.getRepository(Team);
  }

  async create(data: { name: string; date: string }): Promise<Race> {
    const race = this.repository.create({ ...data, teams: [] });
    return await this.repository.save(race);
  }

  async findById(id: number): Promise<Race | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['teams']
    });
  }

  async findAll(): Promise<Race[]> {
    return await this.repository.find({
      relations: ['teams'],
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

  async addTeam(raceId: number, teamId: number): Promise<void> {
    const race = await this.repository.findOne({
      where: { id: raceId },
      relations: ['teams']
    });
    
    if (!race) {
      throw new Error('Race not found');
    }

    const team = await this.teamRepository.findOneBy({ id: teamId });
    if (!team) {
      throw new Error('Team not found');
    }

    // Check if team is already added
    const isAlreadyAdded = race.teams.some(t => t.id === teamId);
    if (!isAlreadyAdded) {
      race.teams.push(team);
      await this.repository.save(race);
    }
  }

  async removeTeam(raceId: number, teamId: number): Promise<void> {
    const race = await this.repository.findOne({
      where: { id: raceId },
      relations: ['teams']
    });
    
    if (!race) {
      throw new Error('Race not found');
    }

    race.teams = race.teams.filter(t => t.id !== teamId);
    await this.repository.save(race);
  }

  async getTeams(raceId: number): Promise<Team[]> {
    const race = await this.repository.findOne({
      where: { id: raceId },
      relations: ['teams']
    });
    
    return race?.teams || [];
  }
}
