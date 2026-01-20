import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Dialog, InputNumber, Select } from '@/shared/ui';
import { fetchRaceById, addTeamToRace, removeTeamFromRace, RaceDetail } from '@/features/races';
import { fetchTeams } from '@/features/teams';
import { fetchKartsByRace, createKartsBulk } from '@/features/karts';
import { fetchPitlaneConfig, createPitlaneConfig, PitlaneConfigForm } from '@/features/pitlane';
import type { Race } from '@/shared/types/race';
import type { Team } from '@/shared/types/team';
import type { Kart } from '@/shared/types/kart';
import type { PitlaneConfig } from '@/shared/types/pitlane';

export function RaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [race, setRace] = useState<Race | null>(null);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [karts, setKarts] = useState<Kart[]>([]);
  const [pitlaneConfig, setPitlaneConfig] = useState<PitlaneConfig | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Dialogs
  const [addTeamDialogVisible, setAddTeamDialogVisible] = useState(false);
  const [addKartsDialogVisible, setAddKartsDialogVisible] = useState(false);
  const [pitlaneConfigDialogVisible, setPitlaneConfigDialogVisible] = useState(false);
  
  // Form data
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [kartsCount, setKartsCount] = useState<number>(10);
  const [pitlaneFormData, setPitlaneFormData] = useState({ linesCount: 4, queueSize: 1 });

  const loadData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const [raceRes, teamsRes, kartsRes, pitlaneRes] = await Promise.all([
        fetchRaceById(parseInt(id)),
        fetchTeams(),
        fetchKartsByRace(parseInt(id)),
        fetchPitlaneConfig(parseInt(id)),
      ]);

      if (raceRes.success && raceRes.data) {
        setRace(raceRes.data);
      }
      if (teamsRes.success && teamsRes.data) {
        setAllTeams(teamsRes.data);
      }
      if (kartsRes.success && kartsRes.data) {
        setKarts(kartsRes.data);
      }
      if (pitlaneRes.success && pitlaneRes.data) {
        setPitlaneConfig(pitlaneRes.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const availableTeams = allTeams.filter(
    (team) => !race?.teams?.some((t) => t.id === team.id)
  );

  const handleAddTeam = async () => {
    if (!race || !selectedTeamId) return;
    
    try {
      await addTeamToRace(race.id, selectedTeamId);
      setAddTeamDialogVisible(false);
      setSelectedTeamId(null);
      loadData();
    } catch (error) {
      console.error('Failed to add team:', error);
    }
  };

  const handleRemoveTeam = async (teamId: number) => {
    if (!race) return;
    
    try {
      await removeTeamFromRace(race.id, teamId);
      loadData();
    } catch (error) {
      console.error('Failed to remove team:', error);
    }
  };

  const handleAddKarts = async () => {
    if (!race || kartsCount < 1) return;
    
    try {
      await createKartsBulk({ raceId: race.id, count: kartsCount });
      setAddKartsDialogVisible(false);
      loadData();
    } catch (error) {
      console.error('Failed to add karts:', error);
    }
  };

  const handleCreatePitlaneConfig = async () => {
    if (!race) return;
    
    try {
      await createPitlaneConfig({
        raceId: race.id,
        linesCount: pitlaneFormData.linesCount,
        queueSize: pitlaneFormData.queueSize,
      });
      setPitlaneConfigDialogVisible(false);
      loadData();
    } catch (error) {
      console.error('Failed to create pitlane config:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <i className="pi pi-spin pi-spinner text-4xl text-emerald-500" />
      </div>
    );
  }

  if (!race) {
    return (
      <div className="space-y-4">
        <p className="text-slate-400">Race not found</p>
        <Button
          label="Back to Races"
          icon="pi pi-arrow-left"
          onClick={() => navigate('/races')}
          className="mt-4"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          icon="pi pi-arrow-left"
          rounded
          text
          severity="secondary"
          onClick={() => navigate('/races')}
        />
        <div>
          <h1 className="text-3xl font-bold text-white">{race.name}</h1>
          <p className="text-slate-400">
            {new Date(race.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      <RaceDetail
        race={race}
        karts={karts}
        pitlaneConfig={pitlaneConfig}
        onAddTeam={() => setAddTeamDialogVisible(true)}
        onRemoveTeam={handleRemoveTeam}
        onAddKarts={() => setAddKartsDialogVisible(true)}
        onManageKarts={() => navigate(`/karts?raceId=${race.id}`)}
        onConfigurePitlane={() => setPitlaneConfigDialogVisible(true)}
        onViewPitlane={() => navigate(`/pitlane?raceId=${race.id}`)}
        availableTeamsCount={availableTeams.length}
      />

      {/* Add Team Dialog */}
      <Dialog
        visible={addTeamDialogVisible}
        onHide={() => setAddTeamDialogVisible(false)}
        header="Add Team to Race"
        style={{ width: '400px' }}
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Select Team
            </label>
            <Select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.value)}
              options={availableTeams}
              optionLabel="name"
              optionValue="id"
              placeholder="Choose a team"
              className="w-full"
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              label="Cancel"
              severity="secondary"
              onClick={() => setAddTeamDialogVisible(false)}
            />
            <Button
              label="Add"
              onClick={handleAddTeam}
              disabled={!selectedTeamId}
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

      {/* Pitlane Config Dialog */}
      <PitlaneConfigForm
        visible={pitlaneConfigDialogVisible}
        onHide={() => setPitlaneConfigDialogVisible(false)}
        formData={pitlaneFormData}
        onFormChange={setPitlaneFormData}
        onCreate={handleCreatePitlaneConfig}
      />
    </div>
  );
}
