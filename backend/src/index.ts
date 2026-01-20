import 'reflect-metadata';
import 'dotenv/config';
import { initializeDatabase, closeDatabase } from './shared/database/Database';
import { ExpressServer } from './shared/server/ExpressServer';

async function start(): Promise<void> {
  try {
    // Initialize database
    await initializeDatabase();
    console.log('Database initialized');

    // Start Express server
    const port = parseInt(process.env.PORT || '3000', 10);
    const expressServer = new ExpressServer(port);
    await expressServer.start();

    // Graceful shutdown
    const shutdown = async () => {
      console.log('\nShutting down gracefully...');
      await expressServer.stop();
      await closeDatabase();
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
