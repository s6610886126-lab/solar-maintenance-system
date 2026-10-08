import React, { useMemo } from 'react';
import { 
  Building2, 
  CheckCircle2, 
  Clock, 
  RotateCw, 
  ChevronRight,
  AlertTriangle,
  Calendar,
  Zap,
  Check
} from 'lucide-react';
import { SolarPlant, QueueState, MaintenanceHistory, MaintenanceRound } from '../types/maintenance';
import { getPlantScheduleStatus, getTodayDateStr } from '../lib/scheduleAlerts';

interface StatsOverviewProps {
  plants: SolarPlant[];
  rounds?: MaintenanceRound[];
  queueState: QueueState;
  history: MaintenanceHistory[];
  onSelectQueueView: () => void;
  onFilterScheduleAlert?: (alertType: 'overdue' | 'today' | 'due_soon') => void;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  plants,
  rounds = [],
  queueState,
  history,
  onSelectQueueView,
  onFilterScheduleAlert,
}) => {
  const total = plants.length;

  const activeCount = plants.filter((p) => {
    const s = (p.status || '').toLowerCase();
    return s.includes('paid') || s.includes('active');
  }).length;

  const todayStr = getTodayDateStr();
  const completedTodayCount = history.filter((h) => {
    return h.completedAt && h.completedAt.startsWith(todayStr);
  }).length;

  const pendingCount = plants.filter((p) => (p.totalCount || 0) < (p.omContractCount || 4)).length;

  // Calculate schedule alerts
  const alertStats = useMemo(() => {
    if (!rounds || rounds.length === 0) {
      return { overdue: 0, today: 0, dueSoon: 0 };
    }
    let overdue = 0;
    let today = 0;
    let dueSoon = 0;

    plants.forEach((plant) => {
      const status = getPlantScheduleStatus(plant, rounds, todayStr);
      if (status.urgency === 'overdue') overdue++;
      else if (status.urgency === 'today') today++;
      else if (status.urgency === 'due_soon') dueSoon++;
    });

    return { overdue, today, dueSoon };
  }, [plants, rounds, todayStr]);

  const hasAlerts = alertStats.overdue > 0 || alertStats.today > 0 || alertStats.dueSoon > 0;

  return (
    <div className="space-y-3 my-4">
      {/* 4 Main KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* 1. Current Queue & Round */}
        <div 
          onClick={onSelectQueueView}
          className="group bg-slate-900/70 hover:bg-slate-900 border border-slate-800/80 hover:border-blue-500/50 rounded-2xl p-4 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-blue-400 flex items-center space-x-1.5">
              <RotateCw className="w-3.5 h-3.5" />
              <span>Current Queue & Round</span>
            </span>
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl sm:text-3xl font-black text-white">Q{queueState.currentQueueIndex}</span>
              <span className="text-sm font-semibold text-slate-400">/ {total}</span>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
              Round {queueState.currentRound}
            </span>
          </div>
        </div>

        {/* 2. Total Plants & Active */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium flex items-center space-x-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Total Plants</span>
            </span>
            <span className="text-[11px] font-semibold text-emerald-400">Active {activeCount}</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-white">{total}</span>
            <span className="text-xs text-slate-500">Solar Plants</span>
          </div>
        </div>

        {/* 3. Completed Today */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Completed Today</span>
            </span>
            <span className="text-[11px] text-slate-500">Today</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400">{completedTodayCount}</span>
            <span className="text-xs text-slate-500">tasks</span>
          </div>
        </div>

        {/* 4. Pending Maintenance */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Pending Maintenance</span>
            </span>
            <span className="text-[11px] text-slate-500">Pending</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-amber-400">{pendingCount}</span>
            <span className="text-xs text-slate-500">plants</span>
          </div>
        </div>

      </div>

      {/* SCHEDULE ALERTS & REMINDER STRIP (OVERDUE & DUE SOON) */}
      {hasAlerts ? (
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-3.5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
              alertStats.overdue > 0 
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20' 
                : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white flex items-center space-x-1.5 uppercase tracking-wide">
                <span>Maintenance Schedule Alerts</span>
              </span>
              <p className="text-[11px] text-slate-400">
                Click a filter below to review plants requiring immediate attention
              </p>
            </div>
          </div>

          {/* Alert Filter Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {alertStats.overdue > 0 && (
              <button
                type="button"
                onClick={() => onFilterScheduleAlert?.('overdue')}
                className="group px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-sm hover:shadow"
                title="Filter table by Overdue maintenance plants"
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span>Overdue: {alertStats.overdue}</span>
                <ChevronRight className="w-3.5 h-3.5 text-rose-400/70 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}

            {alertStats.today > 0 && (
              <button
                type="button"
                onClick={() => onFilterScheduleAlert?.('today')}
                className="group px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-sm hover:shadow"
                title="Filter table by plants Due Today"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Due Today: {alertStats.today}</span>
                <ChevronRight className="w-3.5 h-3.5 text-amber-400/70 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}

            {alertStats.dueSoon > 0 && (
              <button
                type="button"
                onClick={() => onFilterScheduleAlert?.('due_soon')}
                className="group px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-sm hover:shadow"
                title="Filter table by plants Due within 7 Days"
              >
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>Due in 7 Days: {alertStats.dueSoon}</span>
                <ChevronRight className="w-3.5 h-3.5 text-blue-400/70 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl px-4 py-2 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center space-x-2">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-300 font-medium">All scheduled maintenance rounds are up to date</span>
          </span>
          <span className="text-[11px] text-slate-500">No overdue rounds</span>
        </div>
      )}
    </div>
  );
};
