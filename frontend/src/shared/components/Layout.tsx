import { Outlet } from 'react-router-dom';
import { Navigation } from './Navigation';

export function Layout() {
  return (
    <div className="flex min-h-screen bg-slate-950 gap-8">
      <Navigation />
      <main className="flex-1 overflow-auto px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
