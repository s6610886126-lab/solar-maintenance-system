import seedJson from '../../initial_seed_data.json';
import { SolarPlant, MaintenanceRound, MaintenanceHistory, MAReport, Team, QueueState } from '../types/maintenance';

// Original seed data from 1.Maintenance Schedule.xlsx (preserved for restore)
export const seedPlants: SolarPlant[] = seedJson.plants as SolarPlant[];
export const seedRounds: MaintenanceRound[] = seedJson.rounds as MaintenanceRound[];
export const seedHistory: MaintenanceHistory[] = seedJson.history as MaintenanceHistory[];
export const seedReports: MAReport[] = seedJson.reports as MAReport[];
export const seedTeams: Team[] = seedJson.teams as Team[];
export const seedQueueState: QueueState = seedJson.queueState as QueueState;

// Default initial state is completely cleared (0 items)
export const initialPlants: SolarPlant[] = [];
export const initialRounds: MaintenanceRound[] = [];
export const initialHistory: MaintenanceHistory[] = [];
export const initialReports: MAReport[] = [];
export const initialTeams: Team[] = seedJson.teams as Team[];
export const initialQueueState: QueueState = {
  currentQueueIndex: 0,
  currentRound: 1,
  activePlantId: null,
  totalQueues: 0,
  updatedAt: new Date().toISOString(),
  updatedBy: 'System',
};
