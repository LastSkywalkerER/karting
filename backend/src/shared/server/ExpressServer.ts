import express, { Express } from 'express';

// Import routes
import { syncRoutes } from '../../modules/sync/routes/syncRoutes';
import { scrapperRoutes } from '../../modules/scrapper/routes/scrapperRoutes';
import { scrapperProxyService } from '../../modules/scrapper/services/ScrapperProxyService';
import { scraperAutoSetupService } from '../../modules/scrapper/services/ScraperAutoSetupService';
import { isValidSpeedhiveUrl, extractSessionIdFromUrl } from '../../shared/utils/speedhiveUrl';

export class ExpressServer {
  private app: Express;
  private server: ReturnType<Express['listen']> | null = null;

  constructor(private port: number = 3000) {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(express.json({ limit: '10mb' })); // Increased limit for sync payload
    
    // CORS middleware for development
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
      }
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (_req, res) => {
      res.json({ status: 'ok' });
    });

    // Scrapper trigger - must be before sync to avoid path conflicts
    this.app.post('/api/scrape/trigger', async (req, res) => {
      try {
        const { url, raceId } = req.body;
        if (!url || typeof url !== 'string') {
          res.status(400).json({ success: false, error: 'url is required' });
          return;
        }
        if (!isValidSpeedhiveUrl(url)) {
          res.status(400).json({ success: false, error: 'Invalid SpeedHive URL' });
          return;
        }
        const sessionId = extractSessionIdFromUrl(url);
        const status = sessionId ? await scrapperProxyService.getScrapeStatus() : null;
        if (status?.isRunning && status.sessionId === sessionId) {
          // Skip redundant start - scrape already in progress
        } else {
          await scrapperProxyService.startScrape(url);
        }
        const id = raceId != null ? parseInt(String(raceId), 10) : NaN;
        if (!isNaN(id)) {
          scraperAutoSetupService.startAutoSetup(url, id);
        } else {
          scraperAutoSetupService.startAutoSetup(url);
        }
        res.json({ success: true, message: 'Scraper started, auto-setup in progress' });
      } catch (error) {
        console.error('Error triggering scrape:', error);
        res.status(502).json({
          success: false,
          error: error instanceof Error ? error.message : 'Proxy error',
        });
      }
    });

    // Sync API route (local-first architecture)
    this.app.use('/api/sync', syncRoutes);

    // Scrapper proxy routes (lap-times, pitlane-events)
    this.app.use(scrapperRoutes);

    // Debug: log all registered routes
    console.log('Registered API routes:');
    console.log('  POST /api/scrape/trigger');
    console.log('  /api/sync');
    console.log('  /api/races/:id/lap-times');
    console.log('  /api/races/:id/pitlane-events');
    console.log('  /api/races/:raceId/pitlane-events/:eventId/acknowledge');
  }

  start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, () => {
        console.log(`Express server running on port ${this.port}`);
        resolve();
      });
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        this.server.close((err) => {
          if (err) {
            reject(err);
          } else {
            console.log('Express server stopped');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}
