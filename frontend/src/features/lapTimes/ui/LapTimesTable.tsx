import { useState, useEffect, useCallback } from 'react';
import { fetchLapTimes } from '../api/lapTimesApi';

interface LapTimesTableProps {
  raceId: number;
  onPitCellClick?: (teamNumber: string, lapNumber: number) => void;
}

const POLL_INTERVAL = 5000;

export function LapTimesTable({
  raceId,
  onPitCellClick,
}: LapTimesTableProps) {
  const [lapNumbers, setLapNumbers] = useState<number[]>([]);
  const [competitorNumbers, setCompetitorNumbers] = useState<string[]>([]);
  const [data, setData] = useState<(string | null)[][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await fetchLapTimes(raceId);
      if (result && result.success) {
        setLapNumbers(result.lapNumbers);
        setCompetitorNumbers(result.competitorNumbers);
        setData(result.data);
        setError(null);
      } else {
        setLapNumbers([]);
        setCompetitorNumbers([]);
        setData([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [raceId]);

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <i className="pi pi-spin pi-spinner text-2xl text-emerald-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-400 py-4">
        {error}
        <button
          type="button"
          onClick={load}
          className="ml-2 text-emerald-400 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (competitorNumbers.length === 0) {
    return (
      <p className="text-slate-500 py-8 text-center">
        No lap data yet. Scraping may not have started.
      </p>
    );
  }

  const isPit = (val: string | null) =>
    val && val.trim().toUpperCase() === 'IN PIT';

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-slate-800 border border-slate-700 px-2 py-2 text-left text-slate-300 font-medium min-w-[60px]">
              Lap
            </th>
            {competitorNumbers.map((num) => (
              <th
                key={num}
                className="border border-slate-700 px-2 py-2 text-center text-slate-300 font-medium min-w-[80px]"
              >
                {num}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lapNumbers.map((lap, lapIdx) => (
            <tr key={lap}>
              <td className="sticky left-0 z-10 bg-slate-800 border border-slate-700 px-2 py-1.5 text-slate-300 font-medium">
                {lap}
              </td>
              {competitorNumbers.map((_, compIdx) => {
                const cellVal = data[lapIdx]?.[compIdx] ?? null;
                const inPit = isPit(cellVal);
                return (
                  <td
                    key={compIdx}
                    className={`border border-slate-700 px-2 py-1.5 text-center ${
                      inPit
                        ? 'bg-amber-900/30 text-amber-400 cursor-pointer hover:bg-amber-900/50'
                        : 'text-slate-300'
                    }`}
                    onClick={
                      inPit && onPitCellClick
                        ? () => onPitCellClick(competitorNumbers[compIdx], lap)
                        : undefined
                    }
                  >
                    {cellVal || '-'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
