const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function formatDate(val) {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString();
  if (typeof val === 'string') {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  return null;
}

function cleanText(val) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') {
    if (val.text) return String(val.text).trim();
    if (val.result) return String(val.result).trim();
    if (val.hyperlink) return String(val.hyperlink).trim();
  }
  return String(val).trim();
}

async function extract() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('c:/งาน/Manintnance/1.Maintenance Schedule.xlsx');

  const sheet1 = workbook.getWorksheet(1); // " Maintenance Schedule "
  const sheet2 = workbook.getWorksheet(2); // "MA Report Tracking"

  const plants = [];
  const rounds = [];
  const reports = [];

  let queueOrder = 1;

  // Extract Solar Plants & Rounds from Sheet 1
  sheet1.eachRow((row, rowNumber) => {
    if (rowNumber > 3) {
      const plantNameRaw = row.getCell(2).value;
      const plantName = cleanText(plantNameRaw);

      if (plantName && plantName !== 'Solar Plant' && plantName.length > 1) {
        const plantId = generateUUID();
        const itemNo = parseInt(cleanText(row.getCell(1).value)) || queueOrder;
        const capacity = parseFloat(cleanText(row.getCell(3).value)) || null;
        const location = cleanText(row.getCell(4).value) || '';
        const village = cleanText(row.getCell(5).value) || '';
        
        let mapUrl = '';
        const mapCell = row.getCell(6).value;
        if (mapCell) {
          if (typeof mapCell === 'object' && mapCell.hyperlink) mapUrl = mapCell.hyperlink;
          else mapUrl = cleanText(mapCell);
        }

        let rawStatus = cleanText(row.getCell(7).value);
        let status = 'Active';
        if (rawStatus.toLowerCase().includes('expire')) status = 'Expired';
        else if (rawStatus.toLowerCase().includes('wait')) status = 'Waiting';
        else if (rawStatus.toLowerCase().includes('cancel')) status = 'Cancelled';
        else if (rawStatus.toLowerCase().includes('paid')) status = 'Paid';
        else if (rawStatus.toLowerCase().includes('send')) status = 'Waiting';

        const contactName = cleanText(row.getCell(12).value);
        const tel = cleanText(row.getCell(13).value);
        const email = cleanText(row.getCell(14).value);
        const otherContact = cleanText(row.getCell(15).value);

        const turnOnDate = formatDate(row.getCell(16).value);
        const latestRenew = formatDate(row.getCell(17).value);
        const expiredDate = formatDate(row.getCell(18).value);
        const latestMaint = formatDate(row.getCell(19).value);
        const period = cleanText(row.getCell(20).value);

        const omContractTimes = parseInt(cleanText(row.getCell(21).value)) || 4;
        const note = cleanText(row.getCell(44).value) || cleanText(row.getCell(43).value);

        let totalCompletedCount = 0;

        // Parse rounds 1st to 12th
        // Sheet 1 has columns starting from 23:
        // Col 23: 1st date, Col 24: 1st status (true/false)
        // Col 25: 2nd date, Col 26: 2nd status
        // Col 27: 3rd date, Col 28: 3rd status
        // Col 29: 4th date, Col 30: 4th status
        // Col 31: 5th date, Col 32: 5th status
        // Col 33: 6th date, Col 34: 6th status
        // Col 35: 7th date, Col 36: 7th status
        // Col 37: 8th date, Col 38: 8th status
        // Col 39: 9th date, Col 40: 9th status
        // Col 41: 10th date, Col 42: 10th status
        // Col 43: 11th date, Col 44: 11th status
        // Col 45: 12th date
        for (let r = 1; r <= 12; r++) {
          const dateCol = 23 + (r - 1) * 2;
          const statusCol = dateCol + 1;
          const dateVal = formatDate(row.getCell(dateCol).value);
          const rawDone = row.getCell(statusCol).value;
          const isDone = rawDone === true || String(rawDone).toLowerCase() === 'true';
          
          if (isDone) totalCompletedCount++;

          rounds.push({
            id: generateUUID(),
            solar_plant_id: plantId,
            round_number: r,
            scheduled_date: dateVal,
            is_completed: isDone,
            completed_at: isDone ? (dateVal || new Date().toISOString()) : null,
            team_name: isDone ? (r % 2 === 0 ? 'Team B' : 'Team A') : 'Team A',
            count_number: isDone ? totalCompletedCount : 0,
            note: ''
          });
        }

        plants.push({
          id: plantId,
          item_no: itemNo,
          queue_order: queueOrder,
          name: plantName,
          capacity: capacity,
          location: location,
          property_village: village,
          map_url: mapUrl,
          status: status,
          contact_name: contactName,
          telephone: tel,
          email: email,
          other_contact: otherContact,
          turn_on_date: turnOnDate,
          latest_renew_contract: latestRenew,
          ma_contract_expired: expiredDate,
          latest_maintenance: latestMaint,
          maintenance_period: period,
          om_contract_times: omContractTimes,
          total_count: totalCompletedCount,
          note: note,
          is_active: status !== 'Cancelled'
        });

        queueOrder++;
      }
    }
  });

  // Extract MA Reports from Sheet 2
  sheet2.eachRow((row, rowNumber) => {
    if (rowNumber > 3) {
      const plantName = cleanText(row.getCell(2).value);
      if (plantName) {
        // Find matching plant
        const plant = plants.find(p => p.name.toLowerCase().includes(plantName.toLowerCase()) || plantName.toLowerCase().includes(p.name.toLowerCase()));
        if (plant) {
          const maDate = formatDate(row.getCell(3).value);
          const maPeriod = cleanText(row.getCell(4).value);
          const rawReport = row.getCell(5).value;
          const isReportDone = rawReport === true || String(rawReport).toLowerCase() === 'true';
          const sendDate = formatDate(row.getCell(6).value);
          const note = cleanText(row.getCell(29).value);

          reports.push({
            id: generateUUID(),
            solar_plant_id: plant.id,
            plant_name: plant.name,
            round_number: 1,
            ma_date: maDate,
            ma_period: maPeriod,
            is_report_completed: isReportDone,
            send_to_customer_date: sendDate,
            note: note
          });
        }
      }
    }
  });

  console.log(`Extracted: ${plants.length} Solar Plants, ${rounds.length} Rounds, ${reports.length} MA Reports`);

  const initialTeams = [
    { id: generateUUID(), name: 'Manote', color: '#3B82F6', phone: '081-893-1647' },
    { id: generateUUID(), name: 'Team A', color: '#10B981', phone: '081-555-0101' },
    { id: generateUUID(), name: 'Team B', color: '#F59E0B', phone: '081-555-0102' },
    { id: generateUUID(), name: 'Team C', color: '#8B5CF6', phone: '081-555-0103' }
  ];

  const initialQueueState = {
    id: 1,
    current_plant_id: plants[0]?.id || '',
    current_round: 1,
    current_queue_order: 1,
    updated_at: new Date().toISOString(),
    updated_by: 'System'
  };

  // Generate initial history for all already-completed rounds
  const initialHistory = [];
  rounds.filter(r => r.is_completed).forEach(r => {
    initialHistory.push({
      id: generateUUID(),
      solar_plant_id: r.solar_plant_id,
      round_number: r.round_number,
      count_number: r.count_number,
      completed_at: r.completed_at || new Date().toISOString(),
      team_name: r.team_name,
      user_name: 'Admin',
      status: 'Completed',
      note: 'Imported from Excel baseline'
    });
  });

  const tsContent = `// Auto-generated seed data from 1.Maintenance Schedule.xlsx
import { SolarPlant, MaintenanceRound, QueueState, Team, MAReport, MaintenanceHistory } from '../types/maintenance';

export const INITIAL_PLANTS: SolarPlant[] = ${JSON.stringify(plants, null, 2)};

export const INITIAL_ROUNDS: MaintenanceRound[] = ${JSON.stringify(rounds, null, 2)};

export const INITIAL_TEAMS: Team[] = ${JSON.stringify(initialTeams, null, 2)};

export const INITIAL_QUEUE_STATE: QueueState = ${JSON.stringify(initialQueueState, null, 2)};

export const INITIAL_MA_REPORTS: MAReport[] = ${JSON.stringify(reports, null, 2)};

export const INITIAL_HISTORY: MaintenanceHistory[] = ${JSON.stringify(initialHistory, null, 2)};
`;

  fs.mkdirSync('src/lib', { recursive: true });
  fs.writeFileSync('src/lib/initialData.ts', tsContent, 'utf-8');
  console.log('Successfully generated src/lib/initialData.ts');
}

extract().catch(console.error);
