import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { StatsOverview } from './components/StatsOverview';
import { CurrentQueueHero } from './components/CurrentQueueHero';
import { ScheduleTable } from './components/ScheduleTable';
import { ScheduleMatrix } from './components/ScheduleMatrix';
import { MAReportTracking } from './components/MAReportTracking';
import { PlantDetailModal } from './components/PlantDetailModal';
import { HistoryLogModal } from './components/HistoryLogModal';
import { ExcelImportModal } from './components/ExcelImportModal';
import { TeamManagerModal } from './components/TeamManagerModal';
import { SettingsModal } from './components/SettingsModal';
import { AddPlantModal } from './components/AddPlantModal';

import { dataService } from './lib/dataService';
import { exportToExcel } from './lib/excelHandler';
import { 
  requestNotificationPermission, 
  hasNotificationPermission, 
  sendBrowserNotification 
} from './lib/notification';
import { SolarPlant, UserRole } from './types/maintenance';
import { CheckCircle2, AlertCircle, Download, FileSpreadsheet, Layers, RefreshCw } from 'lucide-react';

export function App() {
  // Navigation
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'queue' | 'schedule' | 'reports'>('dashboard');
  const [userRole, setUserRole] = useState<UserRole>('admin');

  // Modals state
  const [selectedPlant, setSelectedPlant] = useState<SolarPlant | null>(null);
  const [showAddPlantModal, setShowAddPlantModal] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [showTeamsModal, setShowTeamsModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);

  // Notifications
  const [hasNotification, setHasNotification] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Schedule Alert filter state ('all' | 'overdue' | 'today' | 'due_soon' | 'no_date')
  const [scheduleAlertFilter, setScheduleAlertFilter] = useState<'all' | 'overdue' | 'today' | 'due_soon' | 'no_date'>('all');

  // Data from Service
  const [plants, setPlants] = useState(dataService.getPlants());
  const [rounds, setRounds] = useState(dataService.getRounds());
  const [history, setHistory] = useState(dataService.getHistory());
  const [reports, setReports] = useState(dataService.getReports());
  const [teams, setTeams] = useState(dataService.getTeams());
  const [queueState, setQueueState] = useState(dataService.getQueueState());
  const [isSupabaseLive, setIsSupabaseLive] = useState(dataService.isSupabaseConnected());

  // Show toast notification
  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Initialize Data Service and Listeners
  useEffect(() => {
    dataService.init().then(() => {
      syncState();
    });

    const unsubscribe = dataService.subscribe(() => {
      syncState();
    });

    setHasNotification(hasNotificationPermission());

    return () => {
      unsubscribe();
    };
  }, []);

  const syncState = () => {
    setPlants([...dataService.getPlants()]);
    setRounds([...dataService.getRounds()]);
    setHistory([...dataService.getHistory()]);
    setReports([...dataService.getReports()]);
    setTeams([...dataService.getTeams()]);
    setQueueState({ ...dataService.getQueueState() });
    setIsSupabaseLive(dataService.isSupabaseConnected());
  };

  const currentPlant = dataService.getCurrentPlant();
  const isCurrentPlantDoneThisRound = currentPlant 
    ? dataService.isPlantCompletedForRound(currentPlant.id, queueState.currentRound) 
    : false;

  // Toggle Browser Notifications
  const handleToggleNotification = async () => {
    const granted = await requestNotificationPermission();
    setHasNotification(granted);
    if (granted) {
      showToast('Browser notifications enabled successfully', 'success');
      sendBrowserNotification('Solar Maintenance Schedule', 'Notifications are now active');
    } else {
      showToast('Please enable notifications in your browser settings', 'info');
    }
  };

  // Action: Complete Maintenance (+1 Count)
  const handleCompleteMaintenance = async (plantId: string, roundNumber: number, teamName: string): Promise<boolean> => {
    const result = await dataService.completeMaintenance(
      plantId,
      roundNumber,
      teamName,
      userRole === 'admin' ? 'Admin' : 'Technician'
    );

    if (result.success) {
      showToast(`✓ Completed: ${currentPlant?.solarPlant} counted +1 (Count: ${result.newCount}) in Round ${roundNumber}`, 'success');
      
      // Notify via system browser notification
      if (hasNotification) {
        sendBrowserNotification(
          '✓ Round Completed',
          `${currentPlant?.solarPlant} completed in Round ${roundNumber} (Count: ${result.newCount})`
        );
      }
      return true;
    } else {
      showToast(result.message || 'An error occurred while saving', 'error');
      return false;
    }
  };

  // Action: Next Queue
  const handleNextQueue = async () => {
    const res = await dataService.advanceQueue(userRole === 'admin' ? 'Admin' : 'Technician');
    if (res.success) {
      showToast(`▶ Advanced to next queue: ${res.nextPlantName} (Round ${res.round})`, 'info');
      
      if (hasNotification && res.nextPlantName) {
        sendBrowserNotification(
          '🟢 Current Turn',
          `${res.nextPlantName} is now active for maintenance`
        );
      }
    }
  };

  // Action: Set Queue to specific plant
  const handleSetQueue = (plantId: string) => {
    dataService.setQueueToPlant(plantId, userRole === 'admin' ? 'Admin' : 'Technician');
    const p = dataService.getPlantById(plantId);
    showToast(`Queue switched to: ${p?.solarPlant}`, 'info');
  };

  // Action: Add Customer / Plant
  const handleAddPlant = (plantData: Partial<SolarPlant> & { solarPlant: string }) => {
    const added = dataService.addPlant(plantData);
    showToast(`Added customer "${added.solarPlant}" (Queue #${added.queueNumber})`, 'success');
  };

  // Action: Delete Plant
  const handleDeletePlant = (plantId: string) => {
    const plant = plants.find((p) => p.id === plantId);
    dataService.deletePlant(plantId);
    showToast(`Deleted customer "${plant?.solarPlant || plantId}" successfully`, 'info');
  };

  // Action: Export Excel
  const handleExport = async (type: 'schedule' | 'history' | 'reports' | 'all') => {
    setShowExportMenu(false);
    showToast(`Generating Excel export (${type})...`, 'info');
    try {
      await exportToExcel(type, {
        plants,
        rounds,
        history,
        reports,
      });
      showToast('Excel file downloaded successfully', 'success');
    } catch (e: any) {
      showToast('Export failed: ' + e.message, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white pb-16">
      
      {/* 1. Header Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        userRole={userRole}
        setUserRole={setUserRole}
        isSupabaseLive={isSupabaseLive}
        hasNotification={hasNotification}
        onToggleNotification={handleToggleNotification}
        onOpenAddPlant={() => setShowAddPlantModal(true)}
        onOpenImport={() => setShowImportModal(true)}
        onOpenExport={() => setShowExportMenu(!showExportMenu)}
        onOpenHistory={() => setShowHistoryModal(true)}
        onOpenTeams={() => setShowTeamsModal(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
        currentQueueIndex={queueState.currentQueueIndex}
        currentRound={queueState.currentRound}
      />

      {/* Export Dropdown Menu */}
      {showExportMenu && (
        <div className="fixed top-16 right-20 z-50 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 w-56 text-xs animate-in fade-in zoom-in-95 duration-150">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2.5 py-1">
            Export Format
          </div>
          <button
            onClick={() => handleExport('schedule')}
            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center space-x-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Current Schedule</span>
          </button>
          <button
            onClick={() => handleExport('history')}
            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center space-x-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-400" />
            <span>Maintenance History</span>
          </button>
          <button
            onClick={() => handleExport('reports')}
            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center space-x-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-purple-400" />
            <span>MA Reports</span>
          </button>
          <div className="border-t border-slate-800 my-1" />
          <button
            onClick={() => handleExport('all')}
            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-emerald-400 font-bold flex items-center space-x-2"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>All Data (All Sheets)</span>
          </button>
        </div>
      )}

      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div className={`p-4 rounded-xl shadow-2xl border flex items-center space-x-3 text-xs sm:text-sm font-semibold max-w-md ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200 shadow-emerald-900/30'
              : toastMessage.type === 'error'
              ? 'bg-rose-950/90 border-rose-500 text-rose-200 shadow-rose-900/30'
              : 'bg-blue-950/90 border-blue-500 text-blue-200 shadow-blue-900/30'
          }`}>
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main App Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 w-full mt-4">
        
        {/* KPI Top Stat Cards & Schedule Alerts */}
        <StatsOverview
          plants={plants}
          rounds={rounds}
          queueState={queueState}
          history={history}
          onSelectQueueView={() => setCurrentTab('queue')}
          onFilterScheduleAlert={(alertType) => {
            setScheduleAlertFilter(alertType);
            setCurrentTab('dashboard');
          }}
        />

        {/* VIEW 1: DASHBOARD (Current Queue Banner + Full Table) */}
        {currentTab === 'dashboard' && (
          <div className="space-y-6">
            <CurrentQueueHero
              currentPlant={currentPlant}
              queueState={queueState}
              allPlants={plants}
              teams={teams}
              userRole={userRole}
              isCompletedThisRound={isCurrentPlantDoneThisRound}
              onComplete={handleCompleteMaintenance}
              onNextQueue={handleNextQueue}
              onSelectPlant={(p) => setSelectedPlant(p)}
              onJumpToQueue={handleSetQueue}
              onOpenImport={() => setShowImportModal(true)}
              onRestoreSeed={() => {
                dataService.restoreSeedData();
                showToast('Restored 279 sample solar plants successfully', 'success');
              }}
            />

            <ScheduleTable
              plants={plants}
              rounds={rounds}
              queueState={queueState}
              onSelectPlant={(p) => setSelectedPlant(p)}
              onSetQueue={handleSetQueue}
              onOpenAddPlant={() => setShowAddPlantModal(true)}
              scheduleAlertFilter={scheduleAlertFilter}
              onScheduleAlertFilterChange={setScheduleAlertFilter}
            />
          </div>
        )}

        {/* VIEW 2: DEDICATED CURRENT QUEUE SCREEN (Full screen focus) */}
        {currentTab === 'queue' && (
          <div className="py-4 max-w-5xl mx-auto">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-white">Current Queue & Circular Loop</h2>
                <p className="text-xs text-slate-400">Dedicated operator screen to complete maintenance and advance queue loop.</p>
              </div>
              <button
                onClick={() => setCurrentTab('dashboard')}
                className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center space-x-1"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Back to Dashboard</span>
              </button>
            </div>

            <CurrentQueueHero
              currentPlant={currentPlant}
              queueState={queueState}
              allPlants={plants}
              teams={teams}
              userRole={userRole}
              isCompletedThisRound={isCurrentPlantDoneThisRound}
              onComplete={handleCompleteMaintenance}
              onNextQueue={handleNextQueue}
              onSelectPlant={(p) => setSelectedPlant(p)}
              onJumpToQueue={handleSetQueue}
              onOpenImport={() => setShowImportModal(true)}
              onRestoreSeed={() => {
                dataService.restoreSeedData();
                showToast('Restored 279 sample solar plants successfully', 'success');
              }}
            />
          </div>
        )}

        {/* VIEW 3: SCHEDULE MATRIX (1st to 12th rounds grid) */}
        {currentTab === 'schedule' && (
          <ScheduleMatrix
            plants={plants}
            rounds={rounds}
            onSelectPlant={(p) => setSelectedPlant(p)}
          />
        )}

        {/* VIEW 4: MA REPORT TRACKING */}
        {currentTab === 'reports' && (
          <MAReportTracking
            reports={reports}
            onCompleteReport={(reportId, date) => {
              dataService.completeMAReport(reportId, date);
              showToast('✓ MA Report marked as delivered successfully', 'success');
            }}
          />
        )}

      </main>

      {/* Modals */}
      {selectedPlant && (
        <PlantDetailModal
          plant={selectedPlant}
          history={history}
          rounds={rounds}
          teams={teams}
          onClose={() => setSelectedPlant(null)}
          onUpdatePlant={(up) => {
            dataService.updatePlant(up);
            showToast('Saved plant details successfully', 'success');
          }}
          onUpdateRound={(plantId, roundNum, data) => {
            dataService.updateRound(plantId, roundNum, data);
            showToast(`Saved Round ${roundNum} schedule successfully`, 'success');
          }}
          onAutoGenerateRounds={(plantId, startDate) => {
            dataService.autoGenerateRoundsSchedule(plantId, startDate);
            showToast('Auto-generated schedule dates for all 12 rounds', 'success');
          }}
          onDeletePlant={handleDeletePlant}
        />
      )}

      {/* Add Customer / Plant Modal */}
      <AddPlantModal
        isOpen={showAddPlantModal}
        onClose={() => setShowAddPlantModal(false)}
        onAddPlant={handleAddPlant}
        existingLocations={Array.from(new Set(plants.map((p) => p.locationArea).filter(Boolean))).sort()}
        nextQueueNumber={plants.length + 1}
      />

      {showHistoryModal && (
        <HistoryLogModal
          history={history}
          onClose={() => setShowHistoryModal(false)}
          onExport={() => handleExport('history')}
        />
      )}

      {showImportModal && (
        <ExcelImportModal
          existingPlants={plants}
          onClose={() => setShowImportModal(false)}
          onConfirmImport={(newP, newR, newRep, mode) => {
            const existingNames = new Set(plants.map((p) => p.solarPlant.trim().toLowerCase()));
            const addedCount = mode === 'add_new_only'
              ? newP.filter((p) => !existingNames.has(p.solarPlant.trim().toLowerCase())).length
              : newP.length;

            dataService.importData(newP, newR, newRep, mode);

            const modeLabel = mode === 'add_new_only' ? 'Added new only' : mode === 'merge_update' ? 'Merged & Updated' : 'Replaced all';
            showToast(`Import Success (${modeLabel}): ${addedCount} Plants processed`, 'success');
          }}
        />
      )}

      {showTeamsModal && (
        <TeamManagerModal
          teams={teams}
          onClose={() => setShowTeamsModal(false)}
          onSaveTeam={(t) => {
            dataService.saveTeam(t);
            showToast(`Saved team ${t.name} successfully`, 'success');
          }}
          onDeleteTeam={(id) => {
            dataService.deleteTeam(id);
            showToast('Team deleted successfully', 'info');
          }}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          onClose={() => setShowSettingsModal(false)}
          onClearData={() => {
            dataService.clearAllData();
            showToast('All data cleared from system', 'info');
          }}
          onRestoreSeed={() => {
            dataService.restoreSeedData();
            showToast('Restored 279 sample solar plants successfully', 'success');
          }}
        />
      )}

    </div>
  );
}
