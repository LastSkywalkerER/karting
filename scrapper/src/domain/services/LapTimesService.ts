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

    // Find maximum laps value for each competitor from original results
    const competitorMaxLaps = new Map<string, number>();
    for (const result of results) {
      if (result.competitorNumber === null || result.competitorNumber === undefined) continue;
      if (result.laps === null || result.laps === undefined) continue;
      
      const currentMax = competitorMaxLaps.get(result.competitorNumber) || 0;
      if (result.laps > currentMax) {
        competitorMaxLaps.set(result.competitorNumber, result.laps);
      }
    }

    // Sort competitor numbers by maximum laps value (descending), then by competitor number if equal
    const sortedCompetitorNumbers = [...competitorNumbers].sort((a, b) => {
      const maxLapsA = competitorMaxLaps.get(a) || 0;
      const maxLapsB = competitorMaxLaps.get(b) || 0;
      
      if (maxLapsB !== maxLapsA) {
        return maxLapsB - maxLapsA; // Descending order
      }
      
      // If equal max laps, sort by competitor number
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
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

    return {
      lapNumbers,
      competitorNumbers: sortedCompetitorNumbers,
      data
    };
  }
}

