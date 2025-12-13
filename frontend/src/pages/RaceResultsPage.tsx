import { RaceResultsTable } from '@/features/race-results/ui/RaceResultsTable';

interface RaceResultsPageProps {
  sessionId: string;
}

export function RaceResultsPage({ sessionId }: RaceResultsPageProps) {
  return <RaceResultsTable sessionId={sessionId} />;
}

