import { useMemo, useState } from 'react';
import { Button } from '@/shared/ui';
import type { Team } from '@/shared/types/team';

interface TeamListProps {
  teams: Team[];
  loading: boolean;
  onEdit: (team: Team) => void;
  onDelete: (team: Team) => void;
}

export function TeamList({ teams, loading, onEdit, onDelete }: TeamListProps) {
  const [sortField, setSortField] = useState<'number' | 'name'>('number');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const sortedTeams = useMemo(() => {
    const sorted = [...teams].sort((a, b) => {
      if (sortField === 'number') {
        return Number(a.number) - Number(b.number);
      }
      return a.name.localeCompare(b.name);
    });
    return sortOrder === 'asc' ? sorted : sorted.reverse();
  }, [teams, sortField, sortOrder]);

  const toggleSort = (field: 'number' | 'name') => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortField(field);
    setSortOrder('asc');
  };

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
    <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
      <table className="w-full">
        <thead className="bg-slate-800/50">
          <tr>
            <th className="text-left px-6 py-4 text-slate-400 font-medium">
              <button
                type="button"
                className="inline-flex items-center gap-2 hover:text-slate-200"
                onClick={() => toggleSort('number')}
              >
                Number
                <i
                  className={`pi ${
                    sortField === 'number'
                      ? sortOrder === 'asc'
                        ? 'pi-sort-amount-up-alt'
                        : 'pi-sort-amount-down'
                      : 'pi-sort-alt'
                  }`}
                />
              </button>
            </th>
            <th className="text-left px-6 py-4 text-slate-400 font-medium">
              <button
                type="button"
                className="inline-flex items-center gap-2 hover:text-slate-200"
                onClick={() => toggleSort('name')}
              >
                Name
                <i
                  className={`pi ${
                    sortField === 'name'
                      ? sortOrder === 'asc'
                        ? 'pi-sort-amount-up-alt'
                        : 'pi-sort-amount-down'
                      : 'pi-sort-alt'
                  }`}
                />
              </button>
            </th>
            <th className="px-6 py-4" />
          </tr>
        </thead>
        <tbody>
          {sortedTeams.map((team) => (
            <tr key={team.id} className="border-t border-slate-800">
              <td className="px-7 py-5 text-slate-200">
                <div className="pr-1">{team.number}</div>
              </td>
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
  );
}
