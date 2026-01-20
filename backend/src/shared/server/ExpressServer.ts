import express, { Express } from 'express';

// Import routes
import { teamRoutes } from '../../modules/team/routes/teamRoutes';
import { raceRoutes } from '../../modules/race/routes/raceRoutes';
import { kartRoutes } from '../../modules/kart/routes/kartRoutes';
import { pitlaneRoutes } from '../../modules/pitlane/routes/pitlaneRoutes';

export class ExpressServer {
  private app: Express;
  private server: ReturnType<Express['listen']> | null = null;

  constructor(private port: number = 3000) {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
    
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

    // API routes
    this.app.use('/api/teams', teamRoutes);
    this.app.use('/api/races', raceRoutes);
    this.app.use('/api/karts', kartRoutes);
    this.app.use('/api/pitlanes', pitlaneRoutes);

    // Debug: log all registered routes
    console.log('Registered API routes:');
    console.log('  /api/teams');
    console.log('  /api/races');
    console.log('  /api/karts');
    console.log('  /api/pitlanes');
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
