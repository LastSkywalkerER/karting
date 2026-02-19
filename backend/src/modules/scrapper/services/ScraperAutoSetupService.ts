import AppDataSource from '../../../shared/database/Database';
import { Race } from '../../race/entities/Race';
import { extractSessionIdFromUrl } from '../../../shared/utils/speedhiveUrl';
import { scrapperProxyService } from './ScrapperProxyService';
import { TeamRepository } from '../../team/repositories/TeamRepository';
import { RaceRepository } from '../../race/repositories/RaceRepository';
import { KartRepository } from '../../kart/repositories/KartRepository';

const POLL_INTERVAL_MS = 8000;
const ATTEMPTS_PER_BATCH = 60;
const PAUSE_BETWEEN_BATCHES_MS = 5 * 60 * 1000;

export class ScraperAutoSetupService {
  private teamRepository = new TeamRepository();
  private raceRepository = new RaceRepository();
  private kartRepository = new KartRepository();

  startAutoSetup(url: string, raceId?: number): void {
    setImmediate(() => this.runPollLoop(url, raceId));
  }

  private async runPollLoop(url: string, raceId?: number): Promise<void> {
    const sessionId = extractSessionIdFromUrl(url);
    if (!sessionId) {
      console.warn('[ScraperAutoSetup] Invalid URL, no sessionId:', url);
      return;
    }

    let attempts = 0;
    const maxAttempts = ATTEMPTS_PER_BATCH;

    const poll = async (): Promise<void> => {
      attempts++;
      const lapData = await scrapperProxyService.fetchLapTimesBySessionId(sessionId);

      if (lapData && lapData.competitorNumbers.length > 0) {
        try {
          const setup = await this.performSetup(
            url,
            raceId,
            lapData.competitorNumbers,
            lapData.competitorNames
          );
          if (setup) {
            console.log('[ScraperAutoSetup] Teams and karts created successfully');
            return;
          }
        } catch (err) {
          console.error('[ScraperAutoSetup] Error during setup:', err);
        }
      }

      const race = await this.findRace(url, raceId);
      if (race) {
        const teamCount = await this.getRaceTeamCount(race.id);
        if (teamCount > 0) {
          return;
        }
      }

      if (attempts >= maxAttempts) {
        console.log('[ScraperAutoSetup] Batch exhausted, pausing 5 min before retry');
        setTimeout(() => this.runPollLoop(url, raceId), PAUSE_BETWEEN_BATCHES_MS);
        return;
      }

      setTimeout(poll, POLL_INTERVAL_MS);
    };

    setTimeout(poll, POLL_INTERVAL_MS);
  }

  private async findRace(url: string, raceId?: number): Promise<Race | null> {
    const repo = AppDataSource.getRepository(Race);
    if (raceId != null) {
      const race = await repo.findOne({
        where: { id: raceId, isDeleted: false }
      });
      if (race) return race;
      // Retry a few times for sync latency
      for (let i = 0; i < 3; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const retry = await repo.findOne({
          where: { id: raceId, isDeleted: false }
        });
        if (retry) return retry;
      }
    }
    const normalized = url.trim();
    return repo.findOne({
      where: { speedhiveUrl: normalized, isDeleted: false }
    });
  }

  private async getRaceTeamCount(raceId: number): Promise<number> {
    const teams = await this.raceRepository.getTeams(raceId);
    return teams.length;
  }

  private async performSetup(
    url: string,
    raceId: number | undefined,
    competitorNumbers: string[],
    competitorNames?: string[]
  ): Promise<boolean> {
    const race = await this.findRace(url, raceId);
    if (!race) return false;

    const teamCount = await this.getRaceTeamCount(race.id);
    if (teamCount > 0) return false;

    const teams: { id: number }[] = [];
    for (let i = 0; i < competitorNumbers.length; i++) {
      const num = competitorNumbers[i];
      const name = competitorNames?.[i]?.trim() || `Team ${num}`;
      const team = await this.teamRepository.create({ name });
      teams.push({ id: team.id });
    }

    for (let i = 0; i < competitorNumbers.length; i++) {
      await this.raceRepository.addTeam(race.id, teams[i].id, competitorNumbers[i]);
    }

    for (let i = 0; i < teams.length; i++) {
      await this.kartRepository.create({
        raceId: race.id,
        number: i + 1,
        status: 5,
        teamId: teams[i].id
      });
    }

    return true;
  }
}

export const scraperAutoSetupService = new ScraperAutoSetupService();
