import { Outlet } from 'react-router-dom';
import { Navigation } from './Navigation';

export function Layout() {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-950 gap-0 md:gap-8">
      <Navigation />
      <main className="flex-1 overflow-auto px-4 py-4 md:px-6 md:py-6 pb-20 md:pb-6 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
