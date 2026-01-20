import { TeamRepository } from '../repositories/TeamRepository';
import { Team } from '../entities/Team';

export class TeamService {
  private repository: TeamRepository;

  constructor() {
    this.repository = new TeamRepository();
  }

  async createTeam(data: { name: string }): Promise<Team> {
    return await this.repository.create(data);
  }

  async getTeamById(id: number): Promise<Team | null> {
    return await this.repository.findById(id);
  }

  async getAllTeams(): Promise<Team[]> {
    return await this.repository.findAll();
  }

  async updateTeam(id: number, data: Partial<{ name: string }>): Promise<Team | null> {
    return await this.repository.update(id, data);
  }

  async deleteTeam(id: number): Promise<void> {
    const team = await this.repository.findById(id);
    if (!team) {
      throw new Error('Team not found');
    }

    await this.repository.delete(id);
  }
}
