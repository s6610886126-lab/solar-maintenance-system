export interface SolarPlant {
  id: string;
  queueNumber: number;
  no: number;
  solarPlant: string;
  capacityKw: number | null;
  locationArea: string;
  propertyVillage: string;
  mapUrl: string;
  status: string; // 'Paid / Active' | 'Active' | 'Expired' | 'Waiting' | 'Send' | 'Cancelled'
  qtContract: string;
  dateIssueNewContract?: string | null;
  contractAccept?: string | null;
  paidDate?: string | null;
  contactName: string;
  tel: string;
  email: string;
  otherContact: string;
  turnOnDate: string | null;
  latestRenewContract: string | null;
  maContractExpired: string | null;
  latestMaintenance: string | null;
  maintenancePeriod: string;
  omContractCount: number;
  totalCount: number;
  currentRound: number;
  firstScheduledDate?: string | null;
  note: string;
}

export interface MaintenanceRound {
  id: string;
  solarPlantId: string;
  roundNumber: number;
  scheduledDate: string;
  isCompleted: boolean;
  completedAt: string | null;
  teamName: string;
  countNumber: number | null;
  note: string;
}

export interface MaintenanceHistory {
  id: string;
  solarPlantId: string;
  solarPlantName: string;
  roundNumber: number;
  countNumber: number;
  completedAt: string;
  teamName: string;
  userName: string;
  status: string;
  note: string;
}

export interface MAReport {
  id: string;
  solarPlantId: string;
  solarPlantName: string;
  maDate: string;
  maPeriod: string;
  isReportCompleted: boolean;
  sendToCustomerDate: string;
  omContract: number;
  roundNumber: number;
  status: string; // 'Completed' | 'Pending'
  note: string;
}

export interface Team {
  id: string;
  name: string;
  leader: string;
  members: string;
  phone: string;
  color: string;
}

export interface QueueState {
  currentQueueIndex: number;
  currentRound: number;
  activePlantId: string | null;
  totalQueues: number;
  updatedAt: string;
  updatedBy: string;
}

export interface QueueCompleteResult {
  success: boolean;
  message?: string;
  newCount?: number;
  roundNumber?: number;
  solarPlantId?: string;
}

export type UserRole = 'admin' | 'technician' | 'viewer';
