import React from 'react';
import { 
  Sun, 
  RotateCw, 
  Calendar, 
  FileText, 
  History, 
  Upload, 
  Download, 
  Users, 
  Settings, 
  Bell, 
  BellRing, 
  Layers,
  MoreVertical,
  Plus
} from 'lucide-react';
import { UserRole } from '../types/maintenance';

interface NavbarProps {
  currentTab: 'dashboard' | 'queue' | 'schedule' | 'reports';
  setCurrentTab: (tab: 'dashboard' | 'queue' | 'schedule' | 'reports') => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  isSupabaseLive: boolean;
  hasNotification: boolean;
  onToggleNotification: () => void;
  onOpenAddPlant?: () => void;
  onOpenImport: () => void;
  onOpenExport: () => void;
  onOpenHistory: () => void;
  onOpenTeams: () => void;
  onOpenSettings: () => void;
  currentQueueIndex: number;
  currentRound: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  userRole,
  setUserRole,
  isSupabaseLive,
  hasNotification,
  onToggleNotification,
  onOpenAddPlant,
  onOpenImport,
  onOpenExport,
  onOpenHistory,
  onOpenTeams,
  onOpenSettings,
  currentQueueIndex,
  currentRound,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab('dashboard')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center shadow-sm">
              <Sun className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white">
                Solar Maintenance
              </span>
              <span className="text-[10px] text-slate-400 block -mt-0.5">
                Queue & Round Management
              </span>
            </div>
          </div>

          {/* Clean Segmented Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                currentTab === 'dashboard'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Dashboard
            </button>

            <button
              onClick={() => setCurrentTab('queue')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                currentTab === 'queue'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Current Queue</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-950 text-emerald-300 font-bold">
                Q{currentQueueIndex}
              </span>
            </button>

            <button
              onClick={() => setCurrentTab('schedule')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                currentTab === 'schedule'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Schedule Matrix
            </button>

            <button
              onClick={() => setCurrentTab('reports')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                currentTab === 'reports'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              MA Reports
            </button>
          </nav>

          {/* Right Utilities */}
          <div className="flex items-center space-x-2 text-xs">
            
            {/* Quick Action Pills */}
            {onOpenAddPlant && (
              <button
                onClick={onOpenAddPlant}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition cursor-pointer shadow-sm shadow-blue-500/20"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add Customer</span>
              </button>
            )}

            <button
              onClick={onOpenImport}
              className="hidden lg:flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-medium transition"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Import</span>
            </button>

            <button
              onClick={onOpenExport}
              className="hidden lg:flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-medium transition"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Export</span>
            </button>

            {/* Notification */}
            <button
              onClick={onToggleNotification}
              title={hasNotification ? "Notification Active" : "Enable Notification"}
              className={`p-2 rounded-lg border transition ${
                hasNotification 
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400' 
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {hasNotification ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            </button>

            {/* History */}
            <button
              onClick={onOpenHistory}
              title="Audit Logs"
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
            >
              <History className="w-4 h-4" />
            </button>

            {/* Teams */}
            <button
              onClick={onOpenTeams}
              title="Teams"
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
            >
              <Users className="w-4 h-4" />
            </button>

            {/* Role Switcher */}
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value as UserRole)}
              className="bg-slate-900 text-slate-300 border border-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
            >
              <option value="admin">Admin</option>
              <option value="technician">Tech</option>
              <option value="viewer">View</option>
            </select>

          </div>

        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden border-t border-slate-800/60 py-2 justify-between">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`flex-1 text-center py-1 text-xs font-semibold rounded-lg ${
              currentTab === 'dashboard' ? 'bg-slate-800 text-white' : 'text-slate-400'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setCurrentTab('queue')}
            className={`flex-1 text-center py-1 text-xs font-semibold rounded-lg ${
              currentTab === 'queue' ? 'bg-emerald-600 text-white' : 'text-slate-400'
            }`}
          >
            Queue ({currentQueueIndex})
          </button>
          <button
            onClick={() => setCurrentTab('schedule')}
            className={`flex-1 text-center py-1 text-xs font-semibold rounded-lg ${
              currentTab === 'schedule' ? 'bg-slate-800 text-white' : 'text-slate-400'
            }`}
          >
            Matrix
          </button>
          <button
            onClick={() => setCurrentTab('reports')}
            className={`flex-1 text-center py-1 text-xs font-semibold rounded-lg ${
              currentTab === 'reports' ? 'bg-slate-800 text-white' : 'text-slate-400'
            }`}
          >
            Reports
          </button>
        </div>

      </div>
    </header>
  );
};
