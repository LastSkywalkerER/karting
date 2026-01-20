import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Dialog, InputNumber, Select } from '@/shared/ui';
import { fetchKartsByRace, updateKart, createKartsBulk, KartList, KartEditModal } from '@/features/karts';
import { fetchRaces } from '@/features/races';
import type { Kart } from '@/shared/types/kart';
import type { Race } from '@/shared/types/race';

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
  
  // Dialogs
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [addKartsDialogVisible, setAddKartsDialogVisible] = useState(false);
  const [selectedKart, setSelectedKart] = useState<Kart | null>(null);
  
  // Form data
  const [editFormData, setEditFormData] = useState({ status: 1, teamId: null as number | null });
  const [kartsCount, setKartsCount] = useState(10);

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
      loadKarts();
      setSearchParams({ raceId: selectedRaceId.toString() });
    }
  }, [selectedRaceId]);

  const loadKarts = async () => {
    if (!selectedRaceId) return;
    
    setLoading(true);
    try {
      const response = await fetchKartsByRace(selectedRaceId);
      if (response.success && response.data) {
        setKarts(response.data);
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
      await updateKart(selectedKart.id, editFormData);
      setEditDialogVisible(false);
      loadKarts();
    } catch (error) {
      console.error('Failed to update kart:', error);
    }
  };

  const handleAddKarts = async () => {
    if (!selectedRaceId || kartsCount < 1) return;
    
    try {
      await createKartsBulk({ raceId: selectedRaceId, count: kartsCount });
      setAddKartsDialogVisible(false);
      loadKarts();
    } catch (error) {
      console.error('Failed to add karts:', error);
    }
  };

  const selectedRace = races.find(r => r.id === selectedRaceId);
  const raceTeams = selectedRace?.teams || [];

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
        teams={raceTeams}
      />

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
