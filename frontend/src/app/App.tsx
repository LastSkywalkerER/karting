import 'primeicons/primeicons.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/shared/components/Layout';
import { TeamsPage } from '@/pages/TeamsPage';
import { RacesPage } from '@/pages/RacesPage';
import { RaceDetailPage } from '@/pages/RaceDetailPage';
import { KartsPage } from '@/pages/KartsPage';
import { PitlanePage } from '@/pages/PitlanePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/races" replace />} />
          <Route path="races" element={<RacesPage />} />
          <Route path="races/:id" element={<RaceDetailPage />} />
          <Route path="teams" element={<TeamsPage />} />
          <Route path="karts" element={<KartsPage />} />
          <Route path="pitlane" element={<PitlanePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
