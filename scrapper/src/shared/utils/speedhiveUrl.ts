/**
 * SpeedHive URL validation and session ID extraction.
 * Pattern: https://speedhive.mylaps.com/livetiming/{transponderId}-{eventId}/sessions/{sessionId}
 */
const SPEEDHIVE_URL_REGEX =
  /^https:\/\/speedhive\.mylaps\.com\/livetiming\/[^/]+\/sessions\/[a-zA-Z0-9_-]+$/;

export function isValidSpeedhiveUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return SPEEDHIVE_URL_REGEX.test(url.trim());
}

export function extractSessionIdFromUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!SPEEDHIVE_URL_REGEX.test(trimmed)) return null;
  const match = trimmed.match(/\/sessions\/([a-zA-Z0-9_-]+)$/);
  return match ? match[1] : null;
}
