export interface ScraperStatus {
  isRunning: boolean;
  hasBrowser: boolean;
  hasPage: boolean;
}

export interface IScraperService {
  start(): Promise<void>;
  stop(): Promise<void>;
  getStatus(): ScraperStatus;
}

