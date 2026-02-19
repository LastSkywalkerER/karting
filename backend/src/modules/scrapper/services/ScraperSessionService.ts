import AppDataSource from '../../../shared/database/Database';
import { Race } from '../../race/entities/Race';
import { extractSessionIdFromUrl } from '../../../shared/utils/speedhiveUrl';

export class ScraperSessionService {
  async markSessionCompleted(sessionId: string): Promise<number> {
    const repo = AppDataSource.getRepository(Race);
    const races = await repo.find({
      where: { isDeleted: false },
      select: ['id', 'speedhiveUrl', 'scrapeCompletedAt'],
    });

    const now = Date.now();
    let marked = 0;
    for (const race of races) {
      if (!race.speedhiveUrl) continue;
      if (race.scrapeCompletedAt != null) continue;
      const raceSessionId = extractSessionIdFromUrl(race.speedhiveUrl);
      if (raceSessionId === sessionId) {
        await repo.update(race.id, { scrapeCompletedAt: now });
        marked++;
        console.log(`[ScraperSession] Marked race ${race.id} as scrape-completed (session ${sessionId})`);
      }
    }
    return marked;
  }
}

export const scraperSessionService = new ScraperSessionService();
