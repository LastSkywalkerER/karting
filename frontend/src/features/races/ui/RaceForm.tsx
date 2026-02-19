import { Button, Calendar, Dialog, InputText } from '@/shared/ui';
import { isValidSpeedhiveUrl } from '@/shared/utils/speedhiveUrl';

interface RaceFormProps {
  visible: boolean;
  onHide: () => void;
  formData: { name: string; date: Date | null; speedhiveUrl: string };
  onFormChange: (data: { name: string; date: Date | null; speedhiveUrl: string }) => void;
  onCreate: () => void;
}

export function RaceForm({
  visible,
  onHide,
  formData,
  onFormChange,
  onCreate,
}: RaceFormProps) {
  const speedhiveUrlError =
    formData.speedhiveUrl.trim() && !isValidSpeedhiveUrl(formData.speedhiveUrl)
      ? 'Invalid SpeedHive URL. Example: https://speedhive.mylaps.com/livetiming/.../sessions/...'
      : null;
  const canCreate =
    formData.name &&
    formData.date &&
    !speedhiveUrlError;

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
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            SpeedHive URL (optional)
          </label>
          <InputText
            value={formData.speedhiveUrl}
            onChange={(e) =>
              onFormChange({ ...formData, speedhiveUrl: e.target.value })
            }
            className={`w-full ${speedhiveUrlError ? 'p-invalid' : ''}`}
            placeholder="https://speedhive.mylaps.com/livetiming/.../sessions/..."
          />
          {speedhiveUrlError && (
            <small className="text-red-400 mt-1 block">{speedhiveUrlError}</small>
          )}
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
            disabled={!canCreate}
          />
        </div>
      </div>
    </Dialog>
  );
}
