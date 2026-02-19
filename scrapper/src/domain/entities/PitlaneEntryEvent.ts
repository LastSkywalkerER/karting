export interface PitlaneEntryEvent {
  id?: number;
  sessionId: string;
  competitorNumber: string;
  lapNumber: number;
  timestamp: string;
  acknowledged: boolean;
}
