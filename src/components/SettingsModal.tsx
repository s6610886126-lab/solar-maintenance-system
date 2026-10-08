import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Database, 
  Copy, 
  Check, 
  RefreshCw, 
  ShieldCheck, 
  AlertTriangle, 
  ExternalLink,
  Code,
  Globe
} from 'lucide-react';
import { getSupabaseConfig, setSupabaseConfig, checkSupabaseConnection } from '../lib/supabase';

interface SettingsModalProps {
  onClose: () => void;
  onClearData: () => void;
  onRestoreSeed: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  onClearData,
  onRestoreSeed,
}) => {
  const currentConfig = getSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [key, setKey] = useState(currentConfig.key);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleTestConnection = async () => {
    setIsChecking(true);
    setStatusMsg(null);
    try {
      setSupabaseConfig(url, key);
      const res = await checkSupabaseConnection();
      if (res.connected && res.hasTables) {
        setStatusMsg('🟢 Successfully connected to Supabase and database tables are verified (Real-time Active)!');
      } else if (res.connected && !res.hasTables) {
        setStatusMsg('🟡 Connected to Supabase, but SQL schema is missing. Please copy and execute the SQL schema below in Supabase SQL Editor.');
      } else {
        setStatusMsg('🔴 Connection failed: ' + (res.error || 'Please verify URL and Anon Key'));
      }
    } catch (e: any) {
      setStatusMsg('🔴 Error: ' + e.message);
    } finally {
      setIsChecking(false);
    }
  };

  const handleCopySql = () => {
    // In actual app we can fetch or copy the schema
    const sqlScript = `-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TEAMS TABLE
CREATE TABLE IF NOT EXISTS public.teams (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    leader TEXT,
    members TEXT,
    phone TEXT,
    color TEXT DEFAULT '#3B82F6',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SOLAR PLANTS TABLE
CREATE TABLE IF NOT EXISTS public.solar_plants (
    id TEXT PRIMARY KEY,
    queue_number INT NOT NULL,
    no INT,
    solar_plant TEXT NOT NULL,
    capacity_kw NUMERIC,
    location_area TEXT,
    property_village TEXT,
    map_url TEXT,
    status TEXT DEFAULT 'Active',
    qt_contract TEXT,
    contact_name TEXT,
    tel TEXT,
    email TEXT,
    other_contact TEXT,
    turn_on_date DATE,
    latest_renew_contract DATE,
    ma_contract_expired DATE,
    latest_maintenance DATE,
    maintenance_period TEXT,
    om_contract_count INT DEFAULT 4,
    total_count INT DEFAULT 0,
    current_round INT DEFAULT 1,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. QUEUE STATE
CREATE TABLE IF NOT EXISTS public.queue_state (
    id INT PRIMARY KEY DEFAULT 1,
    current_queue_index INT NOT NULL DEFAULT 1,
    current_round INT NOT NULL DEFAULT 1,
    active_plant_id TEXT REFERENCES public.solar_plants(id) ON DELETE SET NULL,
    total_queues INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by TEXT DEFAULT 'System',
    CONSTRAINT singleton_check CHECK (id = 1)
);

-- 5. MAINTENANCE ROUNDS
CREATE TABLE IF NOT EXISTS public.maintenance_rounds (
    id TEXT PRIMARY KEY,
    solar_plant_id TEXT NOT NULL REFERENCES public.solar_plants(id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    scheduled_date DATE,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    team_name TEXT,
    count_number INT,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_plant_round_schedule UNIQUE (solar_plant_id, round_number)
);

-- 6. MAINTENANCE HISTORY (STRICT 1 COUNT PER ROUND)
CREATE TABLE IF NOT EXISTS public.maintenance_history (
    id TEXT PRIMARY KEY,
    solar_plant_id TEXT NOT NULL REFERENCES public.solar_plants(id) ON DELETE CASCADE,
    solar_plant_name TEXT NOT NULL,
    round_number INT NOT NULL,
    count_number INT NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    team_name TEXT,
    user_name TEXT DEFAULT 'Admin',
    status TEXT DEFAULT 'Completed',
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_plant_round_history UNIQUE (solar_plant_id, round_number)
);

-- 7. MA REPORTS
CREATE TABLE IF NOT EXISTS public.ma_reports (
    id TEXT PRIMARY KEY,
    solar_plant_id TEXT REFERENCES public.solar_plants(id) ON DELETE CASCADE,
    solar_plant_name TEXT NOT NULL,
    ma_date DATE,
    ma_period TEXT,
    is_report_completed BOOLEAN DEFAULT FALSE,
    send_to_customer_date DATE,
    om_contract INT DEFAULT 4,
    round_number INT DEFAULT 1,
    status TEXT DEFAULT 'Pending',
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. RPC: complete_round_maintenance
CREATE OR REPLACE FUNCTION public.complete_round_maintenance(
    p_plant_id TEXT,
    p_round INT,
    p_team TEXT DEFAULT 'Team A',
    p_user TEXT DEFAULT 'Admin',
    p_note TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_plant RECORD;
    v_history_id TEXT;
    v_new_count INT;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    SELECT * INTO v_plant FROM public.solar_plants WHERE id = p_plant_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Solar Plant not found: %', p_plant_id;
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.maintenance_history 
        WHERE solar_plant_id = p_plant_id AND round_number = p_round
    ) THEN
        RAISE EXCEPTION 'Duplicate count prohibited: Solar plant % has already been completed for Round %', v_plant.solar_plant, p_round;
    END IF;

    v_new_count := COALESCE(v_plant.total_count, 0) + 1;
    v_history_id := 'hist-' || p_plant_id || '-r' || p_round || '-' || EXTRACT(EPOCH FROM v_now)::BIGINT;

    INSERT INTO public.maintenance_history (
        id, solar_plant_id, solar_plant_name, round_number, count_number, completed_at, team_name, user_name, status, note
    ) VALUES (
        v_history_id, p_plant_id, v_plant.solar_plant, p_round, v_new_count, v_now, p_team, p_user, 'Completed', p_note
    );

    INSERT INTO public.maintenance_rounds (
        id, solar_plant_id, round_number, scheduled_date, is_completed, completed_at, team_name, count_number, note, updated_at
    ) VALUES (
        p_plant_id || '-r' || p_round, p_plant_id, p_round, v_now::DATE, TRUE, v_now, p_team, v_new_count, p_note, v_now
    )
    ON CONFLICT (solar_plant_id, round_number) DO UPDATE SET
        is_completed = TRUE,
        completed_at = v_now,
        team_name = p_team,
        count_number = v_new_count,
        note = CASE WHEN p_note <> '' THEN p_note ELSE public.maintenance_rounds.note END,
        updated_at = v_now;

    UPDATE public.solar_plants
    SET 
        total_count = v_new_count,
        latest_maintenance = v_now::DATE,
        current_round = LEAST(12, p_round + 1),
        updated_at = v_now
    WHERE id = p_plant_id;

    RETURN jsonb_build_object(
        'success', TRUE,
        'solar_plant_id', p_plant_id,
        'round_number', p_round,
        'new_count', v_new_count,
        'completed_at', v_now
    );
END;
$$;

-- 9. RPC: advance_queue
CREATE OR REPLACE FUNCTION public.advance_queue(
    p_user TEXT DEFAULT 'Admin'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_state RECORD;
    v_total INT;
    v_next_queue_index INT;
    v_next_round INT;
    v_next_plant RECORD;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    SELECT * INTO v_state FROM public.queue_state WHERE id = 1 FOR UPDATE;
    SELECT COUNT(*) INTO v_total FROM public.solar_plants;

    IF v_total = 0 THEN
        RETURN jsonb_build_object('success', FALSE, 'message', 'No solar plants in database');
    END IF;

    IF v_state.current_queue_index >= v_total THEN
        v_next_queue_index := 1;
        v_next_round := v_state.current_round + 1;
    ELSE
        v_next_queue_index := v_state.current_queue_index + 1;
        v_next_round := v_state.current_round;
    END IF;

    SELECT * INTO v_next_plant 
    FROM public.solar_plants 
    ORDER BY queue_number ASC 
    OFFSET (v_next_queue_index - 1) LIMIT 1;

    UPDATE public.queue_state
    SET 
        current_queue_index = v_next_queue_index,
        current_round = v_next_round,
        active_plant_id = v_next_plant.id,
        total_queues = v_total,
        updated_at = v_now,
        updated_by = p_user
    WHERE id = 1;

    RETURN jsonb_build_object(
        'success', TRUE,
        'current_queue_index', v_next_queue_index,
        'current_round', v_next_round,
        'active_plant_id', v_next_plant.id,
        'solar_plant_name', v_next_plant.solar_plant
    );
END;
$$;

-- 10. ENABLE REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_state;
ALTER PUBLICATION supabase_realtime ADD TABLE public.maintenance_rounds;
ALTER PUBLICATION supabase_realtime ADD TABLE public.maintenance_history;
ALTER PUBLICATION supabase_realtime ADD TABLE public.solar_plants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ma_reports;

-- 11. RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solar_plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ma_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read All Teams" ON public.teams FOR ALL USING (true);
CREATE POLICY "Public Read All Plants" ON public.solar_plants FOR ALL USING (true);
CREATE POLICY "Public Read Queue State" ON public.queue_state FOR ALL USING (true);
CREATE POLICY "Public Read Rounds" ON public.maintenance_rounds FOR ALL USING (true);
CREATE POLICY "Public Read History" ON public.maintenance_history FOR ALL USING (true);
CREATE POLICY "Public Read Reports" ON public.ma_reports FOR ALL USING (true);`;

    navigator.clipboard.writeText(sqlScript);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">System Settings & Database</h2>
              <p className="text-xs text-slate-400">Configure Supabase credentials, test real-time connection, and manage database</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          
          {/* Supabase Config */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-white text-sm">Supabase Credentials</h3>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-slate-400 block mb-1">VITE_SUPABASE_URL</label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://xxxx.supabase.co"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">VITE_SUPABASE_ANON_KEY</label>
                <input
                  type="password"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="eyJhbG..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs"
                />
              </div>

              <div className="flex items-center space-x-3 pt-1">
                <button
                  onClick={handleTestConnection}
                  disabled={isChecking}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition flex items-center space-x-1.5 shadow"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                  <span>Test Connection & Save</span>
                </button>
              </div>

              {statusMsg && (
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs mt-2">
                  {statusMsg}
                </div>
              )}
            </div>
          </div>

          {/* SQL Schema Copy Box */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Code className="w-4 h-4 text-purple-400" />
                <h3 className="font-bold text-white text-sm">Supabase SQL Schema (DDL & RPC)</h3>
              </div>
              <button
                onClick={handleCopySql}
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center space-x-1 shadow"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Copied to Clipboard!' : 'Copy Entire SQL Script'}</span>
              </button>
            </div>
            <p className="text-slate-400 text-xs">
              Paste this SQL script into <strong>Supabase Dashboard &gt; SQL Editor</strong> and click Run
              to create all necessary tables, constraints, and atomic RPC functions for circular queueing and double-count prevention.
            </p>
          </div>

          {/* Clear & Restore Data Actions */}
          <div className="space-y-3">
            {/* Clear All Data */}
            <div className="p-4 rounded-xl bg-slate-950 border border-rose-950/60 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider">Clear All Data</h4>
                <p className="text-slate-400 text-xs mt-0.5">
                  Clear all solar plants, rounds, and audit logs to reset system from scratch
                </p>
              </div>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to clear all data? This will reset all records to 0.')) {
                    onClearData();
                    onClose();
                  }
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition shadow"
              >
                Clear All Data
              </button>
            </div>

            {/* Restore Seed Data */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Restore Seed Dataset (279 Plants)</h4>
                <p className="text-slate-400 text-xs mt-0.5">
                  Reload original 279 solar plants dataset from 1.Maintenance Schedule.xlsx
                </p>
              </div>
              <button
                onClick={() => {
                  if (confirm('Restore the original 279 solar plants seed dataset?')) {
                    onRestoreSeed();
                    onClose();
                  }
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold border border-slate-700 transition"
              >
                Restore Seed Data
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
