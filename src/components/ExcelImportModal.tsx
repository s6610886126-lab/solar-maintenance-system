import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Eye, ArrowRight } from 'lucide-react';
import { parseExcelFile, ParsedExcelData } from '../lib/excelHandler';
import { SolarPlant, MaintenanceRound, MAReport } from '../types/maintenance';

interface ExcelImportModalProps {
  existingPlants?: SolarPlant[];
  onClose: () => void;
  onConfirmImport: (
    plants: SolarPlant[],
    rounds: MaintenanceRound[],
    reports: MAReport[],
    mode: 'add_new_only' | 'merge_update' | 'replace_all'
  ) => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  existingPlants = [],
  onClose,
  onConfirmImport,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [parsedData, setParsedData] = useState<ParsedExcelData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'add_new_only' | 'merge_update' | 'replace_all'>('add_new_only');
  const [previewTab, setPreviewTab] = useState<'new_only' | 'all'>('new_only');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setIsLoading(true);
    setError(null);

    try {
      const data = await parseExcelFile(selected);
      setParsedData(data);
    } catch (err: any) {
      console.error('Error parsing Excel:', err);
      setError('Failed to parse Excel file: ' + (err.message || 'Invalid file format'));
    } finally {
      setIsLoading(false);
    }
  };

  const existingNames = new Set(existingPlants.map((p) => p.solarPlant.trim().toLowerCase()));
  const newCount = parsedData ? parsedData.plants.filter((p) => !existingNames.has(p.solarPlant.trim().toLowerCase())).length : 0;
  const duplicateCount = parsedData ? parsedData.plants.length - newCount : 0;

  const handleConfirm = () => {
    if (!parsedData) return;
    onConfirmImport(parsedData.plants, parsedData.rounds, parsedData.reports, importMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Import Excel (.xlsx)</h2>
              <p className="text-xs text-slate-400">
                Supports sheets: Maintenance Schedule, MA Report Tracking, and Customer lists.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Upload Area */}
          {!parsedData ? (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/80 rounded-2xl p-8 text-center transition bg-slate-950/40 cursor-pointer relative">
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <FileSpreadsheet className="w-12 h-12 text-emerald-400 mx-auto mb-3 animate-pulse" />
                <h3 className="text-base font-bold text-white">Drag & drop your Excel file (.xlsx) here, or click to browse</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Automatically extracts data from sheets: Maintenance Schedule, MA Report Tracking
                </p>
                {isLoading && (
                  <div className="mt-4 text-xs font-semibold text-emerald-400 animate-pulse">
                    Processing Excel file...
                  </div>
                )}
              </div>

              {/* Sample Templates Section */}
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-300 flex items-center space-x-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>ดาวน์โหลดไฟล์ตัวอย่าง (Download Sample Excel Templates):</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <a
                    href="/sample_customer_1_plant.xlsx"
                    download="sample_customer_1_plant.xlsx"
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-emerald-600/20 hover:border-emerald-500/40 border border-slate-700/60 text-slate-200 hover:text-emerald-300 font-medium transition text-center flex flex-col items-center justify-center space-y-1"
                  >
                    <span className="font-semibold text-white">1 รายการ</span>
                    <span className="text-[10px] text-slate-400">Sample (1 Customer)</span>
                  </a>

                  <a
                    href="/sample_customer_2_plants.xlsx"
                    download="sample_customer_2_plants.xlsx"
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-emerald-600/20 hover:border-emerald-500/40 border border-slate-700/60 text-slate-200 hover:text-emerald-300 font-medium transition text-center flex flex-col items-center justify-center space-y-1"
                  >
                    <span className="font-semibold text-white">2 รายการ</span>
                    <span className="text-[10px] text-slate-400">Sample (2 Customers)</span>
                  </a>

                  <a
                    href="/mock_maintenance_schedule_10_plants.xlsx"
                    download="mock_maintenance_schedule_10_plants.xlsx"
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-blue-600/20 hover:border-blue-500/40 border border-slate-700/60 text-slate-200 hover:text-blue-300 font-medium transition text-center flex flex-col items-center justify-center space-y-1"
                  >
                    <span className="font-semibold text-white">10 รายการ</span>
                    <span className="text-[10px] text-slate-400">Sample (10 Customers)</span>
                  </a>

                  <a
                    href="/mock_maintenance_schedule_20_plants.xlsx"
                    download="mock_maintenance_schedule_20_plants.xlsx"
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-purple-600/20 hover:border-purple-500/40 border border-slate-700/60 text-slate-200 hover:text-purple-300 font-medium transition text-center flex flex-col items-center justify-center space-y-1"
                  >
                    <span className="font-semibold text-white">20 รายการ</span>
                    <span className="text-[10px] text-slate-400">Sample (20 Customers)</span>
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* File Info Banner */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
                  <div>
                    <h4 className="text-sm font-bold text-white">{file?.name}</h4>
                    <p className="text-xs text-slate-400">
                      พบข้อมูลในไฟล์ทั้งหมด {parsedData.plants.length} รายการ (รายการใหม่: <strong className="text-emerald-400">{newCount}</strong> | มีอยู่แล้ว: <strong className="text-amber-400">{duplicateCount}</strong>)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setParsedData(null)}
                  className="text-xs text-slate-400 hover:text-white px-2.5 py-1 bg-slate-800 rounded-lg cursor-pointer"
                >
                  Choose Another File
                </button>
              </div>

              {/* Import Mode Selector */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  รูปแบบการนำเข้าข้อมูล (Import Mode):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <label
                    onClick={() => setImportMode('add_new_only')}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition flex flex-col justify-between ${
                      importMode === 'add_new_only'
                        ? 'bg-emerald-950/40 border-emerald-500/80 text-white shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between font-bold text-xs text-emerald-400 mb-1">
                        <span>เพิ่มเฉพาะรายชื่อใหม่</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">แนะนำ</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        นำเข้าเฉพาะ <strong className="text-emerald-300">{newCount} รายการใหม่</strong> ที่ยังไม่มีในระบบ (ข้าม {duplicateCount} รายการเดิม)
                      </p>
                    </div>
                  </label>

                  <label
                    onClick={() => setImportMode('merge_update')}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition flex flex-col justify-between ${
                      importMode === 'merge_update'
                        ? 'bg-blue-950/40 border-blue-500/80 text-white shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs text-blue-400 mb-1">อัปเดตข้อมูลเดิม + เพิ่มใหม่</div>
                      <p className="text-[11px] text-slate-400">
                        อัปเดตข้อมูลของ {duplicateCount} รายการเดิม และเพิ่ม {newCount} รายการใหม่
                      </p>
                    </div>
                  </label>

                  <label
                    onClick={() => setImportMode('replace_all')}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition flex flex-col justify-between ${
                      importMode === 'replace_all'
                        ? 'bg-rose-950/40 border-rose-500/80 text-white shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs text-rose-400 mb-1">แทนที่ข้อมูลทั้งหมด</div>
                      <p className="text-[11px] text-slate-400">
                        ล้างข้อมูลเดิมทั้งหมด แล้วนำเข้าจากไฟล์นี้ ({parsedData?.plants.length} รายการ) แทนที่
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Detected Sheets */}
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Detected Sheets in File:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {parsedData.sheetNames.map((name) => (
                    <span
                      key={name}
                      className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Preview Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Data Preview (ตัวอย่างข้อมูลในไฟล์):
                  </span>
                  <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setPreviewTab('new_only')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                        previewTab === 'new_only'
                          ? 'bg-emerald-600 text-white shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      ✨ รายการใหม่ ({newCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTab('all')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                        previewTab === 'all'
                          ? 'bg-blue-600 text-white shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      ทั้งหมด ({parsedData.plants.length})
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-900 text-slate-400 border-b border-slate-800">
                        <th className="py-2.5 px-3">Queue</th>
                        <th className="py-2.5 px-3">Solar Plant</th>
                        <th className="py-2.5 px-3">Location</th>
                        <th className="py-2.5 px-3">Status In System</th>
                        <th className="py-2.5 px-3 text-center">Count</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {(() => {
                        const allPlantsWithStatus = parsedData.plants.map((p) => ({
                          ...p,
                          isExisting: existingNames.has(p.solarPlant.trim().toLowerCase()),
                        }));

                        const filtered = previewTab === 'new_only'
                          ? allPlantsWithStatus.filter((p) => !p.isExisting)
                          : [...allPlantsWithStatus].sort((a, b) => (a.isExisting === b.isExisting ? 0 : a.isExisting ? 1 : -1));

                        if (filtered.length === 0) {
                          return (
                            <tr>
                              <td colSpan={5} className="py-6 text-center text-slate-500 italic">
                                {previewTab === 'new_only' ? 'ไม่มีรายการใหม่ในไฟล์นี้ (ทุกรายการมีอยู่ในระบบแล้ว)' : 'ไม่พบข้อมูล'}
                              </td>
                            </tr>
                          );
                        }

                        return filtered.slice(0, 15).map((p) => (
                          <tr key={p.id} className={!p.isExisting ? 'bg-emerald-950/20 hover:bg-emerald-950/40' : 'hover:bg-slate-900/50'}>
                            <td className="py-2 px-3 font-bold text-blue-400">#{p.queueNumber}</td>
                            <td className="py-2 px-3 font-bold text-white flex items-center space-x-1.5">
                              <span>{p.solarPlant}</span>
                              {!p.isExisting && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                  NEW ✨
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-slate-400">{p.locationArea || '-'}</td>
                            <td className="py-2 px-3">
                              {p.isExisting ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                  มีในระบบแล้ว
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                  รายการใหม่ ✨
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-center font-bold text-emerald-400">{p.totalCount}</td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
                {parsedData.plants.length > 15 && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    * แสดงตัวอย่าง {Math.min(15, parsedData.plants.length)} จาก {parsedData.plants.length} รายการ
                  </p>
                )}
              </div>

            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/80">
          <p className="text-xs text-slate-500">
            * Selected Mode: {importMode === 'add_new_only' ? `Add ${newCount} New Items Only` : importMode === 'merge_update' ? 'Update Existing & Add New' : 'Replace All Data'}
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!parsedData}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center space-x-1.5 transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                Confirm Import (
                {importMode === 'add_new_only'
                  ? `${newCount} new`
                  : importMode === 'merge_update'
                  ? `${parsedData?.plants.length} merged`
                  : `${parsedData?.plants.length} replace`}
                )
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
