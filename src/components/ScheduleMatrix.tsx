import React, { useState } from 'react';
import { Check, Clock, Search, ExternalLink, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { SolarPlant, MaintenanceRound } from '../types/maintenance';
import { formatDateDMY } from '../lib/scheduleAlerts';

interface ScheduleMatrixProps {
  plants: SolarPlant[];
  rounds: MaintenanceRound[];
  onSelectPlant: (plant: SolarPlant) => void;
}

export const ScheduleMatrix: React.FC<ScheduleMatrixProps> = ({
  plants,
  rounds,
  onSelectPlant,
}) => {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const filtered = plants.filter((p) =>
    p.solarPlant.toLowerCase().includes(search.toLowerCase()) ||
    p.locationArea.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const pagePlants = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const roundNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl my-6">
      
      {/* Header Bar */}
      <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-950/60">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            <span>Maintenance Schedule Matrix (1st - 12th Rounds)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Maintenance schedule matrix structure mapped from the "Maintenance Schedule" sheet
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search solar plant or location..."
            className="w-full bg-slate-900 text-xs text-slate-200 pl-9 pr-3 py-1.5 rounded-xl border border-slate-700 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Grid Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold">
              <th className="py-3 px-3 w-12 text-center sticky left-0 bg-slate-950 z-10 border-r border-slate-800">Queue</th>
              <th className="py-3 px-4 min-w-[200px] sticky left-12 bg-slate-950 z-10 border-r border-slate-800 shadow-lg">Solar Plant</th>
              {roundNumbers.map((r) => (
                <th key={r} className="py-3 px-2 min-w-[105px] text-center border-r border-slate-800/80">
                  {r === 1 ? '1st' : r === 2 ? '2nd' : r === 3 ? '3rd' : `${r}th`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {pagePlants.map((plant) => {
              const plantRounds = rounds.filter((r) => r.solarPlantId === plant.id);

              return (
                <tr key={plant.id} className="hover:bg-slate-800/30 transition-colors">
                  {/* Queue # */}
                  <td className="py-3 px-3 text-center font-bold text-slate-400 sticky left-0 bg-slate-900/95 z-10 border-r border-slate-800">
                    #{plant.queueNumber}
                  </td>

                  {/* Plant Name */}
                  <td className="py-3 px-4 font-semibold text-white sticky left-12 bg-slate-900/95 z-10 border-r border-slate-800 shadow-lg">
                    <button
                      onClick={() => onSelectPlant(plant)}
                      className="hover:text-blue-400 text-left transition truncate max-w-[190px] block"
                      title={plant.solarPlant}
                    >
                      {plant.solarPlant}
                    </button>
                    <span className="text-[10px] text-slate-500 block truncate">
                      {plant.locationArea || 'Unspecified'}
                    </span>
                  </td>

                  {/* 1st to 12th Rounds */}
                  {roundNumbers.map((rNum) => {
                    const rnd = plantRounds.find((r) => r.roundNumber === rNum);
                    const isDone = rnd?.isCompleted || false;
                    const dateStr = formatDateDMY(rnd?.scheduledDate);

                    return (
                      <td 
                        key={rNum} 
                        onClick={() => onSelectPlant(plant)}
                        className={`py-2 px-2 text-center border-r border-slate-800/60 cursor-pointer transition ${
                          isDone 
                            ? 'bg-emerald-950/20 hover:bg-emerald-950/40 text-emerald-300' 
                            : 'hover:bg-slate-800/50 text-slate-500'
                        }`}
                        title={`Round ${rNum}: ${isDone ? 'Completed' : 'Pending'}\n${dateStr}`}
                      >
                        <div className="flex flex-col items-center justify-center space-y-0.5">
                          {isDone ? (
                            <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              <Check className="w-3 h-3 stroke-[3]" />
                              <span>Done</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] text-slate-500 bg-slate-800/50">
                              <Clock className="w-2.5 h-2.5 mr-1" />
                              <span>Pending</span>
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 truncate max-w-[85px]">
                            {dateStr}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-slate-950/60">
        <div>
          Page {currentPage} of {totalPages} (Total {filtered.length} solar plants)
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
};
