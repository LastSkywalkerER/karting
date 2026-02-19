import cron from 'node-cron';
import AppDataSource from '../../../shared/database/Database';
import { Race } from '../../race/entities/Race';
import { Not, IsNull } from 'typeorm';
import { scrapperProxyService } from './ScrapperProxyService';
import { extractSessionIdFromUrl } from '../../../shared/utils/speedhiveUrl';

export class ScrapperCronService {
  private roundRobinIndex = 0;

  start(): void {
    if (!process.env.SCRAPPER_URL) {
      console.log('[ScrapperCron] SCRAPPER_URL not set, cron disabled');
      return;
    }
    cron.schedule('* * * * *', () => this.tick());
    console.log('[ScrapperCron] Scheduled every minute');
  }

  private async tick(): Promise<void> {
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];

      const repo = AppDataSource.getRepository(Race);
      const races = await repo.find({
        where: {
          isDeleted: false,
          speedhiveUrl: Not(IsNull()),
        },
        select: ['id', 'speedhiveUrl', 'date'],
      });

      const withUrl = races.filter(
        (r) => r.speedhiveUrl && r.date >= weekAgoStr
      );
      if (withUrl.length === 0) return;

      const idx = this.roundRobinIndex % withUrl.length;
      this.roundRobinIndex = idx + 1;
      const race = withUrl[idx];
      if (!race?.speedhiveUrl) return;

      const status = await scrapperProxyService.getScrapeStatus();
      if (status?.isRunning) {
        // Scraper is busy - do not trigger a new scrape (avoids ping-pong between sessions)
        return;
      }

      const sessionId = extractSessionIdFromUrl(race.speedhiveUrl);
      if (!sessionId) return;

      await scrapperProxyService.startScrape(race.speedhiveUrl);
      console.log(`[ScrapperCron] Started scrape for race ${race.id}`);
    } catch (error) {
      console.error('[ScrapperCron] Error:', error);
    }
  }
}

export const scrapperCronService = new ScrapperCronService();
