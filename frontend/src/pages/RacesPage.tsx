import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/ui';
import { fetchRaces, createRace, deleteRace, RaceList, RaceForm } from '@/features/races';
import { useCurrentRace } from '@/shared/context/CurrentRaceContext';
import type { Race } from '@/shared/types/race';

export function RacesPage() {
  const navigate = useNavigate();
  const { setCurrentRaceId } = useCurrentRace();
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [formData, setFormData] = useState({ name: '', date: null as Date | null });

  const loadRaces = async () => {
    setLoading(true);
    try {
      const response = await fetchRaces();
      if (response.success && response.data) {
        setRaces(response.data);
      }
    } catch (error) {
      console.error('Failed to load races:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRaces();
  }, []);

  const openCreateDialog = () => {
    setFormData({ name: '', date: new Date() });
    setDialogVisible(true);
  };

  const handleCreate = async () => {
    if (!formData.date) return;
    
    try {
      const dateStr = formData.date.toISOString().split('T')[0];
      await createRace({ name: formData.name, date: dateStr });
      setDialogVisible(false);
      loadRaces();
    } catch (error) {
      console.error('Failed to create race:', error);
    }
  };

  const handleDelete = async (race: Race, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete race "${race.name}"?`)) {
      try {
        await deleteRace(race.id);
        loadRaces();
      } catch (error) {
        console.error('Failed to delete race:', error);
      }
    }
  };

  const handleRaceClick = async (race: Race) => {
    await setCurrentRaceId(race.id);
    navigate(`/races/${race.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Races</h1>
          <p className="text-slate-400">Manage race events</p>
        </div>
        <Button
          label="Create Race"
          icon="pi pi-plus"
          onClick={openCreateDialog}
        />
      </div>

      <RaceList
        races={races}
        loading={loading}
        onRaceClick={handleRaceClick}
        onDelete={handleDelete}
      />

      <RaceForm
        visible={dialogVisible}
        onHide={() => setDialogVisible(false)}
        formData={formData}
        onFormChange={setFormData}
        onCreate={handleCreate}
      />
    </div>
  );
}
