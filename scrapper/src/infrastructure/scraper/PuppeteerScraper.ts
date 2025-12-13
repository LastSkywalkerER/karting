import puppeteer, { Browser, Page } from 'puppeteer';
import { IScraperService, ScraperStatus } from '../../domain/services/IScraperService';
import { RaceResultData } from '../../domain/entities/RaceResult';
import { IRaceResultRepository } from '../../domain/repositories/IRaceResultRepository';
import * as fs from 'fs';

const SPEEDHIVE_URL = 'https://speedhive.mylaps.com/livetiming/0409BF1AD0B97F05-2147486933/sessions/0409BF1AD0B97F05-2147486933-1073748974';
const SESSION_ID = '0409BF1AD0B97F05-2147486933-1073748974';

export class PuppeteerScraper implements IScraperService {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private isRunning = false;

  constructor(private repository: IRaceResultRepository) {}

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Scraper is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting scraper...');

    try {
      // Launch browser (using settings from ethers-scripts)
      // Try to use system Chrome if available, otherwise use default
      const launchOptions: any = {};
      
      // Check for system Chrome on macOS
      const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
      if (process.platform === 'darwin' && fs.existsSync(chromePath)) {
        launchOptions.executablePath = chromePath;
      } else if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
      }
      
      this.browser = await puppeteer.launch(launchOptions);

      this.page = await this.browser.newPage();

      // Set viewport
      await this.page.setViewport({ width: 1920, height: 1080 });

      // Navigate to page
      console.log(`Navigating to ${SPEEDHIVE_URL}`);
      await this.page.goto(SPEEDHIVE_URL, {
        waitUntil: 'networkidle2',
        timeout: 60000
      });

      // Wait for table to appear (using datatable structure)
      console.log('Waiting for results table...');
      try {
        await this.page.waitForSelector('.datatable-header-row, [class*="datatable-row"]', {
          timeout: 30000
        });
      } catch (error) {
        console.log('Table selector not found, trying alternative approach...');
      }

      // Wait a bit for WebSocket data to load
      console.log('Waiting for WebSocket data to load...');
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Wait for table to have data rows (excluding header)
      await this.page.waitForFunction(() => {
        // Find data rows (not header row)
        const rows = (document as any).querySelectorAll('[class*="datatable-row"]:not(.datatable-header-row)');
        return rows && rows.length > 0;
      }, { timeout: 30000 });

      console.log('Table found, setting up MutationObserver...');

      // Setup page event listener to detect when MutationObserver updates data
      await this.page.exposeFunction('saveResultsToDB', async (results: RaceResultData[]) => {
        if (results && results.length > 0) {
          const { RaceResultEntity } = await import('../../domain/entities/RaceResult');
          const entities = results.map(result => 
            RaceResultEntity.create(result, SESSION_ID)
          );
          this.repository.saveMany(entities);
          console.log(`Saved ${results.length} race results at ${new Date().toISOString()}`);
        }
      });

      // Setup MutationObserver
      await this.setupMutationObserver();

      console.log('Scraper is running. Monitoring for changes...');

    } catch (error) {
      console.error('Error starting scraper:', error);
      this.isRunning = false;
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log('Scraper is not running');
      return;
    }

    console.log('Stopping scraper...');
    this.isRunning = false;

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
      hasPage: this.page !== null
    };
  }

  private async setupMutationObserver(): Promise<void> {
    if (!this.page) {
      throw new Error('Page is not initialized');
    }

    await this.page.evaluate(() => {
      const extractAndNotify = (): RaceResultData[] => {
        const results: RaceResultData[] = [];
        
        // Find data rows (exclude header row)
        const rows = (document as any).querySelectorAll('[class*="datatable-row"]:not(.datatable-header-row)');

        if (!rows || rows.length === 0) {
          return results;
        }

        rows.forEach((row: any, index: number) => {
          try {
            // Find cells by their class names
            const posCell = row.querySelector('[class*="datatable-header-position"], [class*="position"]');
            const competitorNumberCell = row.querySelector('[class*="datatable-cell-display-number"], [class*="display-number"]');
            const competitorCell = row.querySelector('[class*="datatable-header-competitor"], [class*="competitor"]');
            const lapsCell = row.querySelector('[class*="datatable-header-laps"], [class*="laps"]');
            const lastLapCell = row.querySelector('[class*="datatable-header-last-lap-time"], [class*="last-lap"]');
            const diffCell = row.querySelector('[class*="datatable-header-difference"], [class*="difference"]');
            const gapCell = row.querySelector('[class*="datatable-header-gap"], [class*="gap"]');
            const bestLapCell = row.querySelector('[class*="datatable-header-best-lap-time"], [class*="best-lap"]');

            if (!posCell || !competitorCell) return;

            const position = parseInt(posCell.textContent?.trim() || '0') || null;

            // Extract competitor number from separate cell
            const competitorNumber = competitorNumberCell ? competitorNumberCell.textContent?.trim() || null : null;
            
            // Extract competitor name from competitor cell
            const competitorName = competitorCell.textContent?.trim() || null;

            const laps = lapsCell ? parseInt(lapsCell.textContent?.trim() || '0') || null : null;
            const lastLapTime = lastLapCell ? lastLapCell.textContent?.trim() || null : null;
            const bestLapTime = bestLapCell ? bestLapCell.textContent?.trim() || null : null;
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
                diff
              });
            }
          } catch (error) {
            console.error(`Error parsing row ${index}:`, error);
          }
        });

        return results;
      };

      // Debounce function to avoid too frequent saves
      let debounceTimer: NodeJS.Timeout | null = null;
      const debounceDelay = 1000; // 1 second

      const debouncedSave = (results: RaceResultData[]) => {
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
        debounceTimer = setTimeout(() => {
          if ((window as any).saveResultsToDB) {
            (window as any).saveResultsToDB(results);
          }
        }, debounceDelay);
      };

      // Find the datatable container
      let targetElement: any = (document as any).querySelector('[class*="datatable"]') || 
                               (document as any).querySelector('.datatable-header-row')?.parentElement;

      if (!targetElement) {
        targetElement = (document as any).body;
      }

      // Create MutationObserver
      const observer = new (window as any).MutationObserver((mutations: any) => {
        let hasContentChange = false;
        for (const mutation of mutations) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            hasContentChange = true;
            break;
          }
          if (mutation.type === 'characterData') {
            hasContentChange = true;
            break;
          }
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            hasContentChange = true;
            break;
          }
        }

        if (hasContentChange) {
          const results = extractAndNotify();
          if (results.length > 0) {
            (window as any).__scrapedResults = results;
            (window as any).__resultsTimestamp = new Date().toISOString();
            debouncedSave(results);
          }
        }
      });

      observer.observe(targetElement, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['class']
      });

      // Extract and save initial data
      const initialResults = extractAndNotify();
      if (initialResults.length > 0) {
        (window as any).__scrapedResults = initialResults;
        (window as any).__resultsTimestamp = new Date().toISOString();
        debouncedSave(initialResults);
      }

      console.log('MutationObserver setup complete');
    });
  }
}

