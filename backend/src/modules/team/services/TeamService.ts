import { TeamRepository } from '../repositories/TeamRepository';
import { Team } from '../entities/Team';

export class TeamService {
  private repository: TeamRepository;

  constructor() {
    this.repository = new TeamRepository();
  }

  async createTeam(data: { name: string; number: string }): Promise<Team> {
    // Check if team with this number already exists
    const existing = await this.repository.findByNumber(data.number);
    if (existing) {
      throw new Error(`Team with number ${data.number} already exists`);
    }

    return await this.repository.create(data);
  }

  async getTeamById(id: number): Promise<Team | null> {
    return await this.repository.findById(id);
  }

  async getTeamByNumber(number: string): Promise<Team | null> {
    return await this.repository.findByNumber(number);
  }

  async getAllTeams(): Promise<Team[]> {
    return await this.repository.findAll();
  }

  async updateTeam(id: number, data: Partial<{ name: string; number: string }>): Promise<Team | null> {
    // If updating number, check it's not taken by another team
    if (data.number) {
      const existing = await this.repository.findByNumber(data.number);
      if (existing && existing.id !== id) {
        throw new Error(`Team with number ${data.number} already exists`);
      }
    }

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
