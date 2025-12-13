import { RaceResult } from '../entities/RaceResult';
import { ILapTimesService, LapTimesTable } from './ILapTimesService';

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

    // Collect all unique laps and competitor numbers
    for (const result of results) {
      if (result.laps !== null && result.laps !== undefined) {
        lapNumbersSet.add(result.laps);
      }
      if (result.competitorNumber !== null && result.competitorNumber !== undefined) {
        competitorNumbersSet.add(result.competitorNumber);
      }
    }

    const lapNumbers = Array.from(lapNumbersSet).sort((a, b) => a - b);
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

    // Build the matrix: data[lapIndex][competitorIndex] = lastLapTime
    const data: (string | null)[][] = [];

    for (let lapIndex = 0; lapIndex < lapNumbers.length; lapIndex++) {
      const lap = lapNumbers[lapIndex];
      const row: (string | null)[] = [];

      for (let competitorIndex = 0; competitorIndex < competitorNumbers.length; competitorIndex++) {
        const competitorNumber = competitorNumbers[competitorIndex];
        const key = `${lap}-${competitorNumber}`;
        const occurrence = firstOccurrenceMap.get(key);

        row.push(occurrence?.lastLapTime ?? null);
      }

      data.push(row);
    }

    return {
      lapNumbers,
      competitorNumbers,
      data
    };
  }
}

