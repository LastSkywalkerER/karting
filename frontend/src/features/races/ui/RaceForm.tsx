import { Button, Calendar, Dialog, InputText } from '@/shared/ui';

interface RaceFormProps {
  visible: boolean;
  onHide: () => void;
  formData: { name: string; date: Date | null };
  onFormChange: (data: { name: string; date: Date | null }) => void;
  onCreate: () => void;
}

export function RaceForm({
  visible,
  onHide,
  formData,
  onFormChange,
  onCreate,
}: RaceFormProps) {
  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header="Create Race"
      style={{ width: '400px' }}
    >
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Race Name
          </label>
          <InputText
            value={formData.name}
            onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
            className="w-full"
            placeholder="e.g., Grand Prix 2024"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Date
          </label>
          <Calendar
            value={formData.date}
            onChange={(e) => onFormChange({ ...formData, date: e.value as Date })}
            className="w-full"
            dateFormat="yy-mm-dd"
          />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button
            label="Cancel"
            severity="secondary"
            onClick={onHide}
          />
          <Button
            label="Create"
            onClick={onCreate}
            disabled={!formData.name || !formData.date}
          />
        </div>
      </div>
    </Dialog>
  );
}
