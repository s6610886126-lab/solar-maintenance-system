import { SolarPlant, MaintenanceRound, MaintenanceHistory, MAReport, Team, QueueState, QueueCompleteResult } from '../types/maintenance';
import { 
  initialPlants, 
  initialRounds, 
  initialHistory, 
  initialReports, 
  initialTeams, 
  initialQueueState,
  seedPlants,
  seedRounds,
  seedHistory,
  seedReports,
  seedTeams,
  seedQueueState
} from './initialData';
import { getSupabase, checkSupabaseConnection } from './supabase';

const STORAGE_PREFIX = 'SOLAR_MAINT_';
const BROADCAST_CHANNEL_NAME = 'solar_maintenance_sync';

// Local storage keys
const KEY_PLANTS = STORAGE_PREFIX + 'PLANTS';
const KEY_ROUNDS = STORAGE_PREFIX + 'ROUNDS';
const KEY_HISTORY = STORAGE_PREFIX + 'HISTORY';
const KEY_REPORTS = STORAGE_PREFIX + 'REPORTS';
const KEY_TEAMS = STORAGE_PREFIX + 'TEAMS';
const KEY_QUEUE = STORAGE_PREFIX + 'QUEUE';
const KEY_CLEARED = STORAGE_PREFIX + 'DATA_CLEARED';

type Listener = () => void;

class DataService {
  private plants: SolarPlant[] = [];
  private rounds: MaintenanceRound[] = [];
  private history: MaintenanceHistory[] = [];
  private reports: MAReport[] = [];
  private teams: Team[] = [];
  private queueState: QueueState = initialQueueState;

  private listeners: Set<Listener> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private isSupabaseLive: boolean = false;
  private isInitialized: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      this.broadcastChannel.onmessage = (event) => {
        if (event.data?.type === 'STATE_CHANGED') {
          this.loadFromStorage();
          this.notifyListeners();
        }
      };
    }
  }

  public async init() {
    if (this.isInitialized) return;

    // First load from local storage or fallback to seed
    this.loadFromStorage();

    // Check Supabase connection
    const conn = await checkSupabaseConnection();
    if (conn.connected && conn.hasTables) {
      this.isSupabaseLive = true;
      await this.fetchFromSupabase();
      this.subscribeSupabaseRealtime();
      this.startHeartbeatPolling();
    }

    this.isInitialized = true;
    this.notifyListeners();
  }

  private loadFromStorage() {
    try {
      const isCleared = localStorage.getItem(KEY_CLEARED) === 'true';

      if (isCleared) {
        // Explicitly cleared
        const storedPlants = localStorage.getItem(KEY_PLANTS);
        this.plants = storedPlants ? JSON.parse(storedPlants) : [];

        const storedRounds = localStorage.getItem(KEY_ROUNDS);
        this.rounds = storedRounds ? JSON.parse(storedRounds) : [];

        const storedHistory = localStorage.getItem(KEY_HISTORY);
        this.history = storedHistory ? JSON.parse(storedHistory) : [];

        const storedReports = localStorage.getItem(KEY_REPORTS);
        this.reports = storedReports ? JSON.parse(storedReports) : [];

        const storedTeams = localStorage.getItem(KEY_TEAMS);
        this.teams = storedTeams ? JSON.parse(storedTeams) : initialTeams;

        const storedQueue = localStorage.getItem(KEY_QUEUE);
        this.queueState = storedQueue ? JSON.parse(storedQueue) : { ...initialQueueState };
      } else {
        const storedPlants = localStorage.getItem(KEY_PLANTS);
        this.plants = storedPlants ? JSON.parse(storedPlants) : seedPlants;

        const storedRounds = localStorage.getItem(KEY_ROUNDS);
        this.rounds = storedRounds ? JSON.parse(storedRounds) : seedRounds;

        const storedHistory = localStorage.getItem(KEY_HISTORY);
        this.history = storedHistory ? JSON.parse(storedHistory) : seedHistory;

        const storedReports = localStorage.getItem(KEY_REPORTS);
        this.reports = storedReports ? JSON.parse(storedReports) : seedReports;

        const storedTeams = localStorage.getItem(KEY_TEAMS);
        this.teams = storedTeams ? JSON.parse(storedTeams) : seedTeams;

        const storedQueue = localStorage.getItem(KEY_QUEUE);
        this.queueState = storedQueue ? JSON.parse(storedQueue) : seedQueueState;
        if (!this.queueState.activePlantId && this.plants.length > 0) {
          this.queueState.activePlantId = this.plants[0].id;
        }
      }
    } catch (e) {
      console.error('Error loading from local storage:', e);
      this.plants = [];
      this.rounds = [];
      this.history = [];
      this.reports = [];
      this.teams = [...initialTeams];
      this.queueState = { ...initialQueueState };
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(KEY_PLANTS, JSON.stringify(this.plants));
      localStorage.setItem(KEY_ROUNDS, JSON.stringify(this.rounds));
      localStorage.setItem(KEY_HISTORY, JSON.stringify(this.history));
      localStorage.setItem(KEY_REPORTS, JSON.stringify(this.reports));
      localStorage.setItem(KEY_TEAMS, JSON.stringify(this.teams));
      localStorage.setItem(KEY_QUEUE, JSON.stringify(this.queueState));

      // Broadcast to other tabs
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({ type: 'STATE_CHANGED', timestamp: Date.now() });
      }
    } catch (e) {
      console.error('Error saving to storage:', e);
    }
  }

  // Fetch all tables from Supabase when connected
  private async fetchFromSupabase() {
    const supabase = getSupabase();
    try {
      const [pRes, rRes, hRes, repRes, tRes, qRes] = await Promise.all([
        supabase.from('solar_plants').select('*').order('queue_number'),
        supabase.from('maintenance_rounds').select('*'),
        supabase.from('maintenance_history').select('*').order('completed_at', { ascending: false }),
        supabase.from('ma_reports').select('*'),
        supabase.from('teams').select('*'),
        supabase.from('queue_state').select('*').eq('id', 1).single(),
      ]);

      if (pRes.data) {
        this.plants = pRes.data.map(mapDbToSolarPlant);
      }

      if (rRes.data) {
        this.rounds = rRes.data.map(mapDbToMaintenanceRound);
      }
      if (hRes.data) {
        this.history = hRes.data.map(mapDbToMaintenanceHistory);
      }
      if (repRes.data) {
        this.reports = repRes.data.map(mapDbToMAReport);
      }
      if (tRes.data && tRes.data.length > 0) {
        this.teams = tRes.data;
      }
      if (qRes.data) {
        this.queueState = {
          currentQueueIndex: qRes.data.current_queue_index,
          currentRound: qRes.data.current_round,
          activePlantId: qRes.data.active_plant_id,
          totalQueues: qRes.data.total_queues,
          updatedAt: qRes.data.updated_at,
          updatedBy: qRes.data.updated_by || 'System',
        };
      } else {
        this.queueState = {
          currentQueueIndex: this.plants.length > 0 ? 1 : 0,
          currentRound: 1,
          activePlantId: this.plants[0]?.id || null,
          totalQueues: this.plants.length,
          updatedAt: new Date().toISOString(),
          updatedBy: 'System',
        };
      }
      this.saveToStorage();
    } catch (err) {
      console.warn('Could not sync with Supabase tables, using local state:', err);
    }
  }

  public async syncAllToSupabase() {
    if (!this.isSupabaseLive) return;
    const supabase = getSupabase();
    try {
      if (this.plants.length > 0) {
        const plantRows = this.plants.map((p) => ({
          id: p.id,
          queue_number: p.queueNumber,
          no: p.no,
          solar_plant: p.solarPlant,
          capacity_kw: p.capacityKw,
          location_area: p.locationArea,
          property_village: p.propertyVillage,
          map_url: p.mapUrl,
          status: p.status,
          qt_contract: p.qtContract,
          contact_name: p.contactName,
          tel: p.tel,
          email: p.email,
          other_contact: p.otherContact,
          turn_on_date: cleanDate(p.turnOnDate),
          latest_renew_contract: cleanDate(p.latestRenewContract),
          ma_contract_expired: cleanDate(p.maContractExpired),
          latest_maintenance: cleanDate(p.latestMaintenance),
          om_contract_count: p.omContractCount,
          total_count: p.totalCount,
          current_round: p.currentRound,
          note: p.note,
        }));
        for (let i = 0; i < plantRows.length; i += 100) {
          const { error } = await supabase.from('solar_plants').upsert(plantRows.slice(i, i + 100));
          if (error) console.error('Supabase solar_plants upsert error:', error);
        }
      }

      if (this.rounds.length > 0) {
        const roundRows = this.rounds.map((r) => ({
          id: r.id,
          solar_plant_id: r.solarPlantId,
          round_number: r.roundNumber,
          scheduled_date: cleanDate(r.scheduledDate),
          is_completed: r.isCompleted,
          completed_at: r.completedAt || null,
          team_name: r.teamName,
          count_number: r.countNumber,
          note: r.note,
        }));
        for (let i = 0; i < roundRows.length; i += 300) {
          const { error } = await supabase.from('maintenance_rounds').upsert(roundRows.slice(i, i + 300));
          if (error) console.error('Supabase maintenance_rounds upsert error:', error);
        }
      }

      if (this.queueState) {
        const { error } = await supabase.from('queue_state').upsert({
          id: 1,
          current_queue_index: this.queueState.currentQueueIndex || 1,
          current_round: this.queueState.currentRound || 1,
          active_plant_id: this.queueState.activePlantId || (this.plants[0]?.id || null),
          total_queues: this.queueState.totalQueues || this.plants.length,
          updated_at: this.queueState.updatedAt || new Date().toISOString(),
          updated_by: this.queueState.updatedBy || 'Admin',
        });
        if (error) console.error('Supabase queue_state upsert error:', error);
      }
    } catch (err) {
      console.error('Error syncing all to Supabase:', err);
    }
  }

  // Subscribe to Supabase Realtime channel
  private subscribeSupabaseRealtime() {
    const supabase = getSupabase();
    const channel = supabase.channel('solar_maintenance_realtime');

    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_state' }, (payload) => {
        if (payload.new) {
          const row: any = payload.new;
          this.queueState = {
            currentQueueIndex: row.current_queue_index,
            currentRound: row.current_round,
            activePlantId: row.active_plant_id,
            totalQueues: row.total_queues,
            updatedAt: row.updated_at,
            updatedBy: row.updated_by,
          };
          this.saveToStorage();
          this.notifyListeners();
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance_history' }, () => {
        this.fetchFromSupabase().then(() => this.notifyListeners());
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'solar_plants' }, () => {
        this.fetchFromSupabase().then(() => this.notifyListeners());
      })
      .subscribe();
  }

  private pollingTimer: any = null;

  private startHeartbeatPolling() {
    if (this.pollingTimer) clearInterval(this.pollingTimer);
    this.pollingTimer = setInterval(async () => {
      if (!this.isSupabaseLive) return;
      try {
        await this.fetchFromSupabase();
        this.notifyListeners();
      } catch (e) {
        // Silent fail
      }
    }, 4000);
  }

  public async refreshData() {
    if (this.isSupabaseLive) {
      await this.fetchFromSupabase();
    } else {
      this.loadFromStorage();
    }
    this.notifyListeners();
  }

  // ==========================================
  // GETTERS
  // ==========================================
  public getPlants(): SolarPlant[] {
    return this.plants;
  }

  public getRounds(): MaintenanceRound[] {
    return this.rounds;
  }

  public getHistory(): MaintenanceHistory[] {
    return this.history;
  }

  public getReports(): MAReport[] {
    return this.reports;
  }

  public getTeams(): Team[] {
    return this.teams;
  }

  public getQueueState(): QueueState {
    return this.queueState;
  }

  public isSupabaseConnected(): boolean {
    return this.isSupabaseLive;
  }

  public getCurrentPlant(): SolarPlant | null {
    if (!this.plants.length) return null;
    const plant = this.plants.find((p) => p.id === this.queueState.activePlantId);
    if (plant) return plant;
    const index = Math.max(0, Math.min(this.queueState.currentQueueIndex - 1, this.plants.length - 1));
    return this.plants[index] || null;
  }

  public getPlantById(id: string): SolarPlant | undefined {
    return this.plants.find((p) => p.id === id);
  }

  public getPlantRounds(plantId: string): MaintenanceRound[] {
    return this.rounds.filter((r) => r.solarPlantId === plantId).sort((a, b) => a.roundNumber - b.roundNumber);
  }

  public getPlantHistory(plantId: string): MaintenanceHistory[] {
    return this.history.filter((h) => h.solarPlantId === plantId).sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  }

  public isPlantCompletedForRound(plantId: string, roundNumber: number): boolean {
    return this.history.some((h) => h.solarPlantId === plantId && h.roundNumber === roundNumber);
  }

  // ==========================================
  // CORE BUSINESS LOGIC
  // ==========================================
  public async completeMaintenance(
    plantId: string,
    roundNumber: number,
    teamName: string = 'Team A',
    userName: string = 'Admin',
    note: string = ''
  ): Promise<QueueCompleteResult> {
    const plant = this.getPlantById(plantId);
    if (!plant) {
      return { success: false, message: 'Solar Plant not found' };
    }

    if (this.isPlantCompletedForRound(plantId, roundNumber)) {
      return {
        success: false,
        message: `Duplicate action prevented! ${plant.solarPlant} is already marked completed for Round ${roundNumber}.`,
      };
    }

    if (this.isSupabaseLive) {
      try {
        const supabase = getSupabase();
        const { data, error } = await supabase.rpc('complete_round_maintenance', {
          p_plant_id: plantId,
          p_round: roundNumber,
          p_team: teamName,
          p_user: userName,
          p_note: note,
        });

        if (!error && data) {
          await this.fetchFromSupabase();
          this.notifyListeners();
          return {
            success: true,
            newCount: data?.new_count,
            roundNumber,
            solarPlantId: plantId,
          };
        } else {
          console.warn('Supabase RPC error, falling back to local handler:', error);
        }
      } catch (err: any) {
        console.warn('Supabase RPC exception, falling back to local handler:', err);
      }
    }

    const nowStr = new Date().toISOString();
    const todayDate = nowStr.split('T')[0];
    const newCount = (plant.totalCount || 0) + 1;

    const historyItem: MaintenanceHistory = {
      id: `hist-${plantId}-r${roundNumber}-${Date.now()}`,
      solarPlantId: plantId,
      solarPlantName: plant.solarPlant,
      roundNumber: roundNumber,
      countNumber: newCount,
      completedAt: nowStr,
      teamName: teamName,
      userName: userName,
      status: 'Completed',
      note: note || `Maintenance Round ${roundNumber}`,
    };
    this.history.unshift(historyItem);

    const roundIndex = this.rounds.findIndex((r) => r.solarPlantId === plantId && r.roundNumber === roundNumber);
    if (roundIndex >= 0) {
      this.rounds[roundIndex] = {
        ...this.rounds[roundIndex],
        scheduledDate: this.rounds[roundIndex].scheduledDate || todayDate,
        isCompleted: true,
        completedAt: nowStr,
        teamName: teamName,
        countNumber: newCount,
        note: note || this.rounds[roundIndex].note,
      };
    } else {
      this.rounds.push({
        id: `${plantId}-r${roundNumber}`,
        solarPlantId: plantId,
        roundNumber: roundNumber,
        scheduledDate: todayDate,
        isCompleted: true,
        completedAt: nowStr,
        teamName: teamName,
        countNumber: newCount,
        note: note,
      });
    }

    const plantIndex = this.plants.findIndex((p) => p.id === plantId);
    if (plantIndex >= 0) {
      this.plants[plantIndex] = {
        ...this.plants[plantIndex],
        totalCount: newCount,
        latestMaintenance: todayDate,
        currentRound: Math.min(12, roundNumber + 1),
      };
    }

    this.saveToStorage();
    this.notifyListeners();

    return {
      success: true,
      newCount,
      roundNumber,
      solarPlantId: plantId,
    };
  }

  public async advanceQueue(userName: string = 'Admin'): Promise<{ success: boolean; nextPlantName?: string; round?: number }> {
    if (!this.plants.length) return { success: false };

    if (this.isSupabaseLive) {
      try {
        const supabase = getSupabase();
        const { data, error } = await supabase.rpc('advance_queue', { p_user: userName });
        if (!error && data) {
          await this.fetchFromSupabase();
          this.notifyListeners();
          return {
            success: true,
            nextPlantName: data?.solar_plant_name,
            round: data?.current_round,
          };
        } else {
          console.warn('Supabase advance_queue RPC error, falling back to local state:', error);
        }
      } catch (e) {
        console.warn('advanceQueue RPC failed, falling back to local state:', e);
      }
    }

    let nextIndex = this.queueState.currentQueueIndex + 1;
    let nextRound = this.queueState.currentRound;

    if (nextIndex > this.plants.length) {
      nextIndex = 1;
      nextRound += 1;
    }

    const nextPlant = this.plants[nextIndex - 1];

    this.queueState = {
      ...this.queueState,
      currentQueueIndex: nextIndex,
      currentRound: nextRound,
      activePlantId: nextPlant ? nextPlant.id : null,
      totalQueues: this.plants.length,
      updatedAt: new Date().toISOString(),
      updatedBy: userName,
    };

    this.saveToStorage();
    this.notifyListeners();

    return {
      success: true,
      nextPlantName: nextPlant ? nextPlant.solarPlant : '',
      round: nextRound,
    };
  }

  public setQueueToPlant(plantId: string, userName: string = 'Admin') {
    const plantIndex = this.plants.findIndex((p) => p.id === plantId);
    if (plantIndex < 0) return;

    this.queueState = {
      ...this.queueState,
      currentQueueIndex: plantIndex + 1,
      activePlantId: plantId,
      updatedAt: new Date().toISOString(),
      updatedBy: userName,
    };

    this.saveToStorage();
    this.notifyListeners();

    if (this.isSupabaseLive) {
      const supabase = getSupabase();
      supabase.from('queue_state').upsert({
        id: 1,
        current_queue_index: this.queueState.currentQueueIndex,
        current_round: this.queueState.currentRound,
        active_plant_id: this.queueState.activePlantId,
        total_queues: this.queueState.totalQueues,
        updated_at: this.queueState.updatedAt,
        updated_by: userName,
      }).then((res) => {
        if (res.error) console.error('Supabase setQueueToPlant error:', res.error);
      });
    }
  }

  public addPlant(newPlantData: Partial<SolarPlant> & { solarPlant: string }): SolarPlant {
    localStorage.removeItem(KEY_CLEARED);
    const newId = newPlantData.id || `plant-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const nextNo = this.plants.length > 0 ? Math.max(...this.plants.map((p) => p.no || p.queueNumber || 0)) + 1 : 1;
    const nextQueue = this.plants.length + 1;

    const plant: SolarPlant = {
      id: newId,
      queueNumber: newPlantData.queueNumber || nextQueue,
      no: newPlantData.no || nextNo,
      solarPlant: newPlantData.solarPlant.trim(),
      capacityKw: newPlantData.capacityKw !== undefined ? newPlantData.capacityKw : null,
      locationArea: (newPlantData.locationArea || '').trim(),
      propertyVillage: (newPlantData.propertyVillage || '').trim(),
      mapUrl: (newPlantData.mapUrl || '').trim(),
      status: newPlantData.status || 'Paid / Active',
      qtContract: (newPlantData.qtContract || '').trim(),
      dateIssueNewContract: newPlantData.dateIssueNewContract || null,
      contractAccept: newPlantData.contractAccept || null,
      paidDate: newPlantData.paidDate || null,
      contactName: (newPlantData.contactName || '').trim(),
      tel: (newPlantData.tel || '').trim(),
      email: (newPlantData.email || '').trim(),
      otherContact: (newPlantData.otherContact || '').trim(),
      turnOnDate: newPlantData.turnOnDate || null,
      latestRenewContract: newPlantData.latestRenewContract || null,
      maContractExpired: newPlantData.maContractExpired || null,
      latestMaintenance: newPlantData.latestMaintenance || null,
      maintenancePeriod: newPlantData.maintenancePeriod || '',
      omContractCount: newPlantData.omContractCount || 4,
      totalCount: newPlantData.totalCount || 0,
      currentRound: newPlantData.currentRound || 1,
      note: (newPlantData.note || '').trim(),
    };

    this.plants.push(plant);
    this.queueState.totalQueues = this.plants.length;
    if (this.queueState.currentQueueIndex === 0 || !this.queueState.activePlantId) {
      this.queueState.currentQueueIndex = 1;
      this.queueState.activePlantId = plant.id;
    }

    // Generate 12 rounds for this new plant (auto-schedule dates if start date or reference date provided)
    const countPerYear = plant.omContractCount || 4;
    const intervalMonths = Math.max(1, Math.round(12 / countPerYear));
    const baseDateStr = (newPlantData as any).firstScheduledDate || plant.turnOnDate || plant.latestMaintenance || '';

    let baseYear = 0, baseMonth = 0, baseDay = 1;
    if (baseDateStr) {
      const parts = baseDateStr.split('-');
      if (parts.length === 3) {
        baseYear = parseInt(parts[0], 10);
        baseMonth = parseInt(parts[1], 10) - 1;
        baseDay = parseInt(parts[2], 10) || 1;
      }
    }

    for (let r = 1; r <= 12; r++) {
      let scheduledDate = '';
      if (baseYear > 0) {
        const targetDate = new Date(baseYear, baseMonth + (r - 1) * intervalMonths, baseDay);
        const yyyy = targetDate.getFullYear();
        const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
        const dd = String(targetDate.getDate()).padStart(2, '0');
        scheduledDate = `${yyyy}-${mm}-${dd}`;
      }

      this.rounds.push({
        id: `${plant.id}-r${r}`,
        solarPlantId: plant.id,
        roundNumber: r,
        scheduledDate,
        isCompleted: false,
        completedAt: null,
        teamName: 'Team A',
        countNumber: null,
        note: '',
      });
    }

    this.saveToStorage();
    this.notifyListeners();

    // Sync with Supabase if live
    if (this.isSupabaseLive) {
      const supabase = getSupabase();
      supabase.from('solar_plants').insert({
        id: plant.id,
        queue_number: plant.queueNumber,
        no: plant.no,
        solar_plant: plant.solarPlant,
        capacity_kw: plant.capacityKw,
        location_area: plant.locationArea,
        property_village: plant.propertyVillage,
        map_url: plant.mapUrl,
        status: plant.status,
        qt_contract: plant.qtContract,
        contact_name: plant.contactName,
        tel: plant.tel,
        email: plant.email,
        other_contact: plant.otherContact,
        turn_on_date: plant.turnOnDate,
        latest_renew_contract: plant.latestRenewContract,
        ma_contract_expired: plant.maContractExpired,
        latest_maintenance: plant.latestMaintenance,
        om_contract_count: plant.omContractCount,
        total_count: plant.totalCount,
        current_round: plant.currentRound,
        note: plant.note,
      }).then((res) => {
        if (res.error) console.error('Supabase add plant error:', res.error);
      });
    }

    return plant;
  }

  public deletePlant(plantId: string) {
    const idx = this.plants.findIndex((p) => p.id === plantId);
    if (idx < 0) return;

    this.plants = this.plants.filter((p) => p.id !== plantId);
    this.rounds = this.rounds.filter((r) => r.solarPlantId !== plantId);
    this.history = this.history.filter((h) => h.solarPlantId !== plantId);
    this.reports = this.reports.filter((rep) => rep.solarPlantId !== plantId);

    // Re-index queue numbers
    this.plants.forEach((p, i) => {
      p.queueNumber = i + 1;
    });

    this.queueState.totalQueues = this.plants.length;
    if (this.queueState.activePlantId === plantId) {
      if (this.plants.length > 0) {
        const nextIdx = Math.min(this.queueState.currentQueueIndex - 1, this.plants.length - 1);
        this.queueState.currentQueueIndex = nextIdx + 1;
        this.queueState.activePlantId = this.plants[nextIdx].id;
      } else {
        this.queueState.currentQueueIndex = 0;
        this.queueState.activePlantId = null;
      }
    }

    this.saveToStorage();
    this.notifyListeners();

    if (this.isSupabaseLive) {
      const supabase = getSupabase();
      supabase.from('solar_plants').delete().eq('id', plantId).then((res) => {
        if (res.error) console.error('Supabase delete plant error:', res.error);
      });
    }
  }

  public updatePlant(plant: SolarPlant) {
    const idx = this.plants.findIndex((p) => p.id === plant.id);
    if (idx >= 0) {
      this.plants[idx] = { ...plant };
      this.saveToStorage();
      this.notifyListeners();

      if (this.isSupabaseLive) {
        const supabase = getSupabase();
        supabase.from('solar_plants').upsert({
          id: plant.id,
          queue_number: plant.queueNumber,
          no: plant.no,
          solar_plant: plant.solarPlant,
          capacity_kw: plant.capacityKw,
          location_area: plant.locationArea,
          property_village: plant.propertyVillage,
          map_url: plant.mapUrl,
          status: plant.status,
          qt_contract: plant.qtContract,
          contact_name: plant.contactName,
          tel: plant.tel,
          email: plant.email,
          other_contact: plant.otherContact,
          turn_on_date: plant.turnOnDate || null,
          latest_renew_contract: plant.latestRenewContract || null,
          ma_contract_expired: plant.maContractExpired || null,
          latest_maintenance: plant.latestMaintenance || null,
          om_contract_count: plant.omContractCount,
          total_count: plant.totalCount,
          current_round: plant.currentRound,
          note: plant.note,
        }).then((res) => {
          if (res.error) console.error('Supabase update plant error:', res.error);
        });
      }
    }
  }

  // Update Round Date, Team, or Status
  public updateRound(plantId: string, roundNumber: number, data: { scheduledDate?: string; teamName?: string; isCompleted?: boolean }) {
    const idx = this.rounds.findIndex((r) => r.solarPlantId === plantId && r.roundNumber === roundNumber);
    if (idx >= 0) {
      this.rounds[idx] = {
        ...this.rounds[idx],
        scheduledDate: data.scheduledDate !== undefined ? data.scheduledDate : this.rounds[idx].scheduledDate,
        teamName: data.teamName !== undefined ? data.teamName : this.rounds[idx].teamName,
        isCompleted: data.isCompleted !== undefined ? data.isCompleted : this.rounds[idx].isCompleted,
      };
    } else {
      this.rounds.push({
        id: `${plantId}-r${roundNumber}`,
        solarPlantId: plantId,
        roundNumber: roundNumber,
        scheduledDate: data.scheduledDate || '',
        isCompleted: data.isCompleted || false,
        completedAt: data.isCompleted ? (data.scheduledDate || new Date().toISOString().split('T')[0]) : null,
        teamName: data.teamName || 'Team A',
        countNumber: data.isCompleted ? roundNumber : null,
        note: '',
      });
    }

    // Recalculate plant's totalCount if isCompleted changed
    const plant = this.getPlantById(plantId);
    if (plant) {
      const plantRounds = this.rounds.filter((r) => r.solarPlantId === plantId && r.isCompleted);
      plant.totalCount = plantRounds.length;
      this.updatePlant(plant);
    }

    this.saveToStorage();
    this.notifyListeners();

    if (this.isSupabaseLive) {
      const supabase = getSupabase();
      const updated = this.rounds.find((r) => r.solarPlantId === plantId && r.roundNumber === roundNumber);
      if (updated) {
        supabase.from('maintenance_rounds').upsert({
          id: updated.id,
          solar_plant_id: updated.solarPlantId,
          round_number: updated.roundNumber,
          scheduled_date: updated.scheduledDate || null,
          team_name: updated.teamName,
          is_completed: updated.isCompleted,
        }).then((res) => {
          if (res.error) console.error('Supabase update round error:', res.error);
        });
      }
    }
  }

  // Auto-generate schedule dates for all 12 rounds
  public autoGenerateRoundsSchedule(plantId: string, startDateStr?: string): boolean {
    const plant = this.getPlantById(plantId);
    if (!plant) return false;

    const baseDate = startDateStr 
      || plant.turnOnDate 
      || plant.latestMaintenance 
      || plant.latestRenewContract 
      || new Date().toISOString().split('T')[0];

    const countPerYear = plant.omContractCount || 4;
    const intervalMonths = Math.max(1, Math.round(12 / countPerYear));

    const parts = baseDate.split('-');
    let baseYear = new Date().getFullYear();
    let baseMonth = 0;
    let baseDay = 1;

    if (parts.length === 3) {
      baseYear = parseInt(parts[0], 10);
      baseMonth = parseInt(parts[1], 10) - 1;
      baseDay = parseInt(parts[2], 10) || 1;
    }

    for (let r = 1; r <= 12; r++) {
      const targetDate = new Date(baseYear, baseMonth + (r - 1) * intervalMonths, baseDay);
      const yyyy = targetDate.getFullYear();
      const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
      const dd = String(targetDate.getDate()).padStart(2, '0');
      const scheduledDate = `${yyyy}-${mm}-${dd}`;

      const roundIdx = this.rounds.findIndex((rnd) => rnd.solarPlantId === plantId && rnd.roundNumber === r);
      if (roundIdx >= 0) {
        this.rounds[roundIdx].scheduledDate = scheduledDate;
      } else {
        this.rounds.push({
          id: `${plantId}-r${r}`,
          solarPlantId: plantId,
          roundNumber: r,
          scheduledDate,
          isCompleted: false,
          completedAt: null,
          teamName: 'Team A',
          countNumber: null,
          note: '',
        });
      }
    }

    this.saveToStorage();
    this.notifyListeners();

    if (this.isSupabaseLive) {
      const supabase = getSupabase();
      const plantRounds = this.rounds.filter((r) => r.solarPlantId === plantId);
      supabase.from('maintenance_rounds').upsert(
        plantRounds.map((r) => ({
          id: r.id,
          solar_plant_id: r.solarPlantId,
          round_number: r.roundNumber,
          scheduled_date: r.scheduledDate || null,
          team_name: r.teamName,
          is_completed: r.isCompleted,
        }))
      ).then((res) => {
        if (res.error) console.error('Supabase auto-schedule error:', res.error);
      });
    }

    return true;
  }

  public completeMAReport(reportId: string, sendDate: string = '') {
    const now = sendDate || new Date().toISOString().split('T')[0];
    const idx = this.reports.findIndex((r) => r.id === reportId);
    if (idx >= 0) {
      this.reports[idx] = {
        ...this.reports[idx],
        isReportCompleted: true,
        sendToCustomerDate: now,
        status: 'Completed',
      };
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  public saveTeam(team: Team) {
    const idx = this.teams.findIndex((t) => t.id === team.id);
    if (idx >= 0) {
      this.teams[idx] = team;
    } else {
      this.teams.push(team);
    }
    this.saveToStorage();
    this.notifyListeners();
  }

  public deleteTeam(teamId: string) {
    this.teams = this.teams.filter((t) => t.id !== teamId);
    this.saveToStorage();
    this.notifyListeners();
  }

  public async importData(
    newPlants: SolarPlant[],
    newRounds: MaintenanceRound[],
    newReports: MAReport[],
    mode: 'add_new_only' | 'merge_update' | 'replace_all' = 'add_new_only'
  ) {
    localStorage.removeItem(KEY_CLEARED);

    if (mode === 'replace_all') {
      if (this.isSupabaseLive) {
        try {
          const supabase = getSupabase();
          await Promise.all([
            supabase.from('solar_plants').delete().neq('id', '___none___'),
            supabase.from('maintenance_rounds').delete().neq('id', '___none___'),
            supabase.from('ma_reports').delete().neq('id', '___none___'),
          ]);
        } catch (e) {}
      }
      if (newPlants.length > 0) {
        this.plants = newPlants;
        this.queueState.totalQueues = newPlants.length;
        this.queueState.currentQueueIndex = 1;
        this.queueState.activePlantId = newPlants[0].id;
      } else {
        this.plants = [];
        this.queueState.totalQueues = 0;
        this.queueState.currentQueueIndex = 0;
        this.queueState.activePlantId = null;
      }
      this.rounds = newRounds || [];
      this.reports = newReports || [];
    } else if (mode === 'add_new_only') {
      const existingNames = new Set(this.plants.map((p) => p.solarPlant.trim().toLowerCase()));
      const existingIds = new Set(this.plants.map((p) => p.id));

      const trulyNewPlants = newPlants.filter(
        (p) => !existingNames.has(p.solarPlant.trim().toLowerCase()) && !existingIds.has(p.id)
      );

      if (trulyNewPlants.length > 0) {
        const addedPlants: SolarPlant[] = [];
        const addedRounds: MaintenanceRound[] = [];
        const addedReports: MAReport[] = [];

        trulyNewPlants.forEach((p, idx) => {
          const nextQueueNum = this.plants.length + idx + 1;
          const newPlantId = `plant-${Date.now()}-${idx}`;
          const oldPlantId = p.id;

          const plantToAdd: SolarPlant = {
            ...p,
            id: newPlantId,
            queueNumber: nextQueueNum,
            no: nextQueueNum,
          };
          addedPlants.push(plantToAdd);

          const oldRounds = newRounds.filter((r) => r.solarPlantId === oldPlantId);
          oldRounds.forEach((r) => {
            addedRounds.push({
              ...r,
              id: `${newPlantId}-r${r.roundNumber}`,
              solarPlantId: newPlantId,
            });
          });

          const oldReports = newReports.filter((rep) => rep.solarPlantId === oldPlantId);
          oldReports.forEach((rep) => {
            addedReports.push({
              ...rep,
              id: `${newPlantId}-rep`,
              solarPlantId: newPlantId,
            });
          });
        });

        this.plants = [...this.plants, ...addedPlants];
        this.rounds = [...this.rounds, ...addedRounds];
        this.reports = [...this.reports, ...addedReports];
        this.queueState.totalQueues = this.plants.length;

        if (!this.queueState.activePlantId && this.plants.length > 0) {
          this.queueState.currentQueueIndex = 1;
          this.queueState.activePlantId = this.plants[0].id;
        }
      }
    } else if (mode === 'merge_update') {
      const existingMap = new Map(this.plants.map((p) => [p.solarPlant.trim().toLowerCase(), p]));
      const trulyNewPlants: SolarPlant[] = [];

      newPlants.forEach((p) => {
        const existing = existingMap.get(p.solarPlant.trim().toLowerCase());
        if (existing) {
          if (p.capacityKw) existing.capacityKw = p.capacityKw;
          if (p.locationArea) existing.locationArea = p.locationArea;
          if (p.propertyVillage) existing.propertyVillage = p.propertyVillage;
          if (p.mapUrl) existing.mapUrl = p.mapUrl;
          if (p.contactName) existing.contactName = p.contactName;
          if (p.tel) existing.tel = p.tel;
          if (p.email) existing.email = p.email;
          if (p.qtContract) existing.qtContract = p.qtContract;
          if (p.dateIssueNewContract) existing.dateIssueNewContract = p.dateIssueNewContract;
          if (p.contractAccept) existing.contractAccept = p.contractAccept;
          if (p.paidDate) existing.paidDate = p.paidDate;
          if (p.turnOnDate) existing.turnOnDate = p.turnOnDate;
          if (p.latestRenewContract) existing.latestRenewContract = p.latestRenewContract;
          if (p.maContractExpired) existing.maContractExpired = p.maContractExpired;
          if (p.omContractCount) existing.omContractCount = p.omContractCount;
        } else {
          trulyNewPlants.push(p);
        }
      });

      if (trulyNewPlants.length > 0) {
        const addedPlants: SolarPlant[] = [];
        const addedRounds: MaintenanceRound[] = [];
        const addedReports: MAReport[] = [];

        trulyNewPlants.forEach((p, idx) => {
          const nextQueueNum = this.plants.length + idx + 1;
          const newPlantId = `plant-${Date.now()}-${idx}`;
          const oldPlantId = p.id;

          const plantToAdd: SolarPlant = {
            ...p,
            id: newPlantId,
            queueNumber: nextQueueNum,
            no: nextQueueNum,
          };
          addedPlants.push(plantToAdd);

          const oldRounds = newRounds.filter((r) => r.solarPlantId === oldPlantId);
          oldRounds.forEach((r) => {
            addedRounds.push({
              ...r,
              id: `${newPlantId}-r${r.roundNumber}`,
              solarPlantId: newPlantId,
            });
          });

          const oldReports = newReports.filter((rep) => rep.solarPlantId === oldPlantId);
          oldReports.forEach((rep) => {
            addedReports.push({
              ...rep,
              id: `${newPlantId}-rep`,
              solarPlantId: newPlantId,
            });
          });
        });

        this.plants = [...this.plants, ...addedPlants];
        this.rounds = [...this.rounds, ...addedRounds];
        this.reports = [...this.reports, ...addedReports];
        this.queueState.totalQueues = this.plants.length;
      }
    }

    this.saveToStorage();
    if (this.isSupabaseLive) {
      await this.syncAllToSupabase();
    }
    this.notifyListeners();
  }

  // CLEAR ALL DATA OUT (Reset All Data)
  public async clearAllData() {
    this.plants = [];
    this.rounds = [];
    this.history = [];
    this.reports = [];
    this.queueState = {
      currentQueueIndex: 0,
      currentRound: 1,
      activePlantId: null,
      totalQueues: 0,
      updatedAt: new Date().toISOString(),
      updatedBy: 'Admin',
    };
    try {
      localStorage.setItem(KEY_CLEARED, 'true');
    } catch (e) {}
    this.saveToStorage();
    this.notifyListeners();

    if (this.isSupabaseLive) {
      try {
        const supabase = getSupabase();
        await Promise.all([
          supabase.from('solar_plants').delete().neq('id', '___none___'),
          supabase.from('maintenance_rounds').delete().neq('id', '___none___'),
          supabase.from('maintenance_history').delete().neq('id', '___none___'),
          supabase.from('ma_reports').delete().neq('id', '___none___'),
          supabase.from('queue_state').upsert({
            id: 1,
            current_queue_index: 0,
            current_round: 1,
            active_plant_id: null,
            total_queues: 0,
            updated_at: new Date().toISOString(),
            updated_by: 'Admin',
          }),
        ]);
      } catch (err) {
        console.error('Error clearing Supabase data:', err);
      }
    }
  }

  // Restore seed data from Excel template (279 plants)
  public async restoreSeedData() {
    if (this.isSupabaseLive) {
      try {
        const supabase = getSupabase();
        await Promise.all([
          supabase.from('solar_plants').delete().neq('id', '___none___'),
          supabase.from('maintenance_rounds').delete().neq('id', '___none___'),
          supabase.from('ma_reports').delete().neq('id', '___none___'),
        ]);
      } catch (e) {}
    }
    this.plants = [...seedPlants];
    this.rounds = [...seedRounds];
    this.history = [...seedHistory];
    this.reports = [...seedReports];
    this.teams = [...seedTeams];
    this.queueState = { ...seedQueueState };
    try {
      localStorage.removeItem(KEY_CLEARED);
    } catch (e) {}
    this.saveToStorage();
    if (this.isSupabaseLive) {
      await this.syncAllToSupabase();
    }
    this.notifyListeners();
  }

  public resetToDefault() {
    this.clearAllData();
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        console.error('Error in listener:', e);
      }
    });
  }
}

// Helpers for Database mapping
function mapDbToSolarPlant(row: any): SolarPlant {
  return {
    id: row.id,
    queueNumber: row.queue_number,
    no: row.no || row.queue_number,
    solarPlant: row.solar_plant,
    capacityKw: row.capacity_kw,
    locationArea: row.location_area || '',
    propertyVillage: row.property_village || '',
    mapUrl: row.map_url || '',
    status: row.status || 'Active',
    qtContract: row.qt_contract || '',
    contactName: row.contact_name || '',
    tel: row.tel || '',
    email: row.email || '',
    otherContact: row.other_contact || '',
    turnOnDate: row.turn_on_date,
    latestRenewContract: row.latest_renew_contract,
    maContractExpired: row.ma_contract_expired,
    latestMaintenance: row.latest_maintenance,
    maintenancePeriod: row.maintenance_period || '',
    omContractCount: row.om_contract_count || 4,
    totalCount: row.total_count || 0,
    currentRound: row.current_round || 1,
    note: row.note || '',
  };
}

function mapDbToMaintenanceRound(row: any): MaintenanceRound {
  return {
    id: row.id,
    solarPlantId: row.solar_plant_id,
    roundNumber: row.round_number,
    scheduledDate: row.scheduled_date || '',
    isCompleted: row.is_completed || false,
    completedAt: row.completed_at,
    teamName: row.team_name || 'Team A',
    countNumber: row.count_number,
    note: row.note || '',
  };
}

function mapDbToMaintenanceHistory(row: any): MaintenanceHistory {
  return {
    id: row.id,
    solarPlantId: row.solar_plant_id,
    solarPlantName: row.solar_plant_name,
    roundNumber: row.round_number,
    countNumber: row.count_number,
    completedAt: row.completed_at,
    teamName: row.team_name || 'Team A',
    userName: row.user_name || 'Admin',
    status: row.status || 'Completed',
    note: row.note || '',
  };
}

function mapDbToMAReport(row: any): MAReport {
  return {
    id: row.id,
    solarPlantId: row.solar_plant_id,
    solarPlantName: row.solar_plant_name,
    maDate: row.ma_date || '',
    maPeriod: row.ma_period || '',
    isReportCompleted: row.is_report_completed || false,
    sendToCustomerDate: row.send_to_customer_date || '',
    omContract: row.om_contract || 4,
    roundNumber: row.round_number || 1,
    status: row.status || 'Pending',
    note: row.note || '',
  };
}

function cleanDate(d: any): string | null {
  if (!d || typeof d !== 'string') return null;
  const trimmed = d.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  if (trimmed.includes('T')) {
    const part = trimmed.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(part)) return part;
  }
  return null;
}

export const dataService = new DataService();
