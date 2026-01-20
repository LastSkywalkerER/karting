import { Button, Dialog, Select } from '@/shared/ui';
import type { Kart } from '@/shared/types/kart';
import type { Team } from '@/shared/types/team';

const STATUS_OPTIONS = [
  { value: 1, label: 'Good (Green)', color: '#22c55e' },
  { value: 2, label: 'Warning (Yellow)', color: '#eab308' },
  { value: 3, label: 'Caution (Orange)', color: '#f97316' },
  { value: 4, label: 'Critical (Red)', color: '#ef4444' },
  { value: 5, label: 'Out of Service (Black)', color: '#000000' },
];

interface KartEditModalProps {
  visible: boolean;
  onHide: () => void;
  kart: Kart | null;
  formData: { status: number; teamId: number | null };
  onFormChange: (data: { status: number; teamId: number | null }) => void;
  onSave: () => void;
  teams: Team[];
}

export function KartEditModal({
  visible,
  onHide,
  kart,
  formData,
  onFormChange,
  onSave,
  teams,
}: KartEditModalProps) {
  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={`Edit Kart #${kart?.id}`}
      style={{ width: '400px' }}
    >
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Status
          </label>
          <Select
            value={formData.status}
            onChange={(e) => onFormChange({ ...formData, status: e.value })}
            options={STATUS_OPTIONS}
            optionLabel="label"
            optionValue="value"
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Assigned Team
          </label>
          <Select
            value={formData.teamId}
            onChange={(e) => onFormChange({ ...formData, teamId: e.value })}
            options={[{ id: null, name: 'Unassigned', number: '-' }, ...teams]}
            optionLabel="name"
            optionValue="id"
            className="w-full"
            placeholder="Select team"
          />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button
            label="Cancel"
            severity="secondary"
            onClick={onHide}
          />
          <Button
            label="Save"
            onClick={onSave}
          />
        </div>
      </div>
    </Dialog>
  );
}
