import React, { useState } from 'react';
import { X, Users, Plus, Trash2, Edit2, Check, Phone, Shield } from 'lucide-react';
import { Team } from '../types/maintenance';

interface TeamManagerModalProps {
  teams: Team[];
  onClose: () => void;
  onSaveTeam: (team: Team) => void;
  onDeleteTeam: (teamId: string) => void;
}

export const TeamManagerModal: React.FC<TeamManagerModalProps> = ({
  teams,
  onClose,
  onSaveTeam,
  onDeleteTeam,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [teamForm, setTeamForm] = useState<Partial<Team>>({
    name: '',
    leader: '',
    members: '',
    phone: '',
    color: '#3B82F6',
  });

  const handleStartAdd = () => {
    setEditingId('new');
    setTeamForm({
      name: `Team ${String.fromCharCode(65 + teams.length)}`,
      leader: '',
      members: '',
      phone: '',
      color: '#10B981',
    });
  };

  const handleStartEdit = (t: Team) => {
    setEditingId(t.id);
    setTeamForm({ ...t });
  };

  const handleSave = () => {
    if (!teamForm.name) return;
    const team: Team = {
      id: editingId === 'new' ? `team-${Date.now()}` : (editingId as string),
      name: teamForm.name,
      leader: teamForm.leader || '',
      members: teamForm.members || '',
      phone: teamForm.phone || '',
      color: teamForm.color || '#3B82F6',
    };
    onSaveTeam(team);
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Maintenance Teams Management</h2>
              <p className="text-xs text-slate-400">Manage maintenance teams, team leaders, contact numbers, and assignments</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          
          {/* Add Team Button */}
          {editingId !== 'new' && (
            <button
              onClick={handleStartAdd}
              className="w-full py-2.5 px-4 rounded-xl border border-dashed border-slate-700 hover:border-amber-500/60 text-slate-300 hover:text-white text-xs font-bold flex items-center justify-center space-x-2 transition bg-slate-950/40"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Add New Team</span>
            </button>
          )}

          {/* Edit / Add Form */}
          {editingId && (
            <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/40 space-y-3">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                {editingId === 'new' ? 'Add New Team' : 'Edit Team'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Team Name</label>
                  <input
                    type="text"
                    value={teamForm.name}
                    onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Team Leader</label>
                  <input
                    type="text"
                    value={teamForm.leader}
                    onChange={(e) => setTeamForm({ ...teamForm, leader: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={teamForm.phone}
                    onChange={(e) => setTeamForm({ ...teamForm, phone: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Team Members</label>
                  <input
                    type="text"
                    value={teamForm.members}
                    onChange={(e) => setTeamForm({ ...teamForm, members: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={() => setEditingId(null)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg flex items-center space-x-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
              </div>
            </div>
          )}

          {/* Teams List */}
          <div className="space-y-2">
            {teams.map((t) => (
              <div
                key={t.id}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-3 h-10 rounded-full flex-shrink-0"
                    style={{ backgroundColor: t.color || '#3B82F6' }}
                  />
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                      <span>{t.name}</span>
                      {t.leader && (
                        <span className="text-xs font-normal text-slate-400">
                          (Lead: {t.leader})
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-400 flex items-center space-x-3 mt-0.5">
                      {t.phone && (
                        <span className="flex items-center space-x-1">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{t.phone}</span>
                        </span>
                      )}
                      {t.members && <span>Members: {t.members}</span>}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleStartEdit(t)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {teams.length > 1 && (
                    <button
                      onClick={() => onDeleteTeam(t.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
