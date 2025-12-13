import express, { Express } from 'express';
import { RaceResultController } from '../controllers/RaceResultController';
import { createRaceResultRoutes } from '../routes/raceResultRoutes';

export class ExpressServer {
  private app: Express;
  private server: ReturnType<Express['listen']> | null = null;

  constructor(
    private raceResultController: RaceResultController,
    private port: number = 3000
  ) {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => this.raceResultController.getHealth(req, res));

    // API routes
    const apiRouter = createRaceResultRoutes(this.raceResultController);
    this.app.use('/api', apiRouter);
    
    // Debug: log all registered routes
    console.log('Registered API routes:');
    apiRouter.stack.forEach((r: any) => {
      if (r.route) {
        console.log(`  ${Object.keys(r.route.methods).join(', ').toUpperCase()} /api${r.route.path}`);
      }
    });
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

