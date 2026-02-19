import AppDataSource from '../../../shared/database/Database';
import { Race } from '../../race/entities/Race';
import { extractSessionIdFromUrl } from '../../../shared/utils/speedhiveUrl';

const SCRAPPER_URL = process.env.SCRAPPER_URL || 'http://localhost:3001';

export class ScrapperProxyService {
  private get baseUrl(): string {
    return SCRAPPER_URL.replace(/\/$/, '');
  }

  async getRaceWithSpeedhiveUrl(raceId: number): Promise<Race | null> {
    const repo = AppDataSource.getRepository(Race);
    const race = await repo.findOne({
      where: { id: raceId, isDeleted: false },
    });
    if (!race || !race.speedhiveUrl) return null;
    return race;
  }

  async fetchLapTimesBySessionId(
    sessionId: string
  ): Promise<{
    lapNumbers: number[];
    competitorNumbers: string[];
    competitorNames?: string[];
    data: (string | null)[][];
  } | null> {
    try {
      const res = await fetch(
        `${this.baseUrl}/api/results/lap-times?sessionId=${encodeURIComponent(sessionId)}`
      );
      if (!res.ok) return null;
      const json = (await res.json()) as {
        success?: boolean;
        lapNumbers?: number[];
        competitorNumbers?: string[];
        competitorNames?: string[];
        data?: (string | null)[][];
      };
      if (
        !Array.isArray(json.competitorNumbers) ||
        !Array.isArray(json.lapNumbers) ||
        !Array.isArray(json.data)
      ) {
        return null;
      }
      return {
        lapNumbers: json.lapNumbers,
        competitorNumbers: json.competitorNumbers,
        competitorNames: Array.isArray(json.competitorNames) ? json.competitorNames : undefined,
        data: json.data
      };
    } catch {
      return null;
    }
  }

  async fetchLapTimes(raceId: number): Promise<unknown> {
    const race = await this.getRaceWithSpeedhiveUrl(raceId);
    if (!race || !race.speedhiveUrl) return null;
    const sessionId = extractSessionIdFromUrl(race.speedhiveUrl);
    if (!sessionId) return null;
    const res = await fetch(
      `${this.baseUrl}/api/results/lap-times?sessionId=${encodeURIComponent(sessionId)}`
    );
    if (!res.ok) throw new Error(`Scrapper error: ${res.status}`);
    return res.json();
  }

  async fetchPitlaneEvents(raceId: number, acknowledged = false): Promise<unknown> {
    const race = await this.getRaceWithSpeedhiveUrl(raceId);
    if (!race || !race.speedhiveUrl) return null;
    const sessionId = extractSessionIdFromUrl(race.speedhiveUrl);
    if (!sessionId) return null;
    const url = `${this.baseUrl}/api/events/pitlane-entries?sessionId=${encodeURIComponent(sessionId)}&acknowledged=${acknowledged}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Scrapper error: ${res.status}`);
    return res.json();
  }

  async acknowledgePitlaneEvent(eventId: number): Promise<void> {
    const res = await fetch(
      `${this.baseUrl}/api/events/pitlane-entries/${eventId}/acknowledge`,
      { method: 'POST' }
    );
    if (!res.ok) throw new Error(`Scrapper error: ${res.status}`);
  }

  async getScrapeStatus(): Promise<{
    isRunning: boolean;
    sessionId: string | null;
    currentUrl: string | null;
  } | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/scrape/status`);
      if (!res.ok) return null;
      const json = (await res.json()) as {
        isRunning?: boolean;
        sessionId?: string | null;
        currentUrl?: string | null;
      };
      return {
        isRunning: Boolean(json.isRunning),
        sessionId: json.sessionId ?? null,
        currentUrl: json.currentUrl ?? null
      };
    } catch {
      return null;
    }
  }

  async startScrape(url: string): Promise<{ alreadyInProgress?: boolean }> {
    const res = await fetch(`${this.baseUrl}/api/scrape/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Scrapper error: ${res.status} - ${text}`);
    }
    const json = (await res.json()) as { alreadyInProgress?: boolean };
    return { alreadyInProgress: json.alreadyInProgress };
  }
}

export const scrapperProxyService = new ScrapperProxyService();
