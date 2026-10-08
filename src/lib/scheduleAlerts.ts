import { SolarPlant, MaintenanceRound } from '../types/maintenance';

export type ScheduleUrgency = 'overdue' | 'today' | 'due_soon' | 'future' | 'no_date' | 'all_done';

export interface PlantScheduleStatus {
  urgency: ScheduleUrgency;
  roundNumber?: number;
  scheduledDate?: string;
  diffDays?: number; // positive = days overdue, negative = days until due, 0 = today
  label: string;
}

export function formatDateDMY(dateStr?: string | null): string {
  if (!dateStr || dateStr === '-' || dateStr.trim() === '') return '-';
  const cleanStr = dateStr.split('T')[0].trim();
  const parts = cleanStr.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    // YYYY-MM-DD -> DD/MM/YYYY
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return cleanStr;
}

export function getTodayDateStr(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function getInDaysDateStr(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function getPlantScheduleStatus(
  plant: SolarPlant,
  rounds: MaintenanceRound[],
  todayStr: string = getTodayDateStr()
): PlantScheduleStatus {
  const plantRounds = rounds.filter((r) => r.solarPlantId === plant.id);
  const maxContract = plant.omContractCount || 4;

  if ((plant.totalCount || 0) >= maxContract) {
    return {
      urgency: 'all_done',
      label: 'All Rounds Completed',
    };
  }

  // Find uncompleted rounds sorted by round number
  const pendingRounds = plantRounds
    .filter((r) => !r.isCompleted)
    .sort((a, b) => a.roundNumber - b.roundNumber);

  // Find earliest uncompleted round with a scheduled date
  const pendingWithDate = pendingRounds.find((r) => r.scheduledDate && r.scheduledDate.trim().length >= 10);

  if (!pendingWithDate) {
    const nextRoundNum = pendingRounds[0]?.roundNumber || (plant.totalCount || 0) + 1;
    return {
      urgency: 'no_date',
      roundNumber: nextRoundNum,
      label: `Round ${nextRoundNum}: No Date`,
    };
  }

  const sDate = pendingWithDate.scheduledDate.trim();
  const rNum = pendingWithDate.roundNumber;

  const today = new Date(todayStr + 'T00:00:00');
  const target = new Date(sDate + 'T00:00:00');
  const diffTime = today.getTime() - target.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (sDate < todayStr) {
    return {
      urgency: 'overdue',
      roundNumber: rNum,
      scheduledDate: sDate,
      diffDays,
      label: `Round ${rNum}: Overdue ${diffDays}d (${formatDateDMY(sDate)})`,
    };
  }

  if (sDate === todayStr) {
    return {
      urgency: 'today',
      roundNumber: rNum,
      scheduledDate: sDate,
      diffDays: 0,
      label: `Round ${rNum}: Due Today`,
    };
  }

  // Next 7 days
  const in7DaysStr = getInDaysDateStr(7);
  if (sDate <= in7DaysStr) {
    const daysLeft = -diffDays;
    return {
      urgency: 'due_soon',
      roundNumber: rNum,
      scheduledDate: sDate,
      diffDays,
      label: `Round ${rNum}: In ${daysLeft}d (${formatDateDMY(sDate)})`,
    };
  }

  return {
    urgency: 'future',
    roundNumber: rNum,
    scheduledDate: sDate,
    diffDays,
    label: `Round ${rNum}: ${formatDateDMY(sDate)}`,
  };
}
