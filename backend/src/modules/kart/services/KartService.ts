import { KartRepository } from '../repositories/KartRepository';
import { Kart } from '../entities/Kart';

export class KartService {
  private repository: KartRepository;

  constructor() {
    this.repository = new KartRepository();
  }

  async createKart(data: { raceId: number; status?: number; teamId?: number | null }): Promise<Kart> {
    // Validate status if provided
    if (data.status !== undefined && (data.status < 1 || data.status > 5)) {
      throw new Error('Kart status must be between 1 and 5');
    }

    return await this.repository.create(data);
  }

  async createManyKarts(raceId: number, count: number): Promise<Kart[]> {
    if (count < 1) {
      throw new Error('Count must be at least 1');
    }
    if (count > 100) {
      throw new Error('Cannot create more than 100 karts at once');
    }

    return await this.repository.createMany(raceId, count);
  }

  async getKartById(id: number): Promise<Kart | null> {
    return await this.repository.findById(id);
  }

  async getKartsByRace(raceId: number): Promise<Kart[]> {
    return await this.repository.findByRace(raceId);
  }

  async getKartsByTeam(teamId: number): Promise<Kart[]> {
    return await this.repository.findByTeam(teamId);
  }

  async updateKart(id: number, data: Partial<{ status: number; teamId: number | null }>): Promise<Kart | null> {
    // Validate status if provided
    if (data.status !== undefined && (data.status < 1 || data.status > 5)) {
      throw new Error('Kart status must be between 1 and 5');
    }

    return await this.repository.update(id, data);
  }

  async deleteKart(id: number): Promise<void> {
    const kart = await this.repository.findById(id);
    if (!kart) {
      throw new Error('Kart not found');
    }

    await this.repository.delete(id);
  }

  async assignTeam(kartId: number, teamId: number | null): Promise<void> {
    const kart = await this.repository.findById(kartId);
    if (!kart) {
      throw new Error('Kart not found');
    }

    await this.repository.assignTeam(kartId, teamId);
  }

  async updateStatus(kartId: number, status: number): Promise<void> {
    if (status < 1 || status > 5) {
      throw new Error('Kart status must be between 1 and 5');
    }

    const kart = await this.repository.findById(kartId);
    if (!kart) {
      throw new Error('Kart not found');
    }

    await this.repository.updateStatus(kartId, status);
  }
}
