import { useState, useEffect } from 'react';
import { Button } from '@/shared/ui';
import { fetchTeams, createTeam, updateTeam, deleteTeam, TeamList, TeamForm } from '@/features/teams';
import type { Team } from '@/shared/types/team';

export function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState({ name: '' });

  const loadTeams = async () => {
    setLoading(true);
    try {
      const response = await fetchTeams();
      if (response.success && response.data) {
        setTeams(response.data);
      }
    } catch (error) {
      console.error('Failed to load teams:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const openCreateDialog = () => {
    setEditingTeam(null);
    setFormData({ name: '' });
    setDialogVisible(true);
  };

  const openEditDialog = (team: Team) => {
    setEditingTeam(team);
    setFormData({ name: team.name });
    setDialogVisible(true);
  };

  const handleSave = async () => {
    try {
      if (editingTeam) {
        await updateTeam(editingTeam.id, formData);
      } else {
        await createTeam(formData);
      }
      setDialogVisible(false);
      loadTeams();
    } catch (error) {
      console.error('Failed to save team:', error);
    }
  };

  const handleDelete = async (team: Team) => {
    if (confirm(`Delete team "${team.name}"?`)) {
      try {
        await deleteTeam(team.id);
        loadTeams();
      } catch (error) {
        console.error('Failed to delete team:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Teams</h1>
          <p className="text-slate-400">Manage race teams</p>
        </div>
        <Button
          label="Create Team"
          icon="pi pi-plus"
          onClick={openCreateDialog}
        />
      </div>

      <TeamList
        teams={teams}
        loading={loading}
        onEdit={openEditDialog}
        onDelete={handleDelete}
      />

      <TeamForm
        visible={dialogVisible}
        onHide={() => setDialogVisible(false)}
        editingTeam={editingTeam}
        formData={formData}
        onFormChange={setFormData}
        onSave={handleSave}
      />
    </div>
  );
}
