export interface ScraperStatus {
  isRunning: boolean;
  hasBrowser: boolean;
  hasPage: boolean;
  currentUrl?: string | null;
  sessionId?: string | null;
}

export interface IScraperService {
  start(url: string): Promise<void>;
  stop(): Promise<void>;
  getStatus(): ScraperStatus;
}

