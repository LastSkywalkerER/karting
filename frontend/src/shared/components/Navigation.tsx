import { NavLink } from 'react-router-dom';
import { SyncStatusIndicator } from '@/features/sync';

export function Navigation() {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
      isActive
        ? 'bg-linear-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25'
        : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
    }`;

  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center gap-1 min-h-[56px] flex-1 py-2 px-1 rounded-lg transition-all duration-200 touch-manipulation ${
      isActive
        ? 'text-emerald-400 bg-emerald-500/10'
        : 'text-slate-400 active:bg-slate-800/50'
    }`;

  return (
    <>
      {/* Desktop sidebar */}
      <nav
        className="hidden md:flex w-64 h-screen sticky top-0 shrink-0 bg-slate-900 border-r border-slate-800 p-4 flex-col overflow-y-auto"
        aria-label="Main navigation"
      >
        <div className="mb-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            Race Stats
          </h1>
          <p className="text-slate-500 text-sm mt-1">Management System</p>
        </div>

        <div className="flex flex-col gap-2">
          <NavLink to="/races" className={navLinkClass}>
            <i className="pi pi-flag text-lg" />
            <span>Races</span>
          </NavLink>

          <NavLink to="/teams" className={navLinkClass}>
            <i className="pi pi-users text-lg" />
            <span>Teams</span>
          </NavLink>

          <NavLink to="/karts" className={navLinkClass}>
            <i className="pi pi-car text-lg" />
            <span>Karts</span>
          </NavLink>

          <NavLink to="/pitlane" className={navLinkClass}>
            <i className="pi pi-arrows-h text-lg" />
            <span>Pitlane</span>
          </NavLink>
        </div>

        <div className="mt-auto pt-4 border-t border-slate-800 space-y-3">
          <SyncStatusIndicator />
          <div className="text-slate-500 text-xs">
            Race Management v1.0
          </div>
        </div>
      </nav>

      {/* Mobile bottom navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden bg-slate-900/95 border-t border-slate-800"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
        aria-label="Mobile navigation"
      >
        <NavLink to="/races" className={mobileNavLinkClass}>
          <i className="pi pi-flag text-xl" />
          <span className="text-xs">Races</span>
        </NavLink>
        <NavLink to="/teams" className={mobileNavLinkClass}>
          <i className="pi pi-users text-xl" />
          <span className="text-xs">Teams</span>
        </NavLink>
        <NavLink to="/karts" className={mobileNavLinkClass}>
          <i className="pi pi-car text-xl" />
          <span className="text-xs">Karts</span>
        </NavLink>
        <NavLink to="/pitlane" className={mobileNavLinkClass}>
          <i className="pi pi-arrows-h text-xl" />
          <span className="text-xs">Pitlane</span>
        </NavLink>
      </nav>
    </>
  );
}
