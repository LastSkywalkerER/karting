import { Button, Dialog, Select } from '@/shared/ui';
import type { Team } from '@/shared/types/team';
import type { Kart } from '@/shared/types/kart';
import type { PitlaneConfig } from '@/shared/types/pitlane';

interface PitlaneEntryFormProps {
  visible: boolean;
  onHide: () => void;
  config: PitlaneConfig;
  formData: {
    teamId: number | null;
    kartId: number | null;
    lineNumber: number;
    assignTeamIdToOldKart: number | null;
  };
  onFormChange: (data: {
    teamId: number | null;
    kartId: number | null;
    lineNumber: number;
    assignTeamIdToOldKart: number | null;
  }) => void;
  onAdd: () => void;
  teams: Team[];
  availableKarts: Kart[];
}

export function PitlaneEntryForm({
  visible,
  onHide,
  config,
  formData,
  onFormChange,
  onAdd,
  teams,
  availableKarts,
}: PitlaneEntryFormProps) {
  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header="Add Kart to Pitlane"
      style={{ width: '450px' }}
    >
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Team
          </label>
          <Select
            value={formData.teamId}
            onChange={(e) => onFormChange({ ...formData, teamId: e.value })}
            options={teams}
            optionLabel="name"
            optionValue="id"
            placeholder="Select team"
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Kart
          </label>
          <Select
            value={formData.kartId}
            onChange={(e) => onFormChange({ ...formData, kartId: e.value })}
            options={availableKarts.map(k => ({ id: k.id, label: `Kart #${k.id}` }))}
            optionLabel="label"
            optionValue="id"
            placeholder="Select kart"
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Line Number
          </label>
          <Select
            value={formData.lineNumber}
            onChange={(e) => onFormChange({ ...formData, lineNumber: e.value })}
            options={Array.from({ length: config.linesCount }, (_, i) => ({
              value: i + 1,
              label: `Line ${i + 1}`,
            }))}
            optionLabel="label"
            optionValue="value"
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Assign Old Kart to Team (optional)
          </label>
          <Select
            value={formData.assignTeamIdToOldKart}
            onChange={(e) => onFormChange({ ...formData, assignTeamIdToOldKart: e.value })}
            options={[{ id: null, name: 'None' }, ...teams]}
            optionLabel="name"
            optionValue="id"
            className="w-full"
          />
          <p className="text-sm text-slate-500 mt-1">
            If the line is full, the first kart will be removed and assigned to this team
          </p>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button
            label="Cancel"
            severity="secondary"
            onClick={onHide}
          />
          <Button
            label="Add"
            onClick={onAdd}
            disabled={!formData.teamId || !formData.kartId}
          />
        </div>
      </div>
    </Dialog>
  );
}
