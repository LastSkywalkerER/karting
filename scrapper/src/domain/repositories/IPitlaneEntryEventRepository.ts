import { PitlaneEntryEvent } from '../entities/PitlaneEntryEvent';

export interface IPitlaneEntryEventRepository {
  create(event: Omit<PitlaneEntryEvent, 'id'>): number;
  findBySession(sessionId: string, acknowledged?: boolean): PitlaneEntryEvent[];
  acknowledge(id: number): void;
}
