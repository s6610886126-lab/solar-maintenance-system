import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  Zap, 
  User, 
  Clock, 
  Save, 
  CheckCircle2, 
  History, 
  Edit2,
  Check,
  RotateCw,
  Trash2
} from 'lucide-react';
import { SolarPlant, MaintenanceHistory, MaintenanceRound, Team } from '../types/maintenance';
import { STATUS_CONFIG, getStatusCategory } from '../lib/statusConfig';
import { formatDateDMY } from '../lib/scheduleAlerts';

interface PlantDetailModalProps {
  plant: SolarPlant | null;
  history: MaintenanceHistory[];
  rounds: MaintenanceRound[];
  teams?: Team[];
  onClose: () => void;
  onUpdatePlant: (updated: SolarPlant) => void;
  onUpdateRound?: (plantId: string, roundNumber: number, data: { scheduledDate?: string; teamName?: string; isCompleted?: boolean }) => void;
  onAutoGenerateRounds?: (plantId: string, startDate?: string) => void;
  onDeletePlant?: (plantId: string) => void;
}

export const PlantDetailModal: React.FC<PlantDetailModalProps> = ({
  plant,
  history,
  rounds,
  teams = [],
  onClose,
  onUpdatePlant,
  onUpdateRound,
  onAutoGenerateRounds,
  onDeletePlant,
}) => {
  if (!plant) return null;

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<SolarPlant>({ ...plant });

  // State for inline round editing
  const [editingRoundNum, setEditingRoundNum] = useState<number | null>(null);
  const [roundDate, setRoundDate] = useState<string>('');
  const [roundTeam, setRoundTeam] = useState<string>('Team A');
  const [roundCompleted, setRoundCompleted] = useState<boolean>(false);

  // State for Auto-Schedule Bar
  const [isAutoScheduling, setIsAutoScheduling] = useState<boolean>(false);
  const [autoStartDate, setAutoStartDate] = useState<string>(
    plant.turnOnDate || plant.latestMaintenance || plant.latestRenewContract || new Date().toISOString().split('T')[0]
  );

  const plantHistory = history.filter((h) => h.solarPlantId === plant.id);
  const plantRounds = rounds.filter((r) => r.solarPlantId === plant.id).sort((a, b) => a.roundNumber - b.roundNumber);

  // Ensure all 12 rounds are available to schedule
  const all12Rounds: MaintenanceRound[] = Array.from({ length: 12 }, (_, i) => {
    const rNum = i + 1;
    const existing = plantRounds.find((r) => r.roundNumber === rNum);
    if (existing) return existing;
    return {
      id: `${plant.id}-r${rNum}`,
      solarPlantId: plant.id,
      roundNumber: rNum,
      scheduledDate: '',
      isCompleted: false,
      completedAt: null,
      teamName: 'Team A',
      countNumber: null,
      note: '',
    };
  });

  const handleSavePlant = () => {
    onUpdatePlant(formData);
    setIsEditing(false);
  };

  const handleStartEditRound = (rnd: MaintenanceRound) => {
    setEditingRoundNum(rnd.roundNumber);
    setRoundDate(rnd.scheduledDate || '');
    setRoundTeam(rnd.teamName || 'Team A');
    setRoundCompleted(rnd.isCompleted || false);
  };

  const handleSaveRound = (roundNumber: number) => {
    if (onUpdateRound) {
      onUpdateRound(plant.id, roundNumber, {
        scheduledDate: roundDate,
        teamName: roundTeam,
        isCompleted: roundCompleted,
      });
    }
    setEditingRoundNum(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/60">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Queue #{plant.queueNumber}
              </span>
              {isEditing ? (
                <select
                  value={formData.status || 'Paid / Active'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="bg-slate-900 text-xs font-semibold text-white border border-slate-700 rounded-lg px-2 py-0.5 focus:outline-none cursor-pointer"
                >
                  <option value="Send">Send</option>
                  <option value="Signed">Signed</option>
                  <option value="Paid / Active">Paid / Active</option>
                  <option value="Waiting">Waiting</option>
                  <option value="Not renew">Not renew</option>
                  <option value="Expired">Expired</option>
                  <option value="(Blank)">(Blank)</option>
                </select>
              ) : (
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_CONFIG[getStatusCategory(plant.status)]?.pill}`}>
                  {plant.status && plant.status !== '(ว่าง)' && plant.status !== '(Blank)' && plant.status !== '-' ? plant.status : '(Blank)'}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
              {plant.solarPlant}
            </h2>
            <p className="text-xs text-slate-400 flex items-center space-x-1.5 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 inline" />
              <span>{plant.locationArea || 'Unspecified Area'}</span>
              {plant.propertyVillage && <span>• {plant.propertyVillage}</span>}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {plant.mapUrl && (
              <a
                href={plant.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition"
              >
                <span>📍 Google Maps</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Key Indicators Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800/80">
              <span className="text-[11px] text-slate-400 font-medium block">Capacity</span>
              <span className="text-base font-bold text-white flex items-center space-x-1 mt-0.5">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>{plant.capacityKw ? `${plant.capacityKw} kW` : '-'}</span>
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800/80">
              <span className="text-[11px] text-slate-400 font-medium block">O&M Contract</span>
              <span className="text-base font-bold text-amber-300 mt-0.5 block">
                {plant.omContractCount || 4} times / year
              </span>
              <span className="text-[10px] text-slate-500 block truncate">{plant.maintenancePeriod || '-'}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800/80">
              <span className="text-[11px] text-slate-400 font-medium block">Latest Maintenance</span>
              <span className="text-sm font-bold text-white mt-1 block">
                {plant.latestMaintenance || '-'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800/80">
              <span className="text-[11px] text-slate-400 font-medium block">Total Count</span>
              <span className="text-base font-black text-emerald-400 mt-0.5 block">
                {plant.totalCount || 0} completed
              </span>
            </div>
          </div>

          {/* Plant Details & Contacts (with Editable Dates) */}
          <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                <User className="w-4 h-4 text-blue-400" />
                <span>Contact & Contract Details</span>
              </h3>
              <div className="flex items-center space-x-2">
                {onDeletePlant && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete customer "${plant.solarPlant}" from the system?`)) {
                        onDeletePlant(plant.id);
                        onClose();
                      }
                    }}
                    title="Delete this customer"
                    className="text-xs px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-white border border-rose-800/40 flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Delete Customer</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    if (isEditing) handleSavePlant();
                    else setIsEditing(true);
                  }}
                  className="text-xs px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center space-x-1.5 transition cursor-pointer"
                >
                  {isEditing ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Save Changes</span>
                    </>
                  ) : (
                    <>
                      <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Edit Info</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block mb-1">Contact Name</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                  />
                ) : (
                  <span className="font-semibold text-slate-200 block">{plant.contactName || '-'}</span>
                )}
              </div>

              <div>
                <span className="text-slate-500 block mb-1">Telephone</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.tel}
                    onChange={(e) => setFormData({ ...formData, tel: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                  />
                ) : (
                  <span className="font-semibold text-slate-200 block">{plant.tel || '-'}</span>
                )}
              </div>

              <div>
                <span className="text-slate-500 block mb-1">Email</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                  />
                ) : (
                  <span className="font-semibold text-slate-200 block truncate">{plant.email || '-'}</span>
                )}
              </div>

              <div>
                <span className="text-slate-500 block mb-1">Other Contact</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.otherContact || ''}
                    onChange={(e) => setFormData({ ...formData, otherContact: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                  />
                ) : (
                  <span className="font-semibold text-slate-200 block">{plant.otherContact || '-'}</span>
                )}
              </div>

              <div>
                <span className="text-slate-500 block mb-1">QT & Contract Status</span>
                {isEditing ? (
                  <select
                    value={String(formData.qtContract).toLowerCase() === 'true' || formData.qtContract === 'มี' ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, qtContract: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white cursor-pointer"
                  >
                    <option value="true">TRUE</option>
                    <option value="false">FALSE</option>
                  </select>
                ) : (
                  String(plant.qtContract).toLowerCase() === 'true' || plant.qtContract === 'มี' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                      TRUE
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                      FALSE
                    </span>
                  )
                )}
              </div>

              <div>
                <span className="text-slate-500 block mb-1">Date Issued (New Contract)</span>
                {isEditing ? (
                  <input
                    type="date"
                    lang="en-GB"
                    value={formData.dateIssueNewContract || ''}
                    onChange={(e) => setFormData({ ...formData, dateIssueNewContract: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                  />
                ) : (
                  <span className="font-semibold text-slate-200 block">{formatDateDMY(plant.dateIssueNewContract)}</span>
                )}
              </div>

              <div>
                <span className="text-slate-500 block mb-1">Contract Acceptance</span>
                {isEditing ? (
                  <select
                    value={String(formData.contractAccept).toLowerCase() === 'true' || formData.contractAccept === 'ตอบรับแล้ว' ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, contractAccept: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white cursor-pointer"
                  >
                    <option value="false">FALSE</option>
                    <option value="true">TRUE</option>
                  </select>
                ) : (
                  String(plant.contractAccept).toLowerCase() === 'true' || plant.contractAccept === 'ตอบรับแล้ว' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                      TRUE
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                      FALSE
                    </span>
                  )
                )}
              </div>

              <div>
                <span className="text-slate-500 block mb-1">Payment Date (PAID Date)</span>
                {isEditing ? (
                  <input
                    type="date"
                    lang="en-GB"
                    value={formData.paidDate || ''}
                    onChange={(e) => setFormData({ ...formData, paidDate: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                  />
                ) : (
                  <span className="font-semibold text-slate-200 block">{formatDateDMY(plant.paidDate)}</span>
                )}
              </div>

              {/* Editable Dates for Contract */}
              <div>
                <span className="text-slate-500 block mb-1">Turn On Date</span>
                {isEditing ? (
                  <input
                    type="date"
                    lang="en-GB"
                    value={formData.turnOnDate || ''}
                    onChange={(e) => setFormData({ ...formData, turnOnDate: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                  />
                ) : (
                  <span className="font-semibold text-slate-200 block">{formatDateDMY(plant.turnOnDate)}</span>
                )}
              </div>

              <div>
                <span className="text-slate-500 block mb-1">Contract Expired Date</span>
                {isEditing ? (
                  <input
                    type="date"
                    lang="en-GB"
                    value={formData.maContractExpired || ''}
                    onChange={(e) => setFormData({ ...formData, maContractExpired: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                  />
                ) : (
                  <span className="font-semibold text-slate-200 block">{formatDateDMY(plant.maContractExpired)}</span>
                )}
              </div>

              <div>
                <span className="text-slate-500 block mb-1">Latest Renewal Date</span>
                {isEditing ? (
                  <input
                    type="date"
                    lang="en-GB"
                    value={formData.latestRenewContract || ''}
                    onChange={(e) => setFormData({ ...formData, latestRenewContract: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                  />
                ) : (
                  <span className="font-semibold text-slate-200 block">{formatDateDMY(plant.latestRenewContract)}</span>
                )}
              </div>
            </div>

            {/* Note */}
            <div>
              <span className="text-slate-500 text-xs block mb-1">Notes</span>
              {isEditing ? (
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
                />
              ) : (
                <p className="text-xs text-slate-300 italic">{plant.note || 'No notes'}</p>
              )}
            </div>
          </div>

          {/* Maintenance History & Rounds Timeline (WITH DIRECT DATE EDITING) */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                  <History className="w-4 h-4 text-emerald-400" />
                  <span>Maintenance Schedule & Rounds Timeline (12 Rounds)</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Specify dates directly below on each round or auto-generate based on contract ({plant.omContractCount || 4}x/year)
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAutoScheduling(!isAutoScheduling)}
                  className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-white border border-blue-500/30 text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
                >
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  <span>⚡ Auto-Schedule All 12 Rounds</span>
                </button>
              </div>
            </div>

            {/* Expandable Auto-Schedule Control Bar */}
            {isAutoScheduling && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 border border-blue-500/30 space-y-2 animate-in fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-semibold text-white text-xs block">
                      Auto-generate dates for all 12 rounds
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Contract: {plant.omContractCount || 4} times/year (interval every {Math.max(1, Math.round(12 / (plant.omContractCount || 4)))} months)
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-xs text-slate-300 whitespace-nowrap">Start Date:</label>
                    <input
                      type="date"
                      lang="en-GB"
                      value={autoStartDate}
                      onChange={(e) => setAutoStartDate(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-white text-xs font-mono focus:border-blue-500 outline-none [color-scheme:dark] cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (onAutoGenerateRounds) {
                          onAutoGenerateRounds(plant.id, autoStartDate);
                          setIsAutoScheduling(false);
                        }
                      }}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs transition shadow cursor-pointer whitespace-nowrap"
                    >
                      Apply Schedule
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAutoScheduling(false)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {all12Rounds.map((rnd) => {
                const hist = plantHistory.find((h) => h.roundNumber === rnd.roundNumber);
                const isEditingThisRound = editingRoundNum === rnd.roundNumber;

                return (
                  <div
                    key={rnd.roundNumber}
                    className={`p-3 rounded-2xl border text-xs transition ${
                      isEditingThisRound
                        ? 'bg-slate-900 border-blue-500/80 shadow-lg'
                        : rnd.isCompleted
                        ? 'bg-slate-950/40 border-slate-800/80 text-slate-300 hover:border-slate-700'
                        : 'bg-slate-950/30 border-slate-800/40 text-slate-500 hover:border-slate-800'
                    }`}
                  >
                    {isEditingThisRound ? (
                      /* Inline Full Edit Form for Round */
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="font-bold text-blue-400 text-xs">
                            Edit Schedule: Round {rnd.roundNumber}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Select scheduled date, team, and status
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* Date Picker Input */}
                          <div>
                            <label className="text-[11px] text-slate-400 block mb-1 font-medium">
                              📅 Scheduled Date:
                            </label>
                            <input
                              type="date"
                              lang="en-GB"
                              value={roundDate}
                              onChange={(e) => setRoundDate(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-blue-500 [color-scheme:dark]"
                            />
                          </div>

                          {/* Team Selector */}
                          <div>
                            <label className="text-[11px] text-slate-400 block mb-1 font-medium">
                              👥 Assigned Team:
                            </label>
                            <select
                              value={roundTeam}
                              onChange={(e) => setRoundTeam(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                            >
                              {teams && teams.length > 0 ? (
                                teams.map((t) => (
                                  <option key={t.id} value={t.name}>
                                    {t.name}
                                  </option>
                                ))
                              ) : (
                                <>
                                  <option value="Team A">Team A</option>
                                  <option value="Team B">Team B</option>
                                  <option value="Team C">Team C</option>
                                  <option value="Manote (Solar Care)">Manote (Solar Care)</option>
                                </>
                              )}
                            </select>
                          </div>

                          {/* Status Toggle */}
                          <div>
                            <label className="text-[11px] text-slate-400 block mb-1 font-medium">
                              Round Status:
                            </label>
                            <div className="flex items-center space-x-2 pt-0.5">
                              <button
                                type="button"
                                onClick={() => setRoundCompleted(!roundCompleted)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                                  roundCompleted
                                    ? 'bg-emerald-600 text-white shadow'
                                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                                }`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{roundCompleted ? 'Completed' : 'Pending'}</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Save & Cancel Buttons */}
                        <div className="flex items-center justify-end space-x-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingRoundNum(null)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveRound(rnd.roundNumber)}
                            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow flex items-center space-x-1.5 cursor-pointer"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Save Round</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Direct View & Edit Mode */
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2.5">
                          {/* Round Number Badge */}
                          <span className={`px-2.5 py-1 rounded-lg font-bold text-xs ${
                            rnd.isCompleted ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
                          }`}>
                            Round {rnd.roundNumber}
                          </span>

                          {/* Quick Status Pill / Toggle */}
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateRound?.(plant.id, rnd.roundNumber, {
                                isCompleted: !rnd.isCompleted,
                                scheduledDate: rnd.scheduledDate || (rnd.completedAt ? rnd.completedAt.split('T')[0] : new Date().toISOString().split('T')[0]),
                                teamName: rnd.teamName || 'Team A'
                              });
                            }}
                            className={`px-2 py-0.5 rounded-md font-semibold text-[11px] transition flex items-center space-x-1 cursor-pointer ${
                              rnd.isCompleted 
                                ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30' 
                                : 'bg-slate-800/70 text-slate-400 hover:text-slate-200'
                            }`}
                            title="Click to toggle status (Completed / Pending)"
                          >
                            <CheckCircle2 className={`w-3 h-3 ${rnd.isCompleted ? 'text-emerald-400' : 'text-slate-500'}`} />
                            <span>{rnd.isCompleted ? 'Completed' : 'Pending'}</span>
                          </button>

                          {/* DIRECT DATE PICKER INPUT */}
                          <div className="flex items-center space-x-1.5 bg-slate-900/90 border border-slate-700/80 hover:border-blue-500/80 focus-within:border-blue-500 rounded-xl px-2.5 py-1 transition shadow-inner">
                            <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">📅 Date:</span>
                            <input
                              type="date"
                              lang="en-GB"
                              value={rnd.scheduledDate || (rnd.completedAt ? rnd.completedAt.split('T')[0] : '')}
                              onChange={(e) => {
                                onUpdateRound?.(plant.id, rnd.roundNumber, {
                                  scheduledDate: e.target.value,
                                  teamName: rnd.teamName || 'Team A',
                                  isCompleted: rnd.isCompleted,
                                });
                              }}
                              className="bg-transparent text-slate-100 font-mono text-xs outline-none cursor-pointer [color-scheme:dark]"
                              title="Specify / change scheduled date for this round"
                            />
                            {!rnd.scheduledDate && !rnd.completedAt && (
                              <span className="text-[10px] text-amber-400/80 font-normal pl-1 hidden sm:inline">
                                (Set Date)
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 self-end sm:self-auto">
                          {/* Assigned Team */}
                          <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                            <span className="text-slate-500">Team:</span>
                            <strong className="text-slate-300">{rnd.teamName || 'Team A'}</strong>
                          </span>

                          {hist && hist.completedAt && (
                            <span className="text-[11px] text-slate-500 hidden md:inline font-mono">
                              ({formatDateDMY(hist.completedAt)})
                            </span>
                          )}

                          {/* Edit Full Schedule Button */}
                          <button
                            type="button"
                            onClick={() => handleStartEditRound(rnd)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition flex items-center space-x-1 cursor-pointer"
                            title="Edit team or full details for this round"
                          >
                            <Edit2 className="w-3 h-3 text-blue-400" />
                            <span className="text-[11px]">Edit</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800/80 flex justify-end bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
