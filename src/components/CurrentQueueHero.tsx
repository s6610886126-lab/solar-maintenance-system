import React, { useState } from 'react';
import { 
  Check, 
  ChevronRight, 
  MapPin, 
  RotateCw, 
  Users, 
  Zap, 
  CheckCircle2, 
  ExternalLink,
  ChevronLeft
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SolarPlant, QueueState, Team, UserRole } from '../types/maintenance';
import { playChime } from '../lib/notification';

interface CurrentQueueHeroProps {
  currentPlant: SolarPlant | null;
  queueState: QueueState;
  allPlants: SolarPlant[];
  teams: Team[];
  userRole: UserRole;
  isCompletedThisRound: boolean;
  onComplete: (plantId: string, roundNumber: number, teamName: string) => Promise<boolean>;
  onNextQueue: () => Promise<void>;
  onSelectPlant: (plant: SolarPlant) => void;
  onJumpToQueue: (plantId: string) => void;
  onOpenImport?: () => void;
  onRestoreSeed?: () => void;
}

export const CurrentQueueHero: React.FC<CurrentQueueHeroProps> = ({
  currentPlant,
  queueState,
  allPlants,
  teams,
  userRole,
  isCompletedThisRound,
  onComplete,
  onNextQueue,
  onSelectPlant,
  onJumpToQueue,
  onOpenImport,
  onRestoreSeed,
}) => {
  const [selectedTeam, setSelectedTeam] = useState<string>(teams[0]?.name || 'Team A');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!currentPlant || allPlants.length === 0) {
    return (
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-10 text-center my-6 space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-400">
          <RotateCw className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">No Plant Data in System</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            All plant data has been cleared. You can import your Excel file (.xlsx) to set up new queues, or restore the seed demo dataset.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {onOpenImport && (
            <button
              onClick={onOpenImport}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow transition"
            >
              📥 Import Excel (.xlsx)
            </button>
          )}
          {onRestoreSeed && (
            <button
              onClick={onRestoreSeed}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 transition"
            >
              🔄 Restore Seed Data (279 Plants)
            </button>
          )}
        </div>
      </div>
    );
  }

  const currentIndex = queueState.currentQueueIndex - 1;
  const nextPlant = allPlants[(currentIndex + 1) % allPlants.length];
  const prevPlant = allPlants[(currentIndex - 1 + allPlants.length) % allPlants.length];

  const handleCompleteClick = async () => {
    if (isCompletedThisRound || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const success = await onComplete(currentPlant.id, queueState.currentRound, selectedTeam);
      if (success) {
        playChime('success');
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.65 },
          colors: ['#10B981', '#3B82F6', '#F59E0B'],
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextClick = async () => {
    if (userRole === 'viewer') return;
    setIsSubmitting(true);
    try {
      playChime('next');
      await onNextQueue();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-sm hover:border-slate-700/60 transition-colors my-5">
      
      {/* 1. Header Info Bar: Badges & Next Queue */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-800/60">
        
        {/* Left: Queue No, Round, and Status */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-extrabold px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Queue #{queueState.currentQueueIndex} of {allPlants.length}
          </span>

          <span className="font-bold px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
            Round {queueState.currentRound}
          </span>

          <span className={`font-semibold px-3 py-1 rounded-full flex items-center space-x-1.5 ${
            isCompletedThisRound
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isCompletedThisRound ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span>{isCompletedThisRound ? 'Completed for this Round' : 'Ready for Maintenance'}</span>
          </span>
        </div>

        {/* Right: Next Queue Quick Trigger */}
        <div className="flex items-center space-x-3 text-xs">
          {nextPlant && (
            <span className="text-slate-400 hidden sm:inline truncate max-w-xs">
              Next Queue: <strong className="text-slate-200">{nextPlant.solarPlant}</strong>
            </span>
          )}

          {userRole !== 'viewer' && (
            <button
              onClick={handleNextClick}
              disabled={isSubmitting}
              className="flex items-center space-x-1 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl font-medium border border-slate-700/80 transition active:scale-95 disabled:opacity-50"
            >
              <span>Next Queue</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      </div>

      {/* 2. Main Plant Hero Area */}
      <div className="py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* Plant Details */}
        <div className="lg:col-span-8 space-y-3">
          <div>
            <h1
              onClick={() => onSelectPlant(currentPlant)}
              className="text-2xl sm:text-3xl font-black text-white hover:text-blue-400 cursor-pointer transition tracking-tight flex items-center space-x-2"
              title="Click to view full plant details"
            >
              <span>{currentPlant.solarPlant}</span>
              <ExternalLink className="w-4 h-4 text-slate-500 hover:text-blue-400 inline" />
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1.5">
              <span className="flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentPlant.locationArea || 'Unspecified Area'}</span>
                {currentPlant.propertyVillage && <span className="text-slate-500">• {currentPlant.propertyVillage}</span>}
              </span>

              {currentPlant.capacityKw && (
                <span className="flex items-center space-x-1 text-slate-300">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>{currentPlant.capacityKw} kW</span>
                </span>
              )}

              {currentPlant.mapUrl && (
                <a
                  href={currentPlant.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline flex items-center space-x-1"
                >
                  <span>📍 Google Maps</span>
                </a>
              )}
            </div>
          </div>

          {/* Clean Meta Row */}
          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
            {currentPlant.contactName && (
              <span className="px-3 py-1.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
                👤 Contact: <strong className="text-slate-200">{currentPlant.contactName}</strong> {currentPlant.tel ? `(${currentPlant.tel})` : ''}
              </span>
            )}

            <span className="px-3 py-1.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
              O&M Contract: <strong className="text-amber-300">{currentPlant.omContractCount || 4} times / year</strong>
            </span>

            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-slate-950/40 border border-slate-800/80">
              <span>Team:</span>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="bg-transparent text-emerald-400 font-semibold focus:outline-none cursor-pointer"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.name} className="bg-slate-900 text-slate-200">
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Action Button & Count Box */}
        <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col items-stretch lg:items-end justify-center gap-3">
          
          {/* Maintenance Count Pill */}
          <div className="flex items-center justify-between sm:justify-end space-x-3 text-xs text-slate-400 px-1">
            <span>Times Completed:</span>
            <span className="text-xl font-black text-emerald-400">
              {currentPlant.totalCount || 0}
              <span className="text-xs text-slate-500 font-normal ml-1">/ {currentPlant.omContractCount || 4}</span>
            </span>
          </div>

          {/* Clean Big Action Button: [ ✓ Complete Round +1 ] */}
          <button
            onClick={handleCompleteClick}
            disabled={isCompletedThisRound || isSubmitting || userRole === 'viewer'}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-center space-x-2 transition-all ${
              isCompletedThisRound
                ? 'bg-slate-800/80 text-slate-500 border border-slate-700/60 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 active:scale-[0.98]'
            }`}
          >
            {isCompletedThisRound ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Completed for this Round (Locked)</span>
              </>
            ) : (
              <>
                <Check className="w-5 h-5 stroke-[2.5]" />
                <span>Complete Round +1</span>
              </>
            )}
          </button>

          <p className="text-[11px] text-slate-500 text-center lg:text-right">
            {isCompletedThisRound
              ? `* Unlocks when queue cycles to Round ${queueState.currentRound + 1}`
              : `* 1 maintenance count allowed per plant per round`}
          </p>

        </div>

      </div>

      {/* 3. Subtle Circular Queue Navigator */}
      <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
        <button
          onClick={() => prevPlant && onJumpToQueue(prevPlant.id)}
          className="hover:text-slate-300 flex items-center space-x-1 transition"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="truncate max-w-[120px] sm:max-w-xs">{prevPlant?.solarPlant || 'Previous Queue'}</span>
        </button>

        <span className="text-[11px] text-slate-600">
          Circular Queue Loop Sequence
        </span>

        <button
          onClick={() => nextPlant && onJumpToQueue(nextPlant.id)}
          className="hover:text-slate-300 flex items-center space-x-1 transition"
        >
          <span className="truncate max-w-[120px] sm:max-w-xs">{nextPlant?.solarPlant || 'Next Queue'}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
};
