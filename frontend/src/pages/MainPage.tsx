import { useState } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { RaceResultsPage } from './RaceResultsPage';
import { LapTimesPage } from './LapTimesPage';

export function MainPage() {
  const [sessionId, setSessionId] = useState('0409BF1AD0B97F05-2147486933-1073748974');
  const [currentSessionId, setCurrentSessionId] = useState(sessionId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentSessionId(sessionId);
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <div className="flex-shrink-0 px-4 py-4 bg-white border-b border-gray-200">
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Race Statistics</h1>
          <p className="text-gray-600">View race results and lap times analysis</p>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label htmlFor="sessionId" className="block text-sm font-semibold text-gray-700 mb-2">
                Session ID:
              </label>
              <input
                id="sessionId"
                type="text"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Enter session ID"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors shadow-sm"
            >
              Load Data
            </button>
          </div>
        </form>
      </div>

      <div className="flex-1 bg-white overflow-hidden">
        <TabView className="custom-tabview h-full flex flex-col">
          <TabPanel header="Lap Times Matrix" leftIcon="pi pi-table">
            <div className="h-full p-4 flex flex-col">
              <LapTimesPage sessionId={currentSessionId} />
            </div>
          </TabPanel>
          <TabPanel header="Race Results" leftIcon="pi pi-list">
            <div className="h-full p-4 flex flex-col">
              <RaceResultsPage sessionId={currentSessionId} />
            </div>
          </TabPanel>
        </TabView>
      </div>
    </div>
  );
}

