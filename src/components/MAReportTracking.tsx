import React, { useState } from 'react';
import { FileText, CheckCircle2, Clock, Search, Send, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { MAReport } from '../types/maintenance';
import { playChime } from '../lib/notification';

interface MAReportTrackingProps {
  reports: MAReport[];
  onCompleteReport: (reportId: string, sendDate: string) => void;
}

export const MAReportTracking: React.FC<MAReportTrackingProps> = ({
  reports,
  onCompleteReport,
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const filtered = reports.filter((r) => {
    const matchSearch =
      r.solarPlantName.toLowerCase().includes(search.toLowerCase()) ||
      r.maPeriod.toLowerCase().includes(search.toLowerCase());
    
    if (filter === 'completed') return matchSearch && r.isReportCompleted;
    if (filter === 'pending') return matchSearch && !r.isReportCompleted;
    return matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const pageReports = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleDone = (reportId: string) => {
    const today = new Date().toISOString().split('T')[0];
    playChime('success');
    onCompleteReport(reportId, today);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl my-6">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-slate-950/70">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <FileText className="w-5 h-5 text-purple-400" />
            <span>MA Report Tracking</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Track MA report preparation status and customer delivery dates, mapped from sheet "MA Report Tracking"
          </p>
        </div>

        {/* Filter and Search */}
        <div className="flex flex-wrap items-center gap-2">
          
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => { setFilter('all'); setCurrentPage(1); }}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                filter === 'all' ? 'bg-purple-900 text-purple-200' : 'text-slate-400'
              }`}
            >
              All ({reports.length})
            </button>
            <button
              onClick={() => { setFilter('pending'); setCurrentPage(1); }}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                filter === 'pending' ? 'bg-amber-950 text-amber-300' : 'text-slate-400'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => { setFilter('completed'); setCurrentPage(1); }}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                filter === 'completed' ? 'bg-emerald-950 text-emerald-300' : 'text-slate-400'
              }`}
            >
              Completed
            </button>
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search plant or period..."
              className="w-full bg-slate-950 text-xs text-slate-200 pl-9 pr-3 py-1.5 rounded-xl border border-slate-700 focus:outline-none focus:border-purple-500"
            />
          </div>

        </div>

      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold">
              <th className="py-3 px-3 w-12 text-center">No.</th>
              <th className="py-3 px-4">Solar Plant</th>
              <th className="py-3 px-3">MA Date</th>
              <th className="py-3 px-3 text-center">MA Period</th>
              <th className="py-3 px-3 text-center">O&M Contract</th>
              <th className="py-3 px-3 text-center">MA Report Status</th>
              <th className="py-3 px-3">Send to Customer Date</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {pageReports.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500 text-sm">
                  No report records found matching your criteria.
                </td>
              </tr>
            ) : (
              pageReports.map((rep, idx) => {
                return (
                  <tr key={rep.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 text-center text-slate-500">
                      {(currentPage - 1) * pageSize + idx + 1}
                    </td>

                    <td className="py-3 px-4 font-bold text-white">
                      {rep.solarPlantName}
                    </td>

                    <td className="py-3 px-3 text-slate-300">
                      {rep.maDate || '-'}
                    </td>

                    <td className="py-3 px-3 text-center font-semibold text-purple-300">
                      {rep.maPeriod || '1 of 4'}
                    </td>

                    <td className="py-3 px-3 text-center text-slate-400">
                      {rep.omContract} times
                    </td>

                    <td className="py-3 px-3 text-center">
                      {rep.isReportCompleted ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Clock className="w-3.5 h-3.5 mr-1" />
                          Pending
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-slate-300">
                      {rep.sendToCustomerDate ? (
                        <span className="text-emerald-300 flex items-center space-x-1">
                          <Send className="w-3 h-3 inline mr-1 text-emerald-400" />
                          <span>{rep.sendToCustomerDate}</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">Pending Delivery</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {!rep.isReportCompleted ? (
                        <button
                          onClick={() => handleDone(rep.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition flex items-center space-x-1 mx-auto"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Report Completed</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-400 font-medium">✓ Delivered</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-slate-950/60">
        <div>
          Page {currentPage} of {totalPages} (Total {filtered.length} reports)
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
