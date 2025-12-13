import { useState, useEffect } from 'react';
import { fetchLapTimesTable } from '@/shared/api/raceResultsApi';
import type { LapTimesTableResponse } from '@/shared/types/raceResult';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

interface LapTimesPageProps {
  sessionId: string;
}

export function LapTimesPage({ sessionId }: LapTimesPageProps) {
  const [tableData, setTableData] = useState<LapTimesTableResponse | null>(null);
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
        const response = await fetchLapTimesTable(sessionId);
        if (response.success) {
          setTableData(response);
        } else {
          setError(response.error || 'Failed to fetch lap times table');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch lap times table');
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

  if (!tableData || tableData.data.length === 0) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="text-gray-600">No lap times data found</div>
      </div>
    );
  }

  // Transform data for DataTable
  // Each row represents a lap, columns are competitor numbers
  const tableRows = tableData.lapNumbers.map((lap, lapIndex) => {
    const row: Record<string, string | number> = {
      lap: lap
    };
    
    tableData.competitorNumbers.forEach((competitorNumber, competitorIndex) => {
      row[competitorNumber] = tableData.data[lapIndex]?.[competitorIndex] ?? null;
    });
    
    return row;
  });

  // Create dynamic columns for competitors
  const competitorColumns = tableData.competitorNumbers.map((competitorNumber) => (
    <Column
      key={competitorNumber}
      field={competitorNumber}
      header={competitorNumber}
      style={{ minWidth: '120px', textAlign: 'center' }}
      body={(rowData: Record<string, string | number>) => {
        const value = rowData[competitorNumber];
        return value ? (
          <span className="font-mono text-sm">{value as string}</span>
        ) : (
          <span className="text-gray-400">-</span>
        );
      }}
    />
  ));

  return (
    <div className="w-full h-full flex flex-col">
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-600 flex-shrink-0">
        <span>
          Showing lap times matrix: {tableData.lapNumbers.length} laps × {tableData.competitorNumbers.length} competitors
        </span>
        {isRefreshing && (
          <span className="flex items-center gap-1 text-blue-600">
            <span className="animate-spin">⟳</span>
            <span>Updating...</span>
          </span>
        )}
      </div>
      <div className="flex-1 overflow-hidden">
        <DataTable
          value={tableRows}
          className="p-datatable-sm h-full"
          scrollable
          scrollHeight="100%"
          stripedRows
          showGridlines
          size="small"
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
          field="lap"
          header="Lap"
          style={{ minWidth: '80px', fontWeight: 'bold', backgroundColor: '#f9fafb' }}
          frozen
          pt={{
            headerCell: { className: 'bg-gray-100 sticky left-0 z-10' },
            bodyCell: { className: 'bg-gray-50 sticky left-0 z-10 font-semibold' }
          }}
        />
        {competitorColumns}
        </DataTable>
      </div>
    </div>
  );
}

