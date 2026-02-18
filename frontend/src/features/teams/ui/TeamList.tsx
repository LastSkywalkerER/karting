import { useMemo } from 'react';
import { Button } from '@/shared/ui';
import type { Team } from '@/shared/types/team';

interface TeamListProps {
  teams: Team[];
  loading: boolean;
  onEdit: (team: Team) => void;
  onDelete: (team: Team) => void;
}

export function TeamList({ teams, loading, onEdit, onDelete }: TeamListProps) {
  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => a.name.localeCompare(b.name));
  }, [teams]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <i className="pi pi-spin pi-spinner text-4xl text-emerald-500" />
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-12 text-center">
        <i className="pi pi-users text-4xl text-slate-600 mb-4" />
        <p className="text-slate-400">No teams found. Create your first team!</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile: card list */}
      <div className="md:hidden flex flex-col gap-2">
        {sortedTeams.map((team) => (
          <div
            key={team.id}
            className="flex items-center justify-between gap-3 p-4 bg-slate-900 rounded-xl border border-slate-800"
          >
            <span className="text-slate-200 font-medium truncate min-w-0">{team.name}</span>
            <div className="flex gap-2 shrink-0">
              <Button
                icon="pi pi-pencil"
                rounded
                text
                severity="secondary"
                onClick={() => onEdit(team)}
                className="min-h-[44px] min-w-[44px]"
              />
              <Button
                icon="pi pi-trash"
                rounded
                text
                severity="danger"
                onClick={() => onDelete(team)}
                className="min-h-[44px] min-w-[44px]"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-800/50">
            <tr>
              <th className="text-left px-6 py-4 text-slate-400 font-medium">
                Name
              </th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody>
            {sortedTeams.map((team) => (
              <tr key={team.id} className="border-t border-slate-800">
                <td className="px-7 py-5 text-slate-200">
                  <div className="pr-1">{team.name}</div>
                </td>
                <td className="px-7 py-5">
                  <div className="flex gap-2 justify-end">
                    <Button
                      icon="pi pi-pencil"
                      rounded
                      text
                      severity="secondary"
                      onClick={() => onEdit(team)}
                    />
                    <Button
                      icon="pi pi-trash"
                      rounded
                      text
                      severity="danger"
                      onClick={() => onDelete(team)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
