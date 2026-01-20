import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Dialog, Select, TabPanel, TabView } from '@/shared/ui';
import { fetchRaces } from '@/features/races';
import { fetchKartsByRace, updateKart } from '@/features/karts';
import {
  fetchPitlaneConfig,
  fetchPitlaneCurrent,
  fetchPitlaneHistory,
  addKartToPitlane,
  removeKartFromPitlane,
  createPitlaneConfig,
  PitlaneConfigForm,
  PitlaneView,
  PitlaneEntryForm,
} from '@/features/pitlane';
import type { Race } from '@/shared/types/race';
import type { Kart } from '@/shared/types/kart';
import { KART_STATUS_COLORS, KART_STATUS_LABELS } from '@/shared/types/kart';
import type { PitlaneConfig, PitlaneCurrent, PitlaneHistory } from '@/shared/types/pitlane';

const STATUS_OPTIONS = Object.entries(KART_STATUS_LABELS).map(([value, label]) => ({
  value: Number(value),
  label,
  color: KART_STATUS_COLORS[Number(value)],
}));

export function PitlanePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [races, setRaces] = useState<Race[]>([]);
  const [karts, setKarts] = useState<Kart[]>([]);
  const [selectedRaceId, setSelectedRaceId] = useState<number | null>(null);
  const [pitlaneConfig, setPitlaneConfig] = useState<PitlaneConfig | null>(null);
  const [currentState, setCurrentState] = useState<PitlaneCurrent[]>([]);
  const [history, setHistory] = useState<PitlaneHistory[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialogs
  const [addKartDialogVisible, setAddKartDialogVisible] = useState(false);
  const [configDialogVisible, setConfigDialogVisible] = useState(false);
  const [removeDialogVisible, setRemoveDialogVisible] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<PitlaneCurrent | null>(null);

  // Form data
  const [addFormData, setAddFormData] = useState({
    teamId: null as number | null,
    lineNumber: 1,
  });
  const [configFormData, setConfigFormData] = useState({ linesCount: 4, queueSize: 1 });
  const [removeTeamId, setRemoveTeamId] = useState<number | null>(null);
  const [removeKartStatus, setRemoveKartStatus] = useState<number>(1);

  useEffect(() => {
    const loadRaces = async () => {
      const response = await fetchRaces();
      if (response.success && response.data) {
        setRaces(response.data);
        
        const raceIdParam = searchParams.get('raceId');
        if (raceIdParam) {
          setSelectedRaceId(parseInt(raceIdParam));
        } else if (response.data.length > 0) {
          setSelectedRaceId(response.data[0].id);
        }
      }
    };
    loadRaces();
  }, []);

  useEffect(() => {
    if (selectedRaceId) {
      loadData();
      setSearchParams({ raceId: selectedRaceId.toString() });
    }
  }, [selectedRaceId]);

  const loadData = async () => {
    if (!selectedRaceId) return;

    setLoading(true);
    try {
      const [configRes, kartsRes] = await Promise.all([
        fetchPitlaneConfig(selectedRaceId),
        fetchKartsByRace(selectedRaceId),
      ]);

      if (kartsRes.success && kartsRes.data) {
        setKarts(kartsRes.data);
      }

      if (configRes.success && configRes.data) {
        setPitlaneConfig(configRes.data);

        const [currentRes, historyRes] = await Promise.all([
          fetchPitlaneCurrent(configRes.data.id),
          fetchPitlaneHistory(configRes.data.id),
        ]);

        if (currentRes.success && currentRes.data) {
          setCurrentState(currentRes.data);
        }
        if (historyRes.success && historyRes.data) {
          setHistory(historyRes.data);
        }
      } else {
        setPitlaneConfig(null);
        setCurrentState([]);
        setHistory([]);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddKart = async () => {
    if (!pitlaneConfig || !addFormData.teamId) return;

    try {
      await addKartToPitlane({
        pitlaneConfigId: pitlaneConfig.id,
        teamId: addFormData.teamId,
        lineNumber: addFormData.lineNumber,
      });
      setAddKartDialogVisible(false);
      setAddFormData({ teamId: null, lineNumber: 1 });
      loadData();
    } catch (error) {
      console.error('Failed to add kart:', error);
    }
  };

  const handleRemoveKart = async () => {
    if (!selectedEntry) return;

    try {
      if (selectedEntry.kartId && removeKartStatus !== (selectedEntry.kart?.status ?? 1)) {
        await updateKart(selectedEntry.kartId, { status: removeKartStatus });
      }
      await removeKartFromPitlane(selectedEntry.id, removeTeamId ? { teamId: removeTeamId } : undefined);
      setRemoveDialogVisible(false);
      setSelectedEntry(null);
      setRemoveTeamId(null);
      setRemoveKartStatus(1);
      loadData();
    } catch (error) {
      console.error('Failed to remove kart:', error);
    }
  };

  const handleUpdateKartStatus = async () => {
    if (!selectedEntry) return;

    try {
      await updateKart(selectedEntry.kartId, { status: removeKartStatus });
      setRemoveDialogVisible(false);
      setSelectedEntry(null);
      setRemoveTeamId(null);
      setRemoveKartStatus(1);
      loadData();
    } catch (error) {
      console.error('Failed to update kart status:', error);
    }
  };

  const handleCreateConfig = async () => {
    if (!selectedRaceId) return;

    try {
      await createPitlaneConfig({
        raceId: selectedRaceId,
        linesCount: configFormData.linesCount,
        queueSize: configFormData.queueSize,
      });
      setConfigDialogVisible(false);
      loadData();
    } catch (error) {
      console.error('Failed to create config:', error);
    }
  };

  const openRemoveDialog = (entry: PitlaneCurrent) => {
    setSelectedEntry(entry);
    setRemoveTeamId(null);
    setRemoveKartStatus(entry.kart?.status ?? 1);
    setRemoveDialogVisible(true);
  };

  const selectedRace = races.find((r) => r.id === selectedRaceId);
  const raceTeams = selectedRace?.teams || [];
  const availableTeamsCount = raceTeams.filter((team) => {
    const teamKarts = karts.filter((kart) => kart.teamId === team.id);
    if (teamKarts.length === 0) {
      return false;
    }
    return teamKarts.some((kart) => !currentState.some((entry) => entry.kartId === kart.id));
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Pitlane</h1>
          <p className="text-slate-400">Manage pitlane entries</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={selectedRaceId}
            onChange={(e) => setSelectedRaceId(e.value)}
            options={races}
            optionLabel="name"
            optionValue="id"
            placeholder="Select Race"
            className="w-64"
          />
        </div>
      </div>

      {!selectedRaceId ? (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-12 text-center">
          <i className="pi pi-arrows-h text-4xl text-slate-600 mb-4" />
          <p className="text-slate-400">Select a race to view pitlane</p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center h-64">
          <i className="pi pi-spin pi-spinner text-4xl text-emerald-500" />
        </div>
      ) : !pitlaneConfig ? (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-12 text-center">
          <i className="pi pi-cog text-4xl text-slate-600 mb-4" />
          <p className="text-slate-400 mb-4">Pitlane not configured for this race</p>
          <Button
            label="Configure Pitlane"
            icon="pi pi-cog"
            onClick={() => setConfigDialogVisible(true)}
          />
        </div>
      ) : (
        <TabView>
          <TabPanel header="Current State">
            <PitlaneView
              config={pitlaneConfig}
              currentState={currentState}
              onAddKart={() => {
                setAddFormData({ teamId: null, lineNumber: 1 });
                setAddKartDialogVisible(true);
              }}
              onRemoveKart={openRemoveDialog}
              onLineClick={(lineNumber) => {
                setAddFormData({ teamId: null, lineNumber });
                setAddKartDialogVisible(true);
              }}
              availableTeamsCount={availableTeamsCount}
              teamsCount={raceTeams.length}
            />
          </TabPanel>

          <TabPanel header="History">
            {history.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500">No history yet</p>
              </div>
            ) : (
              <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-800/50">
                    <tr>
                      <th className="text-left px-6 py-4 text-slate-400 font-medium">Team</th>
                      <th className="text-left px-6 py-4 text-slate-400 font-medium">Kart</th>
                      <th className="text-left px-6 py-4 text-slate-400 font-medium">Line</th>
                      <th className="text-left px-6 py-4 text-slate-400 font-medium">Entered</th>
                      <th className="text-left px-6 py-4 text-slate-400 font-medium">Exited</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.slice(0, 50).map((entry) => (
                      <tr key={entry.id} className="border-t border-slate-800">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold">
                              {entry.team?.number || '?'}
                            </div>
                            <span className="text-white">{entry.team?.name || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-300">#{entry.kartId}</td>
                        <td className="px-6 py-4 text-slate-300">{entry.lineNumber}</td>
                        <td className="px-6 py-4 text-slate-400">
                          {new Date(entry.enteredAt).toLocaleTimeString()}
                        </td>
                        <td className="px-6 py-4 text-slate-400">
                          {new Date(entry.exitedAt).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabPanel>
        </TabView>
      )}

      {/* Add Kart Dialog */}
      {pitlaneConfig && (
        <PitlaneEntryForm
          visible={addKartDialogVisible}
          onHide={() => setAddKartDialogVisible(false)}
          config={pitlaneConfig}
          formData={addFormData}
          onFormChange={setAddFormData}
          onAdd={handleAddKart}
          teams={raceTeams}
        />
      )}

      {/* Remove Kart Dialog */}
      <Dialog
        visible={removeDialogVisible}
        onHide={() => setRemoveDialogVisible(false)}
        header="Remove Kart from Pitlane"
        style={{ width: '400px' }}
      >
        <div className="flex flex-col gap-4">
          <p className="text-slate-300">
            Remove <strong>Kart #{selectedEntry?.kartId}</strong> from the pitlane?
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Kart Status
            </label>
            <Select
              value={removeKartStatus}
              onChange={(e) => setRemoveKartStatus(e.value ?? 1)}
              options={STATUS_OPTIONS}
              optionLabel="label"
              optionValue="value"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Assign to Team (optional)
            </label>
            <Select
              value={removeTeamId}
              onChange={(e) => setRemoveTeamId(e.value)}
              options={[{ id: null, name: 'None' }, ...raceTeams]}
              optionLabel="name"
              optionValue="id"
              className="w-full"
            />
            <p className="text-sm text-slate-500 mt-1">
              The kart will be assigned to this team after removal
            </p>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              label="Cancel"
              severity="secondary"
              onClick={() => setRemoveDialogVisible(false)}
            />
            <Button
              label="Update Status"
              severity="secondary"
              onClick={handleUpdateKartStatus}
              disabled={!selectedEntry}
            />
            <Button
              label="Remove"
              severity="danger"
              onClick={handleRemoveKart}
            />
          </div>
        </div>
      </Dialog>

      {/* Config Dialog */}
      <PitlaneConfigForm
        visible={configDialogVisible}
        onHide={() => setConfigDialogVisible(false)}
        formData={configFormData}
        onFormChange={setConfigFormData}
        onCreate={handleCreateConfig}
      />
    </div>
  );
}
