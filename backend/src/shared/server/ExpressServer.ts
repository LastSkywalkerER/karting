import express, { Express } from 'express';

// Import sync route
import { syncRoutes } from '../../modules/sync/routes/syncRoutes';

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

    // Sync API route (local-first architecture)
    this.app.use('/api/sync', syncRoutes);

    // Debug: log all registered routes
    console.log('Registered API routes:');
    console.log('  /api/sync');
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
