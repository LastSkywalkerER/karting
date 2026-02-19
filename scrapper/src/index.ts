import 'dotenv/config';
import { DatabaseConnection } from './infrastructure/database/Database';
import { RaceResultRepository } from './infrastructure/database/RaceResultRepository';
import { TeamKartStatusRepository } from './infrastructure/database/TeamKartStatusRepository';
import { PitlaneKartStatusRepository } from './infrastructure/database/PitlaneKartStatusRepository';
import { PitlaneEntryEventRepository } from './infrastructure/database/PitlaneEntryEventRepository';
import { PuppeteerScraper } from './infrastructure/scraper/PuppeteerScraper';
import { LapTimesService } from './domain/services/LapTimesService';
import { RaceResultController } from './presentation/controllers/RaceResultController';
import { ExpressServer } from './presentation/server/ExpressServer';

async function start(): Promise<void> {
  try {
    // Infrastructure layer
    const databaseConnection = new DatabaseConnection();
    const raceResultRepository = new RaceResultRepository(databaseConnection);
    const teamKartStatusRepository = new TeamKartStatusRepository(databaseConnection);
    const pitlaneKartStatusRepository = new PitlaneKartStatusRepository(databaseConnection);
    const pitlaneEntryEventRepository = new PitlaneEntryEventRepository(databaseConnection);
    const scraperService = new PuppeteerScraper(
      raceResultRepository,
      pitlaneEntryEventRepository
    );

    // Domain layer
    const lapTimesService = new LapTimesService();

    // Presentation layer
    const raceResultController = new RaceResultController(
      raceResultRepository,
      scraperService,
      lapTimesService,
      teamKartStatusRepository,
      pitlaneKartStatusRepository,
      pitlaneEntryEventRepository
    );

    const port = parseInt(process.env.PORT || '3000', 10);
    const expressServer = new ExpressServer(raceResultController, port);

    // Start Express server (scraper is started on demand via POST /api/scrape/start)
    await expressServer.start();

    // Graceful shutdown
    const shutdown = async () => {
      console.log('\nShutting down gracefully...');
      await scraperService.stop();
      await expressServer.stop();
      databaseConnection.close();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (error) {
    console.error('Error starting application:', error);
    process.exit(1);
  }
}

// Start the application
start();

