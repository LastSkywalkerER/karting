import { Button, Dialog, InputNumber } from '@/shared/ui';

interface PitlaneConfigFormProps {
  visible: boolean;
  onHide: () => void;
  formData: { linesCount: number; queueSize: number };
  onFormChange: (data: { linesCount: number; queueSize: number }) => void;
  onCreate: () => void;
}

export function PitlaneConfigForm({
  visible,
  onHide,
  formData,
  onFormChange,
  onCreate,
}: PitlaneConfigFormProps) {
  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header="Configure Pitlane"
      style={{ width: '400px' }}
    >
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Number of Lines
          </label>
          <InputNumber
            value={formData.linesCount}
            onValueChange={(e) => onFormChange({ ...formData, linesCount: e.value || 1 })}
            min={1}
            max={10}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Queue Size per Line
          </label>
          <InputNumber
            value={formData.queueSize}
            onValueChange={(e) => onFormChange({ ...formData, queueSize: e.value || 1 })}
            min={1}
            max={10}
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
            label="Create"
            onClick={onCreate}
          />
        </div>
      </div>
    </Dialog>
  );
}
