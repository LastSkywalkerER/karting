const API_BASE = '/api';

export interface LapTimesTableResponse {
  success: boolean;
  lapNumbers: number[];
  competitorNumbers: string[];
  data: (string | null)[][];
}

export interface PitlaneEvent {
  id: number;
  sessionId: string;
  competitorNumber: string;
  lapNumber: number;
  timestamp: string;
  acknowledged: boolean;
}

export interface PitlaneEventsResponse {
  success: boolean;
  count: number;
  data: PitlaneEvent[];
}

export async function fetchLapTimes(
  raceId: number
): Promise<LapTimesTableResponse | null> {
  const res = await fetch(`${API_BASE}/races/${raceId}/lap-times`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch lap times: ${res.status}`);
  return res.json();
}

export async function fetchPitlaneEvents(
  raceId: number,
  acknowledged = false
): Promise<PitlaneEventsResponse | null> {
  const res = await fetch(
    `${API_BASE}/races/${raceId}/pitlane-events?acknowledged=${acknowledged}`
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch pitlane events: ${res.status}`);
  return res.json();
}

export async function acknowledgePitlaneEvent(
  raceId: number,
  eventId: number
): Promise<void> {
  const res = await fetch(
    `${API_BASE}/races/${raceId}/pitlane-events/${eventId}/acknowledge`,
    { method: 'POST' }
  );
  if (!res.ok) throw new Error(`Failed to acknowledge event: ${res.status}`);
}

export async function triggerScrape(
  speedhiveUrl: string,
  raceId?: number
): Promise<void> {
  const res = await fetch(`${API_BASE}/scrape/trigger`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: speedhiveUrl, raceId }),
  });
  if (!res.ok) throw new Error(`Failed to trigger scrape: ${res.status}`);
}
