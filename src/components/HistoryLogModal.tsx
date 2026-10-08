import React, { useState } from 'react';
import { X, History, Search, Download, Calendar, User, ShieldCheck } from 'lucide-react';
import { MaintenanceHistory } from '../types/maintenance';

interface HistoryLogModalProps {
  history: MaintenanceHistory[];
  onClose: () => void;
  onExport: () => void;
}

export const HistoryLogModal: React.FC<HistoryLogModalProps> = ({
  history,
  onClose,
  onExport,
}) => {
  const [search, setSearch] = useState('');

  const filtered = history.filter((h) =>
    h.solarPlantName.toLowerCase().includes(search.toLowerCase()) ||
    h.teamName.toLowerCase().includes(search.toLowerCase()) ||
    h.userName.toLowerCase().includes(search.toLowerCase()) ||
    (h.note && h.note.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Audit & Maintenance History Log</h2>
              <p className="text-xs text-slate-400">Complete audit log of maintenance completions, timestamps, assigned teams, and operators</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onExport}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export History</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-3 bg-slate-950 border-b border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by plant name, team, or operator..."
              className="w-full bg-slate-900 text-xs text-slate-200 pl-9 pr-3 py-1.5 rounded-xl border border-slate-800 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Log Table */}
        <div className="overflow-y-auto flex-1 p-2">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/60 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-3">Date & Time</th>
                <th className="py-2.5 px-4">Solar Plant</th>
                <th className="py-2.5 px-3 text-center">Round</th>
                <th className="py-2.5 px-3 text-center">Count</th>
                <th className="py-2.5 px-3">Team</th>
                <th className="py-2.5 px-3">Recorded By</th>
                <th className="py-2.5 px-4">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                    No history logs found.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                      {new Date(item.completedAt).toLocaleString('en-US')}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-white truncate max-w-[200px]">
                      {item.solarPlantName}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300">
                        R{item.roundNumber}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-emerald-400">
                      {item.countNumber}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {item.teamName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {item.userName}
                    </td>
                    <td className="py-2.5 px-4 text-slate-400 truncate max-w-[150px]">
                      {item.note || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>Total {filtered.length} logs recorded</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg font-semibold"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
