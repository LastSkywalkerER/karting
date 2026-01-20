import { Button, Dialog, InputText } from '@/shared/ui';
import type { Team } from '@/shared/types/team';

interface TeamFormProps {
  visible: boolean;
  onHide: () => void;
  editingTeam: Team | null;
  formData: { name: string; number: string };
  onFormChange: (data: { name: string; number: string }) => void;
  onSave: () => void;
}

export function TeamForm({
  visible,
  onHide,
  editingTeam,
  formData,
  onFormChange,
  onSave,
}: TeamFormProps) {
  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={editingTeam ? 'Edit Team' : 'Create Team'}
      style={{ width: '400px' }}
    >
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Team Number
          </label>
          <InputText
            value={formData.number}
            onChange={(e) => onFormChange({ ...formData, number: e.target.value })}
            className="w-full"
            placeholder="e.g., 42"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Team Name
          </label>
          <InputText
            value={formData.name}
            onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
            className="w-full"
            placeholder="e.g., Red Bull Racing"
          />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button
            label="Cancel"
            severity="secondary"
            onClick={onHide}
          />
          <Button
            label={editingTeam ? 'Update' : 'Create'}
            onClick={onSave}
            disabled={!formData.name || !formData.number}
          />
        </div>
      </div>
    </Dialog>
  );
}
