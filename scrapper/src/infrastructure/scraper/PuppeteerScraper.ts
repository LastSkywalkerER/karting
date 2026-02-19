import puppeteer, { Browser, Page } from 'puppeteer';
import { IScraperService, ScraperStatus } from '../../domain/services/IScraperService';
import { RaceResultData } from '../../domain/entities/RaceResult';
import { IRaceResultRepository } from '../../domain/repositories/IRaceResultRepository';
import { IPitlaneEntryEventRepository } from '../../domain/repositories/IPitlaneEntryEventRepository';
import {
  isValidSpeedhiveUrl,
  extractSessionIdFromUrl,
} from '../../shared/utils/speedhiveUrl';
import * as fs from 'fs';

const IN_PIT = 'IN PIT';

export class PuppeteerScraper implements IScraperService {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private isRunning = false;
  private currentUrl: string | null = null;
  private currentSessionId: string | null = null;
  private previousState: Map<string, { lastLapTime: string | null; laps: number | null }> =
    new Map();

  constructor(
    private repository: IRaceResultRepository,
    private pitlaneEventRepository: IPitlaneEntryEventRepository
  ) {}

  async start(url: string): Promise<void> {
    if (!url || !isValidSpeedhiveUrl(url)) {
      throw new Error('Invalid SpeedHive URL');
    }

    const sessionId = extractSessionIdFromUrl(url);
    if (!sessionId) {
      throw new Error('Could not extract session ID from URL');
    }

    if (this.isRunning && this.page) {
      if (this.currentSessionId === sessionId) {
        // Same session already being scraped - skip, avoid redundant restart
        return;
      }
      // Different session - switch to new URL
      console.log(`Switching to ${url}`);
      await this.navigateToUrl(url, sessionId);
      return;
    }

    this.isRunning = true;
    this.currentUrl = url;
    this.currentSessionId = sessionId;
    this.previousState.clear();
    console.log('Starting scraper...');

    try {
      const launchOptions: Parameters<typeof puppeteer.launch>[0] = {
        headless: 'new',
      };

      const chromePath =
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
      if (process.platform === 'darwin' && fs.existsSync(chromePath)) {
        launchOptions.executablePath = chromePath;
      } else if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
        // Required for Chrome in Docker: sandbox requires namespaces which fail with "Operation not permitted"
        launchOptions.args = [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
        ];
      }

      this.browser = await puppeteer.launch(launchOptions);
      this.page = await this.browser.newPage();
      await this.page.setViewport({ width: 1920, height: 1080 });

      await this.navigateToUrl(url, sessionId);

      console.log('Table found, setting up MutationObserver...');

      await this.setupMutationObserver(sessionId);
      console.log('Scraper is running. Monitoring for changes...');
    } catch (error) {
      console.error('Error starting scraper:', error);
      this.isRunning = false;
      this.currentUrl = null;
      this.currentSessionId = null;
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
      this.page = null;
      throw error;
    }
  }

  private async navigateToUrl(url: string, sessionId: string): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');

    this.currentUrl = url;
    this.currentSessionId = sessionId;
    this.previousState.clear();

    console.log(`Navigating to ${url}`);
    await this.page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    console.log('Waiting for results table...');
    try {
      await this.page.waitForSelector(
        '.datatable-header-row, [class*="datatable-row"]',
        { timeout: 30000 }
      );
    } catch {
      console.log('Table selector not found, trying alternative approach...');
    }

    console.log('Waiting for WebSocket data to load...');
    await new Promise((resolve) => setTimeout(resolve, 5000));

    await this.page.waitForFunction(
      () => {
        const rows = (document as unknown as Document).querySelectorAll(
          '[class*="datatable-row"]:not(.datatable-header-row)'
        );
        return rows && rows.length > 0;
      },
      { timeout: 30000 }
    );
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log('Scraper is not running');
      return;
    }

    console.log('Stopping scraper...');
    this.isRunning = false;
    this.currentUrl = null;
    this.currentSessionId = null;
    this.previousState.clear();

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    this.page = null;
    console.log('Scraper stopped');
  }

  getStatus(): ScraperStatus {
    return {
      isRunning: this.isRunning,
      hasBrowser: this.browser !== null,
      hasPage: this.page !== null,
      currentUrl: this.currentUrl,
      sessionId: this.currentSessionId,
    };
  }

  private async setupMutationObserver(sessionId: string): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');

    const repository = this.repository;
    const pitlaneEventRepository = this.pitlaneEventRepository;
    const previousState = this.previousState;

    await this.page.exposeFunction(
      'saveResultsToDB',
      async (results: RaceResultData[]) => {
        if (!results || results.length === 0) return;

        const { RaceResultEntity } = await import(
          '../../domain/entities/RaceResult'
        );
        const entities = results.map((r) =>
          RaceResultEntity.create(r, sessionId)
        );
        repository.saveMany(entities);

        for (const result of results) {
          if (!result.competitorNumber) continue;

          const key = `${sessionId}-${result.competitorNumber}`;
          const prev = previousState.get(key);
          const currLastLap =
            result.lastLapTime?.trim().toUpperCase() ?? null;
          const isNowInPit = currLastLap === IN_PIT;
          const wasInPit = prev?.lastLapTime?.trim().toUpperCase() === IN_PIT;

          if (isNowInPit && !wasInPit) {
            pitlaneEventRepository.create({
              sessionId,
              competitorNumber: result.competitorNumber,
              lapNumber: result.laps ?? 0,
              timestamp: new Date().toISOString(),
              acknowledged: false,
            });
          }

          previousState.set(key, {
            lastLapTime: result.lastLapTime,
            laps: result.laps ?? null,
          });
        }

        console.log(
          `Saved ${results.length} race results at ${new Date().toISOString()}`
        );
      }
    );

    await this.page.evaluate(() => {
      const extractAndNotify = (): RaceResultData[] => {
        const results: RaceResultData[] = [];
        const rows = (document as unknown as Document).querySelectorAll(
          '[class*="datatable-row"]:not(.datatable-header-row)'
        );

        if (!rows || rows.length === 0) return results;

        rows.forEach((row: Element, index: number) => {
          try {
            const posCell = row.querySelector(
              '[class*="datatable-header-position"], [class*="position"]'
            );
            const competitorNumberCell = row.querySelector(
              '[class*="datatable-cell-display-number"], [class*="display-number"]'
            );
            const competitorCell = row.querySelector(
              '[class*="datatable-header-competitor"], [class*="competitor"]'
            );
            const lapsCell = row.querySelector(
              '[class*="datatable-header-laps"], [class*="laps"]'
            );
            const lastLapCell = row.querySelector(
              '[class*="datatable-header-last-lap-time"], [class*="last-lap"]'
            );
            const diffCell = row.querySelector(
              '[class*="datatable-header-difference"], [class*="difference"]'
            );
            const gapCell = row.querySelector(
              '[class*="datatable-header-gap"], [class*="gap"]'
            );
            const bestLapCell = row.querySelector(
              '[class*="datatable-header-best-lap-time"], [class*="best-lap"]'
            );

            if (!posCell || !competitorCell) return;

            const position =
              parseInt(posCell.textContent?.trim() || '0') || null;
            const competitorNumber = competitorNumberCell
              ? competitorNumberCell.textContent?.trim() || null
              : null;
            const competitorName = competitorCell.textContent?.trim() || null;
            const laps = lapsCell
              ? parseInt(lapsCell.textContent?.trim() || '0') || null
              : null;
            const lastLapTime = lastLapCell
              ? lastLapCell.textContent?.trim() || null
              : null;
            const bestLapTime = bestLapCell
              ? bestLapCell.textContent?.trim() || null
              : null;
            const gap = gapCell ? gapCell.textContent?.trim() || null : null;
            const diff = diffCell ? diffCell.textContent?.trim() || null : null;

            if (position !== null) {
              results.push({
                position,
                competitorNumber,
                competitorName,
                laps,
                lastLapTime,
                bestLapTime,
                gap,
                diff,
              });
            }
          } catch (error) {
            console.error(`Error parsing row ${index}:`, error);
          }
        });

        return results;
      };

      let debounceTimer: ReturnType<typeof setTimeout> | null = null;
      const debounceDelay = 1000;

      const debouncedSave = (results: RaceResultData[]) => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          if ((window as unknown as { saveResultsToDB?: (r: RaceResultData[]) => void }).saveResultsToDB) {
            (window as unknown as { saveResultsToDB: (r: RaceResultData[]) => void }).saveResultsToDB(results);
          }
        }, debounceDelay);
      };

      const targetElement =
        (document as unknown as Document).querySelector('[class*="datatable"]') ||
        (document as unknown as Document)
          .querySelector('.datatable-header-row')
          ?.parentElement ||
        (document as unknown as Document).body;

      const observer = new MutationObserver((mutations: MutationRecord[]) => {
        const hasContentChange = mutations.some(
          (m) =>
            (m.type === 'childList' && m.addedNodes.length > 0) ||
            m.type === 'characterData' ||
            (m.type === 'attributes' && m.attributeName === 'class')
        );
        if (hasContentChange) {
          const results = extractAndNotify();
          if (results.length > 0) {
            (window as unknown as { __scrapedResults?: RaceResultData[] }).__scrapedResults = results;
            (window as unknown as { __resultsTimestamp?: string }).__resultsTimestamp = new Date().toISOString();
            debouncedSave(results);
          }
        }
      });

      observer.observe(targetElement, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['class'],
      });

      const initialResults = extractAndNotify();
      if (initialResults.length > 0) {
        (window as unknown as { __scrapedResults?: RaceResultData[] }).__scrapedResults = initialResults;
        (window as unknown as { __resultsTimestamp?: string }).__resultsTimestamp = new Date().toISOString();
        debouncedSave(initialResults);
      }

      console.log('MutationObserver setup complete');
    });
  }
}
