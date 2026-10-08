import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  Eye, 
  Play, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  Check, 
  Filter, 
  Plus,
  Calendar,
  Zap,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { SolarPlant, QueueState, MaintenanceRound } from '../types/maintenance';
import { STATUS_CONFIG, STATUS_OPTIONS, getStatusCategory } from '../lib/statusConfig';
import { getPlantScheduleStatus, getTodayDateStr, PlantScheduleStatus, formatDateDMY } from '../lib/scheduleAlerts';

interface ScheduleTableProps {
  plants: SolarPlant[];
  rounds: MaintenanceRound[];
  queueState: QueueState;
  onSelectPlant: (plant: SolarPlant) => void;
  onSetQueue: (plantId: string) => void;
  onOpenAddPlant?: () => void;
  scheduleAlertFilter?: 'all' | 'overdue' | 'today' | 'due_soon' | 'no_date';
  onScheduleAlertFilterChange?: (filter: 'all' | 'overdue' | 'today' | 'due_soon' | 'no_date') => void;
}

export const ScheduleTable: React.FC<ScheduleTableProps> = ({
  plants,
  rounds,
  queueState,
  onSelectPlant,
  onSetQueue,
  onOpenAddPlant,
  scheduleAlertFilter,
  onScheduleAlertFilterChange,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterLocation, setFilterLocation] = useState<string>('all');
  const [internalScheduleFilter, setInternalScheduleFilter] = useState<'all' | 'overdue' | 'today' | 'due_soon' | 'no_date'>('all');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState<boolean>(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 20;

  const activeScheduleFilter = scheduleAlertFilter !== undefined ? scheduleAlertFilter : internalScheduleFilter;

  const handleSetScheduleFilter = (filter: 'all' | 'overdue' | 'today' | 'due_soon' | 'no_date') => {
    if (onScheduleAlertFilterChange) {
      onScheduleAlertFilterChange(filter);
    }
    setInternalScheduleFilter(filter);
    setCurrentPage(1);
  };

  // Handle click outside to close status dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const todayStr = useMemo(() => getTodayDateStr(), []);

  // Pre-calculate schedule urgency for each plant
  const plantStatusMap = useMemo(() => {
    const map = new Map<string, PlantScheduleStatus>();
    plants.forEach((p) => {
      map.set(p.id, getPlantScheduleStatus(p, rounds, todayStr));
    });
    return map;
  }, [plants, rounds, todayStr]);

  // Counts by schedule urgency
  const scheduleCounts = useMemo(() => {
    let overdue = 0, today = 0, due_soon = 0, no_date = 0;
    plants.forEach((p) => {
      const st = plantStatusMap.get(p.id);
      if (st?.urgency === 'overdue') overdue++;
      else if (st?.urgency === 'today') today++;
      else if (st?.urgency === 'due_soon') due_soon++;
      else if (st?.urgency === 'no_date') no_date++;
    });
    return { overdue, today, due_soon, no_date };
  }, [plants, plantStatusMap]);

  // Extract unique locations for filter dropdown
  const uniqueLocations = useMemo(() => {
    const locs = new Set<string>();
    plants.forEach((p) => {
      if (p.locationArea) locs.add(p.locationArea.trim());
    });
    return Array.from(locs).sort();
  }, [plants]);

  // Count plants by exact status category
  const statusCounts = useMemo(() => {
    let send = 0, signed = 0, paid_active = 0, waiting = 0, not_renew = 0, expired = 0, blank = 0;
    plants.forEach((p) => {
      const cat = getStatusCategory(p.status);
      if (cat === 'send') send++;
      else if (cat === 'signed') signed++;
      else if (cat === 'paid_active') paid_active++;
      else if (cat === 'waiting') waiting++;
      else if (cat === 'not_renew') not_renew++;
      else if (cat === 'expired') expired++;
      else blank++;
    });
    return { send, signed, paid_active, waiting, not_renew, expired, blank };
  }, [plants]);

  // Filtered and searched plants
  const filteredPlants = useMemo(() => {
    return plants.filter((plant) => {
      const query = searchQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        plant.solarPlant.toLowerCase().includes(query) ||
        plant.locationArea.toLowerCase().includes(query) ||
        (plant.propertyVillage && plant.propertyVillage.toLowerCase().includes(query)) ||
        plant.contactName.toLowerCase().includes(query) ||
        plant.tel.toLowerCase().includes(query) ||
        String(plant.queueNumber).includes(query);

      let matchStatus = true;
      if (filterStatus !== 'all') {
        const cat = getStatusCategory(plant.status);
        matchStatus = cat === filterStatus;
      }

      let matchLoc = true;
      if (filterLocation !== 'all') {
        matchLoc = plant.locationArea === filterLocation;
      }

      let matchSchedule = true;
      if (activeScheduleFilter !== 'all') {
        const st = plantStatusMap.get(plant.id);
        if (activeScheduleFilter === 'overdue') matchSchedule = st?.urgency === 'overdue';
        else if (activeScheduleFilter === 'today') matchSchedule = st?.urgency === 'today';
        else if (activeScheduleFilter === 'due_soon') matchSchedule = st?.urgency === 'due_soon';
        else if (activeScheduleFilter === 'no_date') matchSchedule = st?.urgency === 'no_date';
      }

      return matchSearch && matchStatus && matchLoc && matchSchedule;
    });
  }, [plants, searchQuery, filterStatus, filterLocation, activeScheduleFilter, plantStatusMap]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredPlants.length / pageSize));
  const paginatedPlants = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPlants.slice(start, start + pageSize);
  }, [filteredPlants, currentPage]);

  // Status Badge
  const getStatusBadge = (status: string, isCurrentQueue: boolean) => {
    if (isCurrentQueue) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-1.5 animate-pulse" />
          Current Queue
        </span>
      );
    }

    const cat = getStatusCategory(status);
    const cfg = STATUS_CONFIG[cat];
    const displayLabel = status && status !== '(ว่าง)' && status !== '(Blank)' && status !== '-' ? status : '(Blank)';

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] ${cfg.pill}`}>
        {displayLabel}
      </span>
    );
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl overflow-hidden shadow-sm my-5">
      
      {/* Search & Filter Header Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-800/60 flex flex-col space-y-3 bg-slate-900/40">
        
        {/* Row 1: Search + Status Dropdown + Location Dropdown + Add Customer */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          
          {/* Instant Search Bar */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search solar plant, location, or contact..."
              className="w-full bg-slate-950/60 text-xs text-slate-200 pl-9 pr-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-slate-700 transition"
            />
          </div>

          {/* Filter Controls (Status Dropdown Box & Location Dropdown) */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Status Dropdown Box */}
            <div className="relative" ref={statusDropdownRef}>
              <button
                type="button"
                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                className="bg-slate-950/60 hover:bg-slate-900 text-xs text-slate-200 border border-slate-800 hover:border-slate-700 rounded-xl px-3 py-2 flex items-center space-x-2 transition cursor-pointer shadow-sm focus:outline-none"
              >
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400">Status:</span>
                {filterStatus === 'all' ? (
                  <span className="font-semibold text-slate-200">
                    All ({plants.length})
                  </span>
                ) : (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] ${STATUS_CONFIG[filterStatus]?.pill}`}>
                    {STATUS_CONFIG[filterStatus]?.label} ({statusCounts[filterStatus as keyof typeof statusCounts] || 0})
                  </span>
                )}
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isStatusDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl z-30 py-2 overflow-hidden animate-in fade-in duration-150">
                  <div className="px-3 py-1.5 border-b border-slate-800/80 text-[10px] uppercase font-bold tracking-wider text-slate-500">
                    Filter by Status
                  </div>

                  {/* All option */}
                  <button
                    type="button"
                    onClick={() => {
                      setFilterStatus('all');
                      setIsStatusDropdownOpen(false);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800/80 transition ${
                      filterStatus === 'all' ? 'bg-blue-600/10 text-blue-400 font-bold' : 'text-slate-300'
                    }`}
                  >
                    <span>All Statuses</span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {plants.length}
                    </span>
                  </button>

                  {/* Status Options */}
                  {STATUS_OPTIONS.map((opt) => {
                    const count = statusCounts[opt.id as keyof typeof statusCounts] || 0;
                    const isSelected = filterStatus === opt.id;

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setFilterStatus(opt.id);
                          setIsStatusDropdownOpen(false);
                          setCurrentPage(1);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800/80 transition ${
                          isSelected ? 'bg-blue-600/10 text-blue-400 font-bold' : 'text-slate-300'
                        }`}
                      >
                        <span className="flex items-center space-x-2">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] ${opt.pill}`}>
                            {opt.label}
                          </span>
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono flex items-center">
                          {count}
                          {isSelected && <Check className="w-3.5 h-3.5 text-blue-400 ml-1.5" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Location Dropdown */}
            <select
              value={filterLocation}
              onChange={(e) => {
                setFilterLocation(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-950/60 hover:bg-slate-900 text-xs text-slate-300 border border-slate-800 hover:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:border-slate-700 transition cursor-pointer shadow-sm"
            >
              <option value="all">📍 All Locations ({uniqueLocations.length})</option>
              {uniqueLocations.map((loc) => (
                <option key={loc} value={loc} className="bg-slate-900 text-slate-200">
                  {loc}
                </option>
              ))}
            </select>

            {/* Add Customer Button */}
            {onOpenAddPlant && (
              <button
                type="button"
                onClick={onOpenAddPlant}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add Customer</span>
              </button>
            )}
          </div>

        </div>

        {/* Row 2: Quick Schedule Alerts Filter Tabs (Due Soon & Overdue) */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/40">
          <span className="text-[11px] text-slate-500 font-semibold mr-1 flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Schedule Alert:</span>
          </span>

          {/* All */}
          <button
            type="button"
            onClick={() => handleSetScheduleFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeScheduleFilter === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800/80'
            }`}
          >
            All ({plants.length})
          </button>

          {/* Overdue */}
          <button
            type="button"
            onClick={() => handleSetScheduleFilter('overdue')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
              activeScheduleFilter === 'overdue'
                ? 'bg-rose-600 text-white shadow-sm'
                : scheduleCounts.overdue > 0
                ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-slate-950/60 hover:bg-slate-800 text-slate-500 border border-slate-800/80'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${scheduleCounts.overdue > 0 ? 'bg-rose-400 animate-pulse' : 'bg-slate-500'}`} />
            <span>🔴 Overdue ({scheduleCounts.overdue})</span>
          </button>

          {/* Due Today */}
          <button
            type="button"
            onClick={() => handleSetScheduleFilter('today')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
              activeScheduleFilter === 'today'
                ? 'bg-amber-600 text-white shadow-sm'
                : scheduleCounts.today > 0
                ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-slate-950/60 hover:bg-slate-800 text-slate-500 border border-slate-800/80'
            }`}
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span>🟡 Due Today ({scheduleCounts.today})</span>
          </button>

          {/* Due Next 7 Days */}
          <button
            type="button"
            onClick={() => handleSetScheduleFilter('due_soon')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
              activeScheduleFilter === 'due_soon'
                ? 'bg-blue-600 text-white shadow-sm'
                : scheduleCounts.due_soon > 0
                ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-slate-950/60 hover:bg-slate-800 text-slate-500 border border-slate-800/80'
            }`}
          >
            <Calendar className="w-3 h-3 text-blue-400" />
            <span>🔵 Next 7 Days ({scheduleCounts.due_soon})</span>
          </button>

          {/* Needs Scheduling */}
          <button
            type="button"
            onClick={() => handleSetScheduleFilter('no_date')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
              activeScheduleFilter === 'no_date'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'bg-slate-950/60 hover:bg-slate-800 text-slate-400 border border-slate-800/80'
            }`}
          >
            <Clock className="w-3 h-3 text-slate-400" />
            <span>⚪ Needs Date ({scheduleCounts.no_date})</span>
          </button>
        </div>

      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950/40 text-slate-400 border-b border-slate-800/60 text-[11px] uppercase tracking-wider font-semibold">
              <th className="py-3 px-3 w-12 text-center">Queue</th>
              <th className="py-3 px-4">Solar Plant</th>
              <th className="py-3 px-3">Location</th>
              <th className="py-3 px-3 text-right">Capacity</th>
              <th className="py-3 px-3 text-center">Status</th>
              <th className="py-3 px-3">Latest Maint.</th>
              <th className="py-3 px-3">Next Schedule</th>
              <th className="py-3 px-3 text-center">Count</th>
              <th className="py-3 px-3 text-center">Team</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {paginatedPlants.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-500 text-xs">
                  No solar plants found matching your search and schedule alert criteria.
                </td>
              </tr>
            ) : (
              paginatedPlants.map((plant) => {
                const isCurrent = plant.id === queueState.activePlantId;
                const plantRounds = rounds.filter((r) => r.solarPlantId === plant.id);
                const latestRound = plantRounds.find((r) => r.roundNumber === plant.totalCount);
                const schedStatus = plantStatusMap.get(plant.id);

                return (
                  <tr
                    key={plant.id}
                    className={`transition-colors hover:bg-slate-800/30 ${
                      isCurrent ? 'bg-blue-950/20' : ''
                    }`}
                  >
                    {/* Queue No. */}
                    <td className="py-3.5 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                        isCurrent 
                          ? 'bg-blue-500 text-white' 
                          : 'text-slate-400'
                      }`}>
                        #{plant.queueNumber}
                      </span>
                    </td>

                    {/* Solar Plant Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onSelectPlant(plant)}
                          className="font-bold text-white hover:text-blue-400 text-sm text-left transition truncate max-w-[220px] sm:max-w-xs cursor-pointer"
                          title={plant.solarPlant}
                        >
                          {plant.solarPlant}
                        </button>
                        {plant.mapUrl && (
                          <a
                            href={plant.mapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open Google Maps"
                            className="text-slate-500 hover:text-rose-400 flex-shrink-0"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                      {plant.contactName && (
                        <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                          👤 {plant.contactName}
                        </span>
                      )}
                    </td>

                    {/* Location & Property / Village */}
                    <td className="py-3.5 px-3 text-slate-300">
                      <span className="truncate block max-w-[140px] font-medium" title={plant.locationArea}>
                        {plant.locationArea || '-'}
                      </span>
                      {plant.propertyVillage && (
                        <span className="text-[10px] text-slate-400 block truncate max-w-[140px] mt-0.5" title={plant.propertyVillage}>
                          🏡 {plant.propertyVillage}
                        </span>
                      )}
                    </td>

                    {/* Capacity (kW) */}
                    <td className="py-3.5 px-3 text-right font-medium text-slate-300">
                      {plant.capacityKw ? `${plant.capacityKw} kW` : '-'}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3 text-center">
                      {getStatusBadge(plant.status, isCurrent)}
                    </td>

                    {/* Latest Maintenance */}
                    <td className="py-3.5 px-3 text-slate-300">
                      <span className="font-mono text-xs">{plant.latestMaintenance || '-'}</span>
                    </td>

                    {/* Next Schedule (WITH URGENCY BADGE) */}
                    <td className="py-3.5 px-3">
                      {(() => {
                        if (!schedStatus) return <span className="text-slate-500">-</span>;

                        if (schedStatus.urgency === 'overdue') {
                          return (
                            <div className="flex flex-col">
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 w-fit">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse mr-0.5" />
                                <span>Overdue {schedStatus.diffDays}d</span>
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                                Rd {schedStatus.roundNumber}: {formatDateDMY(schedStatus.scheduledDate)}
                              </span>
                            </div>
                          );
                        }

                        if (schedStatus.urgency === 'today') {
                          return (
                            <div className="flex flex-col">
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/35 w-fit">
                                <Zap className="w-3 h-3 text-amber-400" />
                                <span>Due Today!</span>
                              </span>
                              <span className="text-[10px] text-amber-300/80 font-mono mt-0.5">
                                Round {schedStatus.roundNumber}
                              </span>
                            </div>
                          );
                        }

                        if (schedStatus.urgency === 'due_soon') {
                          return (
                            <div className="flex flex-col">
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/25 w-fit">
                                <Calendar className="w-3 h-3 text-blue-400" />
                                <span>In {Math.abs(schedStatus.diffDays || 0)}d</span>
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                                Rd {schedStatus.roundNumber}: {formatDateDMY(schedStatus.scheduledDate)}
                              </span>
                            </div>
                          );
                        }

                        if (schedStatus.urgency === 'future') {
                          return (
                            <div className="flex flex-col">
                              <span className="text-xs text-slate-200 font-mono">
                                {formatDateDMY(schedStatus.scheduledDate)}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                Round {schedStatus.roundNumber}
                              </span>
                            </div>
                          );
                        }

                        if (schedStatus.urgency === 'no_date') {
                          return (
                            <span className="text-[11px] text-slate-500 italic">
                              Rd {schedStatus.roundNumber}: No date
                            </span>
                          );
                        }

                        return (
                          <span className="text-[11px] text-emerald-400 font-medium flex items-center space-x-1">
                            <Check className="w-3 h-3" />
                            <span>All Done</span>
                          </span>
                        );
                      })()}
                    </td>

                    {/* Count */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="font-bold text-emerald-400 text-sm">{plant.totalCount || 0}</span>
                      <span className="text-slate-500 text-xs"> / {plant.omContractCount || 4}</span>
                    </td>

                    {/* Team */}
                    <td className="py-3.5 px-3 text-center text-slate-400 text-xs">
                      {latestRound?.teamName || 'Team A'}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => onSelectPlant(plant)}
                          title="View Details"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {!isCurrent && (
                          <button
                            onClick={() => onSetQueue(plant.id)}
                            title="Jump Queue Here"
                            className="p-1.5 rounded-lg text-blue-400 hover:text-white hover:bg-blue-600 transition cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400 bg-slate-950/40">
        <div>
          Showing {filteredPlants.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredPlants.length)} of {filteredPlants.length} plants
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
};
