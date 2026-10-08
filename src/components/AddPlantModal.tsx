import React, { useState } from 'react';
import { 
  X, 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  Zap, 
  User, 
  FileText, 
  Check, 
  PlusCircle,
  Hash
} from 'lucide-react';
import { SolarPlant } from '../types/maintenance';
import { STATUS_OPTIONS, STATUS_CONFIG, getStatusCategory } from '../lib/statusConfig';

interface AddPlantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPlant: (plantData: Partial<SolarPlant> & { solarPlant: string }) => void;
  existingLocations: string[];
  nextQueueNumber: number;
}

export const AddPlantModal: React.FC<AddPlantModalProps> = ({
  isOpen,
  onClose,
  onAddPlant,
  existingLocations,
  nextQueueNumber,
}) => {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    solarPlant: '',
    queueNumber: nextQueueNumber,
    no: nextQueueNumber,
    capacityKw: '',
    locationArea: '',
    propertyVillage: '',
    mapUrl: '',
    status: 'Paid / Active',
    qtContract: 'true',
    dateIssueNewContract: '',
    contractAccept: 'false',
    paidDate: '',
    contactName: '',
    tel: '',
    email: '',
    otherContact: '',
    turnOnDate: '',
    latestRenewContract: '',
    maContractExpired: '',
    latestMaintenance: '',
    omContractCount: '4',
    firstScheduledDate: '',
    note: '',
  });

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.solarPlant.trim()) {
      setError('Please enter Solar Plant / Customer Name');
      return;
    }

    onAddPlant({
      solarPlant: formData.solarPlant.trim(),
      queueNumber: Number(formData.queueNumber) || nextQueueNumber,
      no: Number(formData.no) || nextQueueNumber,
      capacityKw: formData.capacityKw ? parseFloat(formData.capacityKw) : null,
      locationArea: formData.locationArea.trim(),
      propertyVillage: formData.propertyVillage.trim(),
      mapUrl: formData.mapUrl.trim(),
      status: formData.status,
      qtContract: formData.qtContract.trim(),
      dateIssueNewContract: formData.dateIssueNewContract || null,
      contractAccept: formData.contractAccept || null,
      paidDate: formData.paidDate || null,
      contactName: formData.contactName.trim(),
      tel: formData.tel.trim(),
      email: formData.email.trim(),
      otherContact: formData.otherContact.trim(),
      turnOnDate: formData.turnOnDate || null,
      latestRenewContract: formData.latestRenewContract || null,
      maContractExpired: formData.maContractExpired || null,
      latestMaintenance: formData.latestMaintenance || null,
      omContractCount: parseInt(formData.omContractCount, 10) || 4,
      firstScheduledDate: formData.firstScheduledDate || null,
      totalCount: 0,
      currentRound: 1,
      note: formData.note.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center space-x-2">
                <span>Add New Customer</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  New Customer
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Enter solar plant specifications, O&M contract details, and contact information.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs">
          
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-medium text-xs">
              ⚠️ {error}
            </div>
          )}

          {/* Section 1: Solar Plant & Location Details */}
          <div>
            <div className="flex items-center space-x-2 mb-3 text-slate-300 font-semibold text-xs uppercase tracking-wider">
              <Building2 className="w-4 h-4 text-blue-400" />
              <span>Solar Plant & Location Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/60">
              
              {/* Solar Plant Name */}
              <div className="sm:col-span-8">
                <label className="block text-slate-400 mb-1 font-medium">
                  Solar Plant / Customer Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Green Energy Plant, John Smith"
                  value={formData.solarPlant}
                  onChange={(e) => {
                    setFormData({ ...formData, solarPlant: e.target.value });
                    if (error) setError(null);
                  }}
                  className="w-full bg-slate-900 border border-slate-700/80 focus:border-blue-500 rounded-xl px-3 py-2 text-white placeholder-slate-500 outline-none transition"
                />
              </div>

              {/* Queue Number */}
              <div className="sm:col-span-4">
                <label className="block text-slate-400 mb-1 font-medium flex items-center justify-between">
                  <span>Queue Number</span>
                  <span className="text-[10px] text-slate-500">Auto</span>
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="number"
                    value={formData.queueNumber}
                    onChange={(e) => setFormData({ ...formData, queueNumber: parseInt(e.target.value, 10) || 1 })}
                    className="w-full bg-slate-900 border border-slate-700/80 focus:border-blue-500 rounded-xl pl-8 pr-3 py-2 text-white outline-none transition"
                  />
                </div>
              </div>

              {/* Capacity kW */}
              <div className="sm:col-span-4">
                <label className="block text-slate-400 mb-1 font-medium">
                  System Capacity (kW)
                </label>
                <div className="relative">
                  <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 10, 50.4"
                    value={formData.capacityKw}
                    onChange={(e) => setFormData({ ...formData, capacityKw: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700/80 focus:border-blue-500 rounded-xl pl-8 pr-3 py-2 text-white placeholder-slate-500 outline-none transition"
                  />
                </div>
              </div>

              {/* Location Area */}
              <div className="sm:col-span-4">
                <label className="block text-slate-400 mb-1 font-medium">
                  Location Area / Province
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="text"
                    list="location-suggestions"
                    placeholder="e.g. Phuket, Chiang Mai, Bangkok"
                    value={formData.locationArea}
                    onChange={(e) => setFormData({ ...formData, locationArea: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700/80 focus:border-blue-500 rounded-xl pl-8 pr-3 py-2 text-white placeholder-slate-500 outline-none transition"
                  />
                  <datalist id="location-suggestions">
                    {existingLocations.map((loc) => (
                      <option key={loc} value={loc} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Property / Village */}
              <div className="sm:col-span-4">
                <label className="block text-slate-400 mb-1 font-medium">
                  Property / Village / Project
                </label>
                <input
                  type="text"
                  placeholder="e.g. Flora Ville, Factory A"
                  value={formData.propertyVillage}
                  onChange={(e) => setFormData({ ...formData, propertyVillage: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700/80 focus:border-blue-500 rounded-xl px-3 py-2 text-white placeholder-slate-500 outline-none transition"
                />
              </div>

              {/* Google Maps URL */}
              <div className="sm:col-span-12">
                <label className="block text-slate-400 mb-1 font-medium">
                  Google Maps URL (Location link for technicians)
                </label>
                <input
                  type="url"
                  placeholder="https://maps.app.goo.gl/... or https://maps.google.com/..."
                  value={formData.mapUrl}
                  onChange={(e) => setFormData({ ...formData, mapUrl: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700/80 focus:border-blue-500 rounded-xl px-3 py-2 text-white placeholder-slate-500 outline-none transition"
                />
              </div>

            </div>
          </div>

          {/* Section 2: Status & Contract Tracking */}
          <div>
            <div className="flex items-center space-x-2 mb-3 text-slate-300 font-semibold text-xs uppercase tracking-wider">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Status & Contract Tracking</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/60">
              
              {/* Status Selector */}
              <div className="sm:col-span-4">
                <label className="block text-slate-400 mb-1 font-medium">
                  Contract Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700/80 focus:border-blue-500 rounded-xl px-3 py-2 text-white outline-none cursor-pointer"
                >
                  <option value="Paid / Active">🟢 Paid / Active</option>
                  <option value="Send">🌸 Send</option>
                  <option value="Signed">🟡 Signed</option>
                  <option value="Waiting">🟣 Waiting</option>
                  <option value="Not renew">⚪ Not renew</option>
                  <option value="Expired">🔴 Expired</option>
                  <option value="(Blank)">(Blank)</option>
                </select>
              </div>

              {/* QT & Contract */}
              <div className="sm:col-span-5">
                <label className="block text-slate-400 mb-1 font-medium">
                  QT & Contract Status
                </label>
                <select
                  value={formData.qtContract}
                  onChange={(e) => setFormData({ ...formData, qtContract: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700/80 focus:border-blue-500 rounded-xl px-3 py-2 text-white outline-none cursor-pointer"
                >
                  <option value="true">TRUE</option>
                  <option value="false">FALSE</option>
                </select>
              </div>

              {/* O&M Contract Count */}
              <div className="sm:col-span-3">
                <label className="block text-slate-400 mb-1 font-medium">
                  O&M Contract (times / year)
                </label>
                <select
                  value={formData.omContractCount}
                  onChange={(e) => setFormData({ ...formData, omContractCount: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700/80 focus:border-blue-500 rounded-xl px-3 py-2 text-white outline-none cursor-pointer"
                >
                  <option value="1">1 time / year</option>
                  <option value="2">2 times / year</option>
                  <option value="3">3 times / year</option>
                  <option value="4">4 times / year (Standard)</option>
                  <option value="6">6 times / year</option>
                  <option value="12">12 times / year</option>
                </select>
              </div>

              {/* Date Issue New Contract */}
              <div className="sm:col-span-4">
                <label className="block text-slate-400 mb-1 font-medium">
                  Date Issued (New Contract)
                </label>
                <input
                  type="date"
                  lang="en-GB"
                  value={formData.dateIssueNewContract}
                  onChange={(e) => setFormData({ ...formData, dateIssueNewContract: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700/80 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-200 outline-none transition"
                />
              </div>

              {/* Contract Accept */}
              <div className="sm:col-span-4">
                <label className="block text-slate-400 mb-1 font-medium">
                  Contract Acceptance
                </label>
                <select
                  value={formData.contractAccept}
                  onChange={(e) => setFormData({ ...formData, contractAccept: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700/80 focus:border-blue-500 rounded-xl px-3 py-2 text-white outline-none cursor-pointer"
                >
                  <option value="false">FALSE</option>
                  <option value="true">TRUE</option>
                </select>
              </div>

              {/* PAID Date */}
              <div className="sm:col-span-4">
                <label className="block text-slate-400 mb-1 font-medium">
                  Payment Date (PAID Date)
                </label>
                <input
                  type="date"
                  lang="en-GB"
                  value={formData.paidDate}
                  onChange={(e) => setFormData({ ...formData, paidDate: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700/80 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-200 outline-none transition"
                />
              </div>

              {/* Turn On Date */}
              <div className="sm:col-span-4">
                <label className="block text-slate-400 mb-1 font-medium">
                  Turn On Date
                </label>
                <input
                  type="date"
                  lang="en-GB"
                  value={formData.turnOnDate}
                  onChange={(e) => setFormData({ ...formData, turnOnDate: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700/80 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-200 outline-none transition"
                />
              </div>

              {/* Latest Renew Contract */}
              <div className="sm:col-span-4">
                <label className="block text-slate-400 mb-1 font-medium">
                  Latest Renewal Date
                </label>
                <input
                  type="date"
                  lang="en-GB"
                  value={formData.latestRenewContract}
                  onChange={(e) => setFormData({ ...formData, latestRenewContract: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700/80 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-200 outline-none transition"
                />
              </div>

              {/* MA Contract Expired */}
              <div className="sm:col-span-4">
                <label className="block text-slate-400 mb-1 font-medium">
                  Contract Expired Date
                </label>
                <input
                  type="date"
                  lang="en-GB"
                  value={formData.maContractExpired}
                  onChange={(e) => setFormData({ ...formData, maContractExpired: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700/80 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-200 outline-none transition"
                />
              </div>

              {/* 1st Round Scheduled Date */}
              <div className="sm:col-span-4">
                <label className="block text-slate-400 mb-1 font-medium flex items-center justify-between">
                  <span>1st Round Scheduled Date</span>
                  <span className="text-[10px] text-blue-400">⚡ Auto 12 Rounds</span>
                </label>
                <input
                  type="date"
                  lang="en-GB"
                  value={formData.firstScheduledDate}
                  onChange={(e) => setFormData({ ...formData, firstScheduledDate: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700/80 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-200 outline-none transition [color-scheme:dark]"
                />
              </div>

            </div>
          </div>

          {/* Section 3: Contact Information */}
          <div>
            <div className="flex items-center space-x-2 mb-3 text-slate-300 font-semibold text-xs uppercase tracking-wider">
              <User className="w-4 h-4 text-purple-400" />
              <span>Contact Information</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/60">
              
              {/* Contact Name */}
              <div className="sm:col-span-6">
                <label className="block text-slate-400 mb-1 font-medium">
                  Contact Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="e.g. John Doe, Solar Support"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700/80 focus:border-blue-500 rounded-xl pl-8 pr-3 py-2 text-white placeholder-slate-500 outline-none transition"
                  />
                </div>
              </div>

              {/* Tel */}
              <div className="sm:col-span-6">
                <label className="block text-slate-400 mb-1 font-medium">
                  Telephone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="tel"
                    placeholder="e.g. +66 81-234-5678"
                    value={formData.tel}
                    onChange={(e) => setFormData({ ...formData, tel: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700/80 focus:border-blue-500 rounded-xl pl-8 pr-3 py-2 text-white placeholder-slate-500 outline-none transition"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="sm:col-span-6">
                <label className="block text-slate-400 mb-1 font-medium">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700/80 focus:border-blue-500 rounded-xl pl-8 pr-3 py-2 text-white placeholder-slate-500 outline-none transition"
                  />
                </div>
              </div>

              {/* Other Contact */}
              <div className="sm:col-span-6">
                <label className="block text-slate-400 mb-1 font-medium">
                  Other Contact (LINE ID, etc.)
                </label>
                <input
                  type="text"
                  placeholder="LINE: @solar..., Secondary Tel"
                  value={formData.otherContact}
                  onChange={(e) => setFormData({ ...formData, otherContact: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700/80 focus:border-blue-500 rounded-xl px-3 py-2 text-white placeholder-slate-500 outline-none transition"
                />
              </div>

            </div>
          </div>

          {/* Section 4: Additional Notes */}
          <div>
            <label className="block text-slate-400 mb-1 font-medium">
              Additional Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Advance notice required, gated entrance code..."
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="w-full bg-slate-950/40 border border-slate-800 rounded-2xl p-3 text-white placeholder-slate-500 outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/20 transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Save Customer</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
