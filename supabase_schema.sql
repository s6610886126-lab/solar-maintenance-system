-- ==============================================================================
-- SOLAR PLANT MAINTENANCE SCHEDULE - SUPABASE DATABASE SCHEMA
-- ==============================================================================

-- 1. EXTENSIONS
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

CREATE INDEX IF NOT EXISTS idx_solar_plants_queue ON public.solar_plants(queue_number);
CREATE INDEX IF NOT EXISTS idx_solar_plants_status ON public.solar_plants(status);

-- 4. QUEUE STATE TABLE (Singleton table storing global circular queue state)
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

-- 5. MAINTENANCE ROUNDS TABLE (Rounds 1st to 12th for each plant)
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

CREATE INDEX IF NOT EXISTS idx_maint_rounds_plant ON public.maintenance_rounds(solar_plant_id);

-- 6. MAINTENANCE HISTORY (Audit log & strict 1-count-per-round enforcement)
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
    -- RULE OF COUNTING: 1 count per queue per round
    CONSTRAINT uq_plant_round_history UNIQUE (solar_plant_id, round_number)
);

CREATE INDEX IF NOT EXISTS idx_maint_history_plant ON public.maintenance_history(solar_plant_id);
CREATE INDEX IF NOT EXISTS idx_maint_history_completed ON public.maintenance_history(completed_at DESC);

-- 7. MA REPORT TRACKING TABLE
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

-- ==============================================================================
-- STORED FUNCTIONS & RPCs (ATOMIC & CONCURRENCY SAFE)
-- ==============================================================================

-- 8. RPC: complete_round_maintenance
-- Atomic transaction preventing duplicate counts for the same plant in the same round
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
    -- 1. Lock and fetch plant
    SELECT * INTO v_plant FROM public.solar_plants WHERE id = p_plant_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Solar Plant not found: %', p_plant_id;
    END IF;

    -- 2. RULE CHECK: Has this plant already been completed for this round?
    IF EXISTS (
        SELECT 1 FROM public.maintenance_history 
        WHERE solar_plant_id = p_plant_id AND round_number = p_round
    ) THEN
        RAISE EXCEPTION 'Duplicate count prohibited: Solar plant % has already been completed for Round %', v_plant.solar_plant, p_round;
    END IF;

    v_new_count := COALESCE(v_plant.total_count, 0) + 1;
    v_history_id := 'hist-' || p_plant_id || '-r' || p_round || '-' || EXTRACT(EPOCH FROM v_now)::BIGINT;

    -- 3. Insert audit history (enforced by UNIQUE constraint)
    INSERT INTO public.maintenance_history (
        id, solar_plant_id, solar_plant_name, round_number, count_number, completed_at, team_name, user_name, status, note
    ) VALUES (
        v_history_id, p_plant_id, v_plant.solar_plant, p_round, v_new_count, v_now, p_team, p_user, 'Completed', p_note
    );

    -- 4. Update or insert maintenance_rounds
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

    -- 5. Update solar_plants count and latest maintenance date
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
-- Advances current queue circularly. When passing last queue, wraps to queue 1 and increments round.
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
        -- Loop around to Queue 1 and increment Round
        v_next_queue_index := 1;
        v_next_round := v_state.current_round + 1;
    ELSE
        v_next_queue_index := v_state.current_queue_index + 1;
        v_next_round := v_state.current_round;
    END IF;

    -- Find plant at next_queue_index
    SELECT * INTO v_next_plant 
    FROM public.solar_plants 
    ORDER BY queue_number ASC 
    OFFSET (v_next_queue_index - 1) LIMIT 1;

    -- Update queue state
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

-- ==============================================================================
-- ENABLE SUPABASE REALTIME
-- ==============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_state;
ALTER PUBLICATION supabase_realtime ADD TABLE public.maintenance_rounds;
ALTER PUBLICATION supabase_realtime ADD TABLE public.maintenance_history;
ALTER PUBLICATION supabase_realtime ADD TABLE public.solar_plants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ma_reports;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solar_plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ma_reports ENABLE ROW LEVEL SECURITY;

-- Allow public read & write access for authenticated & anon clients
CREATE POLICY "Public Read All Teams" ON public.teams FOR ALL USING (true);
CREATE POLICY "Public Read All Plants" ON public.solar_plants FOR ALL USING (true);
CREATE POLICY "Public Read Queue State" ON public.queue_state FOR ALL USING (true);
CREATE POLICY "Public Read Rounds" ON public.maintenance_rounds FOR ALL USING (true);
CREATE POLICY "Public Read History" ON public.maintenance_history FOR ALL USING (true);
CREATE POLICY "Public Read Reports" ON public.ma_reports FOR ALL USING (true);
