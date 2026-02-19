import { RaceResult } from '../entities/RaceResult';
import { ILapTimesService, LapTimesTable } from './ILapTimesService';

/** Parse lap time string (e.g. "1:23.456" or "23.456") to milliseconds. Returns null if unparseable. */
function parseLapTimeToMs(lapTime: string | null): number | null {
  if (!lapTime || typeof lapTime !== 'string') return null;
  const trimmed = lapTime.trim().toUpperCase();
  if (trimmed === 'IN PIT' || trimmed === '') return null;
  const parts = trimmed.split(':');
  let totalMs = 0;
  if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10);
    const secParts = parts[1].split('.');
    const seconds = parseInt(secParts[0], 10);
    const ms = secParts[1] ? parseInt(secParts[1].padEnd(3, '0').slice(0, 3), 10) : 0;
    if (isNaN(minutes) || isNaN(seconds)) return null;
    totalMs = minutes * 60000 + seconds * 1000 + ms;
  } else if (parts.length === 1) {
    const secParts = parts[0].split('.');
    const seconds = parseInt(secParts[0], 10);
    const ms = secParts[1] ? parseInt(secParts[1].padEnd(3, '0').slice(0, 3), 10) : 0;
    if (isNaN(seconds)) return null;
    totalMs = seconds * 1000 + ms;
  } else {
    return null;
  }
  return totalMs > 0 ? totalMs : null;
}

export class LapTimesService implements ILapTimesService {
  buildLapTimesTable(results: RaceResult[]): LapTimesTable {
    if (results.length === 0) {
      return {
        lapNumbers: [],
        competitorNumbers: [],
        data: []
      };
    }

    // Get all unique lap numbers and sort them
    const lapNumbersSet = new Set<number>();
    const competitorNumbersSet = new Set<string>();

    // Map competitorNumber -> competitorName (use first occurrence)
    const competitorNumberToName = new Map<string, string>();
    for (const result of results) {
      if (result.laps !== null && result.laps !== undefined) {
        lapNumbersSet.add(result.laps);
      }
      if (result.competitorNumber !== null && result.competitorNumber !== undefined) {
        competitorNumbersSet.add(result.competitorNumber);
        if (
          result.competitorName &&
          result.competitorName.trim() &&
          !competitorNumberToName.has(result.competitorNumber)
        ) {
          competitorNumberToName.set(result.competitorNumber, result.competitorName.trim());
        }
      }
    }

    // Sort lap numbers in descending order (highest lap number first)
    const lapNumbers = Array.from(lapNumbersSet).sort((a, b) => b - a);
    
    // Initially sort competitor numbers (will be re-sorted later by number of laps)
    const competitorNumbers = Array.from(competitorNumbersSet).sort((a, b) => {
      // Try to sort as numbers if possible, otherwise as strings
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return a.localeCompare(b);
    });

    // Create a map to store the first occurrence of each (lap, competitorNumber) combination
    // Key: `${lap}-${competitorNumber}`, Value: { timestamp, lastLapTime }
    const firstOccurrenceMap = new Map<string, { timestamp: string; lastLapTime: string | null }>();

    // Find the first timestamp for each (lap, competitorNumber) combination
    for (const result of results) {
      if (result.laps === null || result.laps === undefined) continue;
      if (result.competitorNumber === null || result.competitorNumber === undefined) continue;

      const key = `${result.laps}-${result.competitorNumber}`;
      const existing = firstOccurrenceMap.get(key);

      if (!existing || result.timestamp < existing.timestamp) {
        firstOccurrenceMap.set(key, {
          timestamp: result.timestamp,
          lastLapTime: result.lastLapTime
        });
      }
    }

    // Compute average lap time (ms) per competitor from firstOccurrenceMap
    const competitorAvgLapMs = new Map<string, number>();
    for (const compNum of competitorNumbers) {
      const lapTimes: number[] = [];
      for (const lap of lapNumbers) {
        const key = `${lap}-${compNum}`;
        const occ = firstOccurrenceMap.get(key);
        const ms = occ ? parseLapTimeToMs(occ.lastLapTime) : null;
        if (ms !== null) lapTimes.push(ms);
      }
      if (lapTimes.length > 0) {
        const avg = lapTimes.reduce((a, b) => a + b, 0) / lapTimes.length;
        competitorAvgLapMs.set(compNum, avg);
      }
    }

    // Sort by best average lap time (ascending = fastest first), fallback to max laps then number
    const competitorMaxLaps = new Map<string, number>();
    for (const result of results) {
      if (result.competitorNumber == null || result.laps == null) continue;
      const cur = competitorMaxLaps.get(result.competitorNumber) || 0;
      if (result.laps > cur) competitorMaxLaps.set(result.competitorNumber, result.laps);
    }

    const sortedCompetitorNumbers = [...competitorNumbers].sort((a, b) => {
      const avgA = competitorAvgLapMs.get(a);
      const avgB = competitorAvgLapMs.get(b);
      if (avgA != null && avgB != null) return avgA - avgB;
      if (avgA != null) return -1;
      if (avgB != null) return 1;
      const maxLapsA = competitorMaxLaps.get(a) || 0;
      const maxLapsB = competitorMaxLaps.get(b) || 0;
      if (maxLapsB !== maxLapsA) return maxLapsB - maxLapsA;
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });

    // Build the matrix: data[lapIndex][competitorIndex] = lastLapTime
    const data: (string | null)[][] = [];

    for (let lapIndex = 0; lapIndex < lapNumbers.length; lapIndex++) {
      const lap = lapNumbers[lapIndex];
      const row: (string | null)[] = [];

      for (let competitorIndex = 0; competitorIndex < sortedCompetitorNumbers.length; competitorIndex++) {
        const competitorNumber = sortedCompetitorNumbers[competitorIndex];
        const key = `${lap}-${competitorNumber}`;
        const occurrence = firstOccurrenceMap.get(key);

        row.push(occurrence?.lastLapTime ?? null);
      }

      data.push(row);
    }

    const competitorNames = sortedCompetitorNumbers.map(
      (num) => competitorNumberToName.get(num) || `Team ${num}`
    );

    return {
      lapNumbers,
      competitorNumbers: sortedCompetitorNumbers,
      competitorNames,
      data
    };
  }
}

