import { RaceRepository } from '../repositories/RaceRepository';
import { Race } from '../entities/Race';
import { Team } from '../../team/entities/Team';

export class RaceService {
  private repository: RaceRepository;

  constructor() {
    this.repository = new RaceRepository();
  }

  async createRace(data: { name: string; date: string }): Promise<Race> {
    return await this.repository.create(data);
  }

  async getRaceById(id: number): Promise<Race | null> {
    return await this.repository.findById(id);
  }

  async getAllRaces(): Promise<Race[]> {
    return await this.repository.findAll();
  }

  async updateRace(id: number, data: Partial<{ name: string; date: string }>): Promise<Race | null> {
    const race = await this.repository.findById(id);
    if (!race) {
      throw new Error('Race not found');
    }

    return await this.repository.update(id, data);
  }

  async deleteRace(id: number): Promise<void> {
    const race = await this.repository.findById(id);
    if (!race) {
      throw new Error('Race not found');
    }

    await this.repository.delete(id);
  }

  async addTeamToRace(raceId: number, teamId: number): Promise<void> {
    await this.repository.addTeam(raceId, teamId);
  }

  async removeTeamFromRace(raceId: number, teamId: number): Promise<void> {
    await this.repository.removeTeam(raceId, teamId);
  }

  async getRaceTeams(raceId: number): Promise<Team[]> {
    return await this.repository.getTeams(raceId);
  }
}
