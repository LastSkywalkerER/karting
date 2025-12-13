import 'dotenv/config';
import { DatabaseConnection } from './infrastructure/database/Database';
import { RaceResultRepository } from './infrastructure/database/RaceResultRepository';
import { TeamKartStatusRepository } from './infrastructure/database/TeamKartStatusRepository';
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
    const scraperService = new PuppeteerScraper(raceResultRepository);

    // Domain layer
    const lapTimesService = new LapTimesService();

    // Presentation layer
    const raceResultController = new RaceResultController(
      raceResultRepository,
      scraperService,
      lapTimesService,
      teamKartStatusRepository
    );

    const port = parseInt(process.env.PORT || '3000', 10);
    const expressServer = new ExpressServer(raceResultController, port);

    // Start Express server
    await expressServer.start();

    // Start scraper in background (non-blocking)
    console.log('Starting scraper in background...');
    scraperService.start().catch((error) => {
      console.error('Failed to start scraper:', error.message);
      console.log('Server will continue running without scraper');
    });

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

