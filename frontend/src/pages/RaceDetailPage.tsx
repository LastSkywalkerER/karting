import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Dialog, InputNumber, InputText, Select, TabPanel, TabView } from '@/shared/ui';
import { fetchRaceById, addTeamToRace, removeTeamFromRace, RaceDetail } from '@/features/races';
import { fetchTeams } from '@/features/teams';
import { fetchKartsByRace, createKartsBulk } from '@/features/karts';
import { fetchPitlaneConfig, createPitlaneConfig, PitlaneConfigForm } from '@/features/pitlane';
import {
  LapTimesTable,
  PitlaneEventModal,
  fetchPitlaneEvents,
  acknowledgePitlaneEvent,
} from '@/features/lapTimes';
import type { PitlaneModalSource } from '@/features/lapTimes';
import { useCurrentRace } from '@/shared/context/CurrentRaceContext';
import type { Race } from '@/shared/types/race';
import type { Team } from '@/shared/types/team';
import type { Kart } from '@/shared/types/kart';
import type { PitlaneConfig } from '@/shared/types/pitlane';

export function RaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setCurrentRaceId } = useCurrentRace();
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
  const [teamNumber, setTeamNumber] = useState('');
  const [kartsCount, setKartsCount] = useState<number>(10);
  const [pitlaneFormData, setPitlaneFormData] = useState({ linesCount: 4, queueSize: 1 });

  // Lap times / pitlane events
  const processedEventIdsRef = useRef<Set<number>>(new Set());
  const [pitlaneModalVisible, setPitlaneModalVisible] = useState(false);
  const [pitlaneModalSource, setPitlaneModalSource] = useState<PitlaneModalSource | null>(null);

  const loadData = async () => {
    if (!id) return;
    
    const raceId = parseInt(id);
    
    // Update current race in context
    await setCurrentRaceId(raceId);
    
    setLoading(true);
    try {
      const [raceRes, teamsRes, kartsRes, pitlaneRes] = await Promise.all([
        fetchRaceById(raceId),
        fetchTeams(),
        fetchKartsByRace(raceId),
        fetchPitlaneConfig(raceId),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const pollPitlaneEvents = useCallback(async () => {
    if (!id || !race?.speedhiveUrl) return;
    const raceId = parseInt(id, 10);
    try {
      const res = await fetchPitlaneEvents(raceId, false);
      if (!res?.data) return;
      const newEvents = res.data.filter((evt) => !processedEventIdsRef.current.has(evt.id));
      if (newEvents.length > 0) {
        const evt = newEvents[0];
        processedEventIdsRef.current.add(evt.id);
        setPitlaneModalSource({ type: 'event', event: evt });
        setPitlaneModalVisible(true);
      }
    } catch {
      // Ignore poll errors
    }
  }, [id, race?.speedhiveUrl]);

  useEffect(() => {
    if (!race?.speedhiveUrl) return;
    pollPitlaneEvents();
    const interval = setInterval(pollPitlaneEvents, 5000);
    return () => clearInterval(interval);
  }, [race?.speedhiveUrl, pollPitlaneEvents]);

  const handlePitCellClick = useCallback((teamNumber: string, lapNumber: number) => {
    setPitlaneModalSource({ type: 'manual', teamNumber, lapNumber });
    setPitlaneModalVisible(true);
  }, []);

  const handleAcknowledgePitlaneEvent = useCallback(async () => {
    if (!id || pitlaneModalSource?.type !== 'event') return;
    const raceId = parseInt(id, 10);
    const eventId = pitlaneModalSource.event.id;
    try {
      await acknowledgePitlaneEvent(raceId, eventId);
      processedEventIdsRef.current.add(eventId);
      setPitlaneModalVisible(false);
      setPitlaneModalSource(null);
    } catch (err) {
      console.error('Failed to acknowledge event:', err);
    }
  }, [id, pitlaneModalSource]);

  const availableTeams = allTeams.filter(
    (team) => !race?.raceTeams?.some((entry) => entry.teamId === team.id)
  );

  const handleAddTeam = async () => {
    if (!race || !selectedTeamId || !teamNumber.trim()) return;
    
    try {
      await addTeamToRace(race.id, selectedTeamId, teamNumber.trim());
      setAddTeamDialogVisible(false);
      setSelectedTeamId(null);
      setTeamNumber('');
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
      <div className="flex items-start gap-3 sm:gap-4">
        <Button
          icon="pi pi-arrow-left"
          rounded
          text
          severity="secondary"
          onClick={() => navigate('/races')}
          className="shrink-0 min-h-[44px] min-w-[44px]"
        />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-3xl font-bold text-white break-words">{race.name}</h1>
          <p className="text-slate-400 text-sm sm:text-base mt-1">
            {new Date(race.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {race.speedhiveUrl ? (
        <TabView>
          <TabPanel header="Overview">
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
          </TabPanel>
          <TabPanel header="Lap Times">
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
              <LapTimesTable
                raceId={race.id}
                onPitCellClick={handlePitCellClick}
              />
            </div>
          </TabPanel>
        </TabView>
      ) : (
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
      )}

      <PitlaneEventModal
        visible={pitlaneModalVisible}
        onHide={() => {
          setPitlaneModalVisible(false);
          setPitlaneModalSource(null);
        }}
        source={pitlaneModalSource}
        onAcknowledge={
          pitlaneModalSource?.type === 'event' ? handleAcknowledgePitlaneEvent : undefined
        }
      />

      {/* Add Team Dialog */}
      <Dialog
        visible={addTeamDialogVisible}
        onHide={() => {
          setAddTeamDialogVisible(false);
          setSelectedTeamId(null);
          setTeamNumber('');
        }}
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
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Team Number
            </label>
            <InputText
              value={teamNumber}
              onChange={(e) => setTeamNumber(e.target.value)}
              className="w-full"
              placeholder="e.g., 42"
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
              disabled={!selectedTeamId || !teamNumber.trim()}
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
              All karts will be created with status 5 (black) and unassigned
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
