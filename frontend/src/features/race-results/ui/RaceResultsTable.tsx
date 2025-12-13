import { useState, useEffect } from 'react';
import { fetchLatestResults } from '@/shared/api/raceResultsApi';
import type { RaceResult } from '@/shared/types/raceResult';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

interface RaceResultsTableProps {
  sessionId: string;
}

export function RaceResultsTable({ sessionId }: RaceResultsTableProps) {
  const [results, setResults] = useState<RaceResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setError('Session ID is required');
      setLoading(false);
      return;
    }

    // Function to fetch data
    const fetchData = async (isInitial = false) => {
      try {
        if (!isInitial) {
          setIsRefreshing(true);
        }
        setError(null);
        const response = await fetchLatestResults(sessionId);
        if (response.success) {
          setResults(response.data);
        } else {
          setError(response.error || 'Failed to fetch results');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch results');
      } finally {
        if (isInitial) {
          setLoading(false);
        }
        setIsRefreshing(false);
      }
    };

    // Fetch immediately
    fetchData(true);

    // Set up polling every second
    const intervalId = setInterval(() => {
      fetchData(false);
    }, 1000);

    // Cleanup interval on unmount or sessionId change
    return () => {
      clearInterval(intervalId);
    };
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="text-red-600 font-semibold">Error: {error}</div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="text-gray-600">No results found</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-600 flex-shrink-0">
        <span>Showing {results.length} competitors</span>
        {isRefreshing && (
          <span className="flex items-center gap-1 text-blue-600">
            <span className="animate-spin">⟳</span>
            <span>Updating...</span>
          </span>
        )}
      </div>
      <div className="flex-1 overflow-hidden">
        <DataTable
          value={results}
          className="p-datatable-sm h-full"
          scrollable
          scrollHeight="100%"
          stripedRows
          showGridlines
          size="small"
          loading={loading}
          pt={{
            root: { className: 'border border-gray-200 rounded-lg shadow-sm h-full flex flex-col' },
            header: { className: 'bg-gray-50 flex-shrink-0' },
            headerCell: { className: 'font-semibold text-gray-700 py-3 px-4' },
            bodyCell: { className: 'py-2 px-4' },
            row: { className: 'hover:bg-gray-50 transition-colors' },
            wrapper: { className: 'flex-1 overflow-auto' }
          }}
        >
        <Column
          field="position"
          header="Position"
          style={{ minWidth: '100px' }}
          body={(rowData: RaceResult) => rowData.position ?? '-'}
        />
        <Column
          field="competitorNumber"
          header="Number"
          style={{ minWidth: '100px' }}
          body={(rowData: RaceResult) => rowData.competitorNumber ?? '-'}
        />
        <Column
          field="competitorName"
          header="Name"
          style={{ minWidth: '200px' }}
          body={(rowData: RaceResult) => rowData.competitorName ?? '-'}
        />
        <Column
          field="laps"
          header="Laps"
          style={{ minWidth: '100px', textAlign: 'center' }}
          body={(rowData: RaceResult) => rowData.laps ?? '-'}
        />
        <Column
          field="lastLapTime"
          header="Last Lap"
          style={{ minWidth: '120px', textAlign: 'center' }}
          body={(rowData: RaceResult) => (
            <span className="font-mono text-sm">{rowData.lastLapTime ?? '-'}</span>
          )}
        />
        <Column
          field="bestLapTime"
          header="Best Lap"
          style={{ minWidth: '120px', textAlign: 'center' }}
          body={(rowData: RaceResult) => (
            <span className="font-mono text-sm font-semibold text-blue-600">
              {rowData.bestLapTime ?? '-'}
            </span>
          )}
        />
        <Column
          field="gap"
          header="Gap"
          style={{ minWidth: '100px', textAlign: 'center' }}
          body={(rowData: RaceResult) => rowData.gap ?? '-'}
        />
        <Column
          field="diff"
          header="Diff"
          style={{ minWidth: '100px', textAlign: 'center' }}
          body={(rowData: RaceResult) => rowData.diff ?? '-'}
        />
        </DataTable>
      </div>
    </div>
  );
}

