import { Dialog, Button } from '@/shared/ui';
import type { PitlaneEvent } from '../api/lapTimesApi';

export type PitlaneModalSource =
  | { type: 'event'; event: PitlaneEvent }
  | { type: 'manual'; teamNumber: string; lapNumber: number };

interface PitlaneEventModalProps {
  visible: boolean;
  onHide: () => void;
  source: PitlaneModalSource | null;
  onAcknowledge?: () => void;
}

export function PitlaneEventModal({
  visible,
  onHide,
  source,
  onAcknowledge,
}: PitlaneEventModalProps) {
  if (!source) return null;

  const isEvent = source.type === 'event';

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header="Pitlane Entry"
      style={{ width: '360px' }}
    >
      <div className="flex flex-col gap-4">
        <div className="space-y-2">
          <p>
            <span className="text-slate-400">Team:</span>{' '}
            <span className="font-medium text-white">
              {isEvent ? source.event.competitorNumber : source.teamNumber}
            </span>
          </p>
          <p>
            <span className="text-slate-400">Lap:</span>{' '}
            <span className="font-medium text-white">
              {isEvent ? source.event.lapNumber : source.lapNumber}
            </span>
          </p>
          {isEvent && (
            <p>
              <span className="text-slate-400">Time:</span>{' '}
              <span className="text-white">
                {new Date(source.event.timestamp).toLocaleTimeString()}
              </span>
            </p>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button label="Close" severity="secondary" onClick={onHide} />
          {isEvent && onAcknowledge && (
            <Button label="Acknowledge" onClick={onAcknowledge} />
          )}
        </div>
      </div>
    </Dialog>
  );
}
