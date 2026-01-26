import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Dialog, InputNumber, Select } from '@/shared/ui';
import { fetchKartsByRace, updateKart, createKartsBulk, KartList, KartEditModal } from '@/features/karts';
import {
  addKartToPitlane,
  fetchPitlaneConfig,
  fetchPitlaneCurrent,
  PitlaneEntryForm,
  removeKartFromPitlane,
} from '@/features/pitlane';
import { fetchRaces } from '@/features/races';
import type { Kart } from '@/shared/types/kart';
import { KART_STATUS_COLORS } from '@/shared/types/kart';
import type { Race } from '@/shared/types/race';
import type { PitlaneConfig, PitlaneCurrent } from '@/shared/types/pitlane';

const STATUS_OPTIONS = [
  { value: 1, label: 'Good (Green)', color: '#22c55e' },
  { value: 2, label: 'Warning (Yellow)', color: '#eab308' },
  { value: 3, label: 'Caution (Orange)', color: '#f97316' },
  { value: 4, label: 'Critical (Red)', color: '#ef4444' },
  { value: 5, label: 'Out of Service (Black)', color: '#000000' },
];

export function KartsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [races, setRaces] = useState<Race[]>([]);
  const [karts, setKarts] = useState<Kart[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRaceId, setSelectedRaceId] = useState<number | null>(null);
  const [pitlaneConfig, setPitlaneConfig] = useState<PitlaneConfig | null>(null);
  const [pitlaneCurrent, setPitlaneCurrent] = useState<PitlaneCurrent[]>([]);
  
  // Dialogs
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [addKartsDialogVisible, setAddKartsDialogVisible] = useState(false);
  const [addKartDialogVisible, setAddKartDialogVisible] = useState(false);
  const [removeDialogVisible, setRemoveDialogVisible] = useState(false);
  const [selectedKart, setSelectedKart] = useState<Kart | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<PitlaneCurrent | null>(null);
  
  // Form data
  const [editFormData, setEditFormData] = useState({ status: 1, teamId: null as number | null });
  const [kartsCount, setKartsCount] = useState(10);
  const [addFormData, setAddFormData] = useState({
    teamId: null as number | null,
    lineNumber: 1,
  });
  const [removeTeamId, setRemoveTeamId] = useState<number | null>(null);
  const [removeKartStatus, setRemoveKartStatus] = useState<number>(1);

  useEffect(() => {
    const loadInitialData = async () => {
      const racesRes = await fetchRaces();

      if (racesRes.success && racesRes.data) {
        setRaces(racesRes.data);
        
        // Check for raceId in URL params
        const raceIdParam = searchParams.get('raceId');
        if (raceIdParam) {
          setSelectedRaceId(parseInt(raceIdParam));
        } else if (racesRes.data.length > 0) {
          setSelectedRaceId(racesRes.data[0].id);
        }
      }
    };

    loadInitialData();
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
      const [kartsRes, configRes] = await Promise.all([
        fetchKartsByRace(selectedRaceId),
        fetchPitlaneConfig(selectedRaceId),
      ]);

      if (kartsRes.success && kartsRes.data) {
        setKarts(kartsRes.data);
      }

      if (configRes.success && configRes.data) {
        setPitlaneConfig(configRes.data);

        const currentRes = await fetchPitlaneCurrent(configRes.data.id);
        if (currentRes.success && currentRes.data) {
          setPitlaneCurrent(currentRes.data);
        } else {
          setPitlaneCurrent([]);
        }
      } else {
        setPitlaneConfig(null);
        setPitlaneCurrent([]);
      }
    } catch (error) {
      console.error('Failed to load karts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKartClick = (kart: Kart) => {
    setSelectedKart(kart);
    setEditFormData({ status: kart.status, teamId: kart.teamId });
    setEditDialogVisible(true);
  };

  const handleSaveKart = async () => {
    if (!selectedKart) return;
    
    try {
      console.log('handleSaveKart', { kartId: selectedKart.id, payload: editFormData });
      await updateKart(selectedKart.id, editFormData);
      setEditDialogVisible(false);
      loadData();
    } catch (error) {
      console.error('Failed to update kart:', error);
    }
  };

  const handleAddKarts = async () => {
    if (!selectedRaceId || kartsCount < 1) return;
    
    try {
      await createKartsBulk({ raceId: selectedRaceId, count: kartsCount });
      setAddKartsDialogVisible(false);
      loadData();
    } catch (error) {
      console.error('Failed to add karts:', error);
    }
  };

  const handleAddKartToPitlane = async () => {
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
      console.error('Failed to add kart to pitlane:', error);
    }
  };

  const handleRemoveKartFromPitlane = async () => {
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
      console.error('Failed to remove kart from pitlane:', error);
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

  const openRemoveDialog = (entry: PitlaneCurrent) => {
    setSelectedEntry(entry);
    setRemoveTeamId(null);
    setRemoveKartStatus(entry.kart?.status ?? 1);
    setRemoveDialogVisible(true);
  };

  const selectedRace = races.find((r) => r.id === selectedRaceId);
  const raceTeams = selectedRace?.raceTeams || [];
  const teamOptions = raceTeams.map((entry) => ({
    id: entry.teamId,
    label: `${entry.number ?? '?'} - ${entry.team.name}`,
  }));
  const availableTeamsCount = raceTeams.filter((entry) => {
    const teamKarts = karts.filter((kart) => kart.teamId === entry.teamId);
    if (teamKarts.length === 0) {
      return false;
    }
    return teamKarts.some((kart) => !pitlaneCurrent.some((entry) => entry.kartId === kart.id));
  }).length;
  const getStatusColor = (status?: number) =>
    KART_STATUS_COLORS[status ?? 1] || KART_STATUS_COLORS[1];

  const lineData: Record<number, PitlaneCurrent[]> = {};
  if (pitlaneConfig) {
    for (let i = 1; i <= pitlaneConfig.linesCount; i++) {
      lineData[i] = pitlaneCurrent
        .filter((entry) => entry.lineNumber === i)
        .sort((a, b) => a.queuePosition - b.queuePosition);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Karts</h1>
          <p className="text-slate-400">Manage kart statuses and team assignments</p>
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
          {selectedRaceId && (
            <Button
              label="Add Karts"
              icon="pi pi-plus"
              onClick={() => setAddKartsDialogVisible(true)}
            />
          )}
        </div>
      </div>

      {/* Status Legend */}
      <div className="flex flex-wrap items-center gap-8 p-5 bg-slate-900 rounded-lg border border-slate-800">
        <span className="text-slate-400 text-sm">Status:</span>
        {STATUS_OPTIONS.map((status) => (
          <div key={status.value} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: status.color }}
            />
            <span className="text-slate-300 text-sm">{status.value}</span>
          </div>
        ))}
      </div>

      {selectedRaceId && pitlaneConfig ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Pitlane</h2>
              <p className="text-slate-400 text-sm">Current state</p>
            </div>
            <Button
              label="Add Kart to Pitlane"
              icon="pi pi-plus"
              onClick={() => {
                setAddFormData({ teamId: null, lineNumber: 1 });
                setAddKartDialogVisible(true);
              }}
              disabled={availableTeamsCount === 0 || raceTeams.length === 0}
            />
          </div>
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(lineData).map(([lineNumber, entries]) => (
                <div
                  key={lineNumber}
                  className="bg-slate-900/50 rounded-lg border border-slate-800 p-3"
                  onClick={() => {
                    setAddFormData({ teamId: null, lineNumber: Number(lineNumber) });
                    setAddKartDialogVisible(true);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setAddFormData({ teamId: null, lineNumber: Number(lineNumber) });
                      setAddKartDialogVisible(true);
                    }
                  }}
                >
                  <div className="text-sm text-slate-400 mb-3">Line {lineNumber}</div>
                  {entries.length === 0 ? (
                    <div className="text-slate-600 text-sm">Empty</div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {entries.map((entry) => (
                        <button
                          key={entry.id}
                          type="button"
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold transition-transform hover:scale-105"
                          style={{
                            backgroundColor: getStatusColor(entry.kart?.status),
                            boxShadow: `0 0 12px ${getStatusColor(entry.kart?.status)}cc`,
                          }}
                          onClick={(event) => {
                            event.stopPropagation();
                            openRemoveDialog(entry);
                          }}
                          title={`Kart #${entry.kartId}`}
                        >
                          {entry.kartId}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : selectedRaceId ? (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 text-center">
          <p className="text-slate-400">Pitlane not configured for this race</p>
        </div>
      ) : null}

      {!selectedRaceId ? (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-12 text-center">
          <i className="pi pi-car text-4xl text-slate-600 mb-4" />
          <p className="text-slate-400">Select a race to view karts</p>
        </div>
      ) : (
        <KartList
          karts={karts}
          loading={loading}
          onKartClick={handleKartClick}
        />
      )}

      {/* Edit Kart Dialog */}
      <KartEditModal
        visible={editDialogVisible}
        onHide={() => setEditDialogVisible(false)}
        kart={selectedKart}
        formData={editFormData}
        onFormChange={setEditFormData}
        onSave={handleSaveKart}
        teams={teamOptions}
      />

      {/* Add Kart to Pitlane Dialog */}
      {pitlaneConfig && (
        <PitlaneEntryForm
          visible={addKartDialogVisible}
          onHide={() => setAddKartDialogVisible(false)}
          config={pitlaneConfig}
          formData={addFormData}
          onFormChange={setAddFormData}
          onAdd={handleAddKartToPitlane}
          teams={teamOptions}
        />
      )}

      {/* Remove Kart from Pitlane Dialog */}
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
              options={[{ id: null, label: 'None' }, ...teamOptions]}
              optionLabel="label"
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
              onClick={handleRemoveKartFromPitlane}
            />
          </div>
        </div>
      </Dialog>

      {/* Add Karts Dialog */}
      <Dialog
        visible={addKartsDialogVisible}
        onHide={() => setAddKartsDialogVisible(false)}
        header="Add Karts"
        style={{ width: '400px' }}
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Number of Karts
            </label>
            <InputNumber
              value={kartsCount}
              onValueChange={(e) => setKartsCount(e.value || 1)}
              min={1}
              max={100}
              className="w-full"
            />
            <p className="text-sm text-slate-500 mt-1">
              All karts will be created with status 1 (green) and unassigned
            </p>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              label="Cancel"
              severity="secondary"
              onClick={() => setAddKartsDialogVisible(false)}
            />
            <Button
              label="Create Karts"
              onClick={handleAddKarts}
              disabled={kartsCount < 1}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
