import { Button, Dialog, Select } from '@/shared/ui';
import type { PitlaneConfig } from '@/shared/types/pitlane';

interface PitlaneEntryFormProps {
  visible: boolean;
  onHide: () => void;
  config: PitlaneConfig;
  formData: {
    teamId: number | null;
    lineNumber: number;
  };
  onFormChange: (data: {
    teamId: number | null;
    lineNumber: number;
  }) => void;
  onAdd: () => void;
  teams: { id: number; label: string }[];
}

export function PitlaneEntryForm({
  visible,
  onHide,
  config,
  formData,
  onFormChange,
  onAdd,
  teams,
}: PitlaneEntryFormProps) {
  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header="Add Team to Pitlane"
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
            optionLabel="label"
            optionValue="id"
            placeholder="Select team"
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Line Number
          </label>
          <Select
            value={formData.lineNumber}
            onChange={(e) =>
              onFormChange({ ...formData, lineNumber: e.value ?? formData.lineNumber })
            }
            options={Array.from({ length: config.linesCount }, (_, i) => ({
              value: i + 1,
              label: `Line ${i + 1}`,
            }))}
            optionLabel="label"
            optionValue="value"
            className="w-full"
          />
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
            disabled={!formData.teamId}
          />
        </div>
      </div>
    </Dialog>
  );
}
