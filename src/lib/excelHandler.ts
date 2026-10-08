import ExcelJS from 'exceljs';
import { SolarPlant, MaintenanceRound, MaintenanceHistory, MAReport } from '../types/maintenance';

export interface ParsedExcelData {
  plants: SolarPlant[];
  rounds: MaintenanceRound[];
  reports: MAReport[];
  sheetNames: string[];
}

function getCellValueText(val: any): string {
  if (val === null || val === undefined) return '';
  if (val instanceof Date) return val.toISOString().split('T')[0];
  if (typeof val === 'object') {
    if (val.result !== undefined && val.result !== null) return String(val.result);
    if (val.text !== undefined && val.text !== null) return String(val.text);
    if (val.hyperlink) return String(val.hyperlink);
    return '';
  }
  return String(val).trim();
}

/**
 * Parse an uploaded .xlsx file and extract Plants, Rounds, and MA Reports.
 */
export const parseExcelFile = async (file: File): Promise<ParsedExcelData> => {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const sheetNames = workbook.worksheets.map((s) => s.name);

  // Find sheet 1 or sheet named 'Maintenance Schedule'
  let scheduleSheet = workbook.worksheets.find(
    (s) => s.name.trim().toLowerCase().includes('maintenance schedule') && !s.name.includes('(Old)') && !s.name.includes('TON')
  );
  if (!scheduleSheet) {
    scheduleSheet = workbook.getWorksheet(1);
  }

  const plants: SolarPlant[] = [];
  const rounds: MaintenanceRound[] = [];
  let queueOrder = 1;

  if (scheduleSheet) {
    scheduleSheet.eachRow((row, rowNumber) => {
      const cell1Text = getCellValueText(row.getCell(1).value).toLowerCase();
      const rawName = row.getCell(2).value;
      if (!rawName) return;

      const name = getCellValueText(rawName).trim();
      if (!name || name.toLowerCase() === 'solar plant' || cell1Text === 'no') return;

      const queueNo = parseInt(getCellValueText(row.getCell(1).value)) || queueOrder;
      const plantId = `import-plant-${queueOrder}`;
      const rawCap = row.getCell(3).value;
      const capacity = rawCap ? parseFloat(String(rawCap)) || null : null;

      const location = getCellValueText(row.getCell(4).value);
      const property = getCellValueText(row.getCell(5).value);
      const status = getCellValueText(row.getCell(6).value) || 'Active';

      const rawQt: any = row.getCell(7).value;
      const qtContract = rawQt === true || rawQt === 'true' || rawQt === 'TRUE' || rawQt === 1 || rawQt === 'มี' ? 'true' : 'false';

      const dateIssueNewContract = getCellValueText(row.getCell(8).value) || null;

      const rawAccept: any = row.getCell(9).value;
      const contractAccept = rawAccept === true || rawAccept === 'true' || rawAccept === 'TRUE' || rawAccept === 1 || rawAccept === 'ตอบรับแล้ว' ? 'true' : 'false';

      const paidDate = getCellValueText(row.getCell(10).value) || null;

      const contactName = getCellValueText(row.getCell(11).value);
      const tel = getCellValueText(row.getCell(12).value);
      const email = getCellValueText(row.getCell(13).value);
      const otherContact = getCellValueText(row.getCell(14).value);

      const turnOnDate = getCellValueText(row.getCell(15).value) || null;
      const latestRenewContract = getCellValueText(row.getCell(16).value) || null;
      const maContractExpired = getCellValueText(row.getCell(17).value) || null;
      const latestMaintenance = getCellValueText(row.getCell(18).value) || null;

      // Col 19: O&M Contract count (e.g. "6 / 6 Tax", "4 / 4 Tax" -> 6, 4)
      const rawOm = getCellValueText(row.getCell(19).value);
      let omContractCount = 4;
      if (rawOm) {
        const match = rawOm.match(/\d+/);
        if (match) omContractCount = parseInt(match[0], 10) || 4;
      }

      // Check for Google Maps hyperlink in row cells (Col 2 Solar Plant or Col 4/5 Location)
      let mapUrl = '';
      const cell2: any = row.getCell(2);
      const cell4: any = row.getCell(4);
      const cell5: any = row.getCell(5);
      if (cell2?.hyperlink) mapUrl = cell2.hyperlink;
      else if (cell4?.hyperlink) mapUrl = cell4.hyperlink;
      else if (cell5?.hyperlink) mapUrl = cell5.hyperlink;

      let completedCount = 0;
      for (let r = 1; r <= 12; r++) {
        // Col 20 is Rd 1 Date, Col 21 is Rd 1 Done, Col 22 is Rd 2 Date, Col 23 is Rd 2 Done...
        const dateCol = 18 + r * 2;
        const doneCol = 19 + r * 2;

        const rDate = getCellValueText(row.getCell(dateCol).value);
        const rDone: any = row.getCell(doneCol).value;
        const isDone = rDone === true || rDone === 'true' || rDone === 'TRUE' || rDone === 1;
        if (isDone) completedCount++;

        rounds.push({
          id: `${plantId}-r${r}`,
          solarPlantId: plantId,
          roundNumber: r,
          scheduledDate: rDate || '',
          isCompleted: isDone,
          completedAt: isDone ? rDate || new Date().toISOString().split('T')[0] : null,
          teamName: 'Team A',
          countNumber: isDone ? r : null,
          note: '',
        });
      }

      plants.push({
        id: plantId,
        queueNumber: queueNo,
        no: queueNo,
        solarPlant: name,
        capacityKw: capacity,
        locationArea: location,
        propertyVillage: property,
        mapUrl,
        status,
        qtContract,
        dateIssueNewContract,
        contractAccept,
        paidDate,
        contactName,
        tel,
        email,
        otherContact,
        turnOnDate,
        latestRenewContract,
        maContractExpired,
        latestMaintenance,
        maintenancePeriod: '',
        omContractCount,
        totalCount: completedCount,
        currentRound: Math.min(12, completedCount + 1),
        note: '',
      });

      queueOrder++;
    });
  }

  // Parse MA Report Tracking if present
  const reports: MAReport[] = [];
  const reportSheet = workbook.worksheets.find((s) => s.name.trim().toLowerCase().includes('ma report'));
  if (reportSheet) {
    reportSheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 3) return;
      const rawName = row.getCell(2).value;
      if (!rawName) return;
      const name = getCellValueText(rawName).trim();
      if (!name) return;

      const maDate = getCellValueText(row.getCell(3).value);
      const maPeriod = getCellValueText(row.getCell(4).value) || '1 of 4';
      const isDone: any = row.getCell(5).value;
      const repDone = isDone === true || isDone === 'true' || isDone === 'True';
      const sendDate = getCellValueText(row.getCell(6).value);

      const match = plants.find((p) => p.solarPlant.toLowerCase() === name.toLowerCase());

      reports.push({
        id: `import-rep-${rowNumber}`,
        solarPlantId: match ? match.id : `plant-${rowNumber}`,
        solarPlantName: name,
        maDate: maDate || '',
        maPeriod: maPeriod,
        isReportCompleted: repDone,
        sendToCustomerDate: sendDate || '',
        omContract: match ? match.omContractCount : 4,
        roundNumber: 1,
        status: repDone ? 'Completed' : 'Pending',
        note: '',
      });
    });
  }

  return { plants, rounds, reports, sheetNames };
};

/**
 * Export Application Data back to .xlsx
 */
export const exportToExcel = async (
  type: 'schedule' | 'history' | 'reports' | 'all',
  data: {
    plants: SolarPlant[];
    rounds: MaintenanceRound[];
    history: MaintenanceHistory[];
    reports: MAReport[];
  }
) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Solar Maintenance Schedule System';
  workbook.created = new Date();

  // Helper for header styling
  const styleHeaderRow = (row: ExcelJS.Row, bgHex: string = '1E293B') => {
    row.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    row.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF' + bgHex },
    };
    row.alignment = { vertical: 'middle', horizontal: 'center' };
  };

  // 1. Sheet: Maintenance Schedule
  if (type === 'schedule' || type === 'all') {
    const sheet = workbook.addWorksheet('Maintenance Schedule');
    
    // Build columns matching the Excel sheet structure
    const columns: Partial<ExcelJS.Column>[] = [
      { header: 'No', key: 'no', width: 8 },
      { header: 'Solar Plant', key: 'solarPlant', width: 35 },
      { header: 'Capacity (kW)', key: 'capacityKw', width: 14 },
      { header: 'Location Area', key: 'locationArea', width: 22 },
      { header: 'Property / Village', key: 'propertyVillage', width: 24 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'QT & Contract', key: 'qtContract', width: 15 },
      { header: 'Date Issue New Contract', key: 'dateIssueNewContract', width: 22 },
      { header: 'Contract accept', key: 'contractAccept', width: 16 },
      { header: 'PAID Date', key: 'paidDate', width: 16 },
      { header: 'Name', key: 'contactName', width: 20 },
      { header: 'Tel', key: 'tel', width: 20 },
      { header: 'Email', key: 'email', width: 28 },
      { header: 'Other contact', key: 'otherContact', width: 20 },
      { header: 'Turn On Date', key: 'turnOnDate', width: 16 },
      { header: 'Latest Renew Contract', key: 'latestRenewContract', width: 20 },
      { header: 'MA Contract Expired', key: 'maContractExpired', width: 20 },
      { header: 'Latest Maintenance', key: 'latestMaintenance', width: 18 },
      { header: 'O&M Contract', key: 'omContractCount', width: 15 },
    ];

    // Add 12 rounds
    for (let r = 1; r <= 12; r++) {
      const suffix = r === 1 ? '1st' : r === 2 ? '2nd' : r === 3 ? '3rd' : `${r}th`;
      columns.push({ header: `${suffix} Date`, key: `r${r}_date`, width: 14 });
      columns.push({ header: `${suffix} Done`, key: `r${r}_done`, width: 12 });
    }

    columns.push({ header: 'Google Maps Link', key: 'mapUrl', width: 40 });
    sheet.columns = columns;

    styleHeaderRow(sheet.getRow(1), '0F766E');

    data.plants.forEach((plant) => {
      const plantRounds = data.rounds.filter((r) => r.solarPlantId === plant.id);
      
      const rowData: Record<string, any> = {
        no: plant.no || plant.queueNumber,
        solarPlant: plant.solarPlant,
        capacityKw: plant.capacityKw,
        locationArea: plant.locationArea,
        propertyVillage: plant.propertyVillage || '',
        status: plant.status,
        qtContract: String(plant.qtContract).toLowerCase() === 'true' || plant.qtContract === 'มี' ? 'TRUE' : 'FALSE',
        dateIssueNewContract: plant.dateIssueNewContract || '',
        contractAccept: String(plant.contractAccept).toLowerCase() === 'true' || plant.contractAccept === 'ตอบรับแล้ว' ? 'TRUE' : 'FALSE',
        paidDate: plant.paidDate || '',
        contactName: plant.contactName,
        tel: plant.tel,
        email: plant.email,
        otherContact: plant.otherContact || '',
        turnOnDate: plant.turnOnDate || '',
        latestRenewContract: plant.latestRenewContract || '',
        maContractExpired: plant.maContractExpired || '',
        latestMaintenance: plant.latestMaintenance || '',
        omContractCount: `${plant.omContractCount || 4} times/year`,
        mapUrl: plant.mapUrl || '',
      };

      for (let r = 1; r <= 12; r++) {
        const rnd = plantRounds.find((round) => round.roundNumber === r);
        rowData[`r${r}_date`] = rnd?.scheduledDate || '';
        rowData[`r${r}_done`] = rnd?.isCompleted ? 'TRUE' : 'FALSE';
      }

      sheet.addRow(rowData);
    });
  }

  // 2. Sheet: Maintenance History
  if (type === 'history' || type === 'all') {
    const sheet = workbook.addWorksheet('Maintenance History');
    sheet.columns = [
      { header: 'History ID', key: 'id', width: 28 },
      { header: 'Solar Plant', key: 'solarPlantName', width: 35 },
      { header: 'Round', key: 'roundNumber', width: 12 },
      { header: 'Count', key: 'countNumber', width: 12 },
      { header: 'Completed Date & Time', key: 'completedAt', width: 25 },
      { header: 'Team', key: 'teamName', width: 18 },
      { header: 'Recorded By', key: 'userName', width: 18 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Note', key: 'note', width: 30 },
    ];

    styleHeaderRow(sheet.getRow(1), '2563EB');

    data.history.forEach((h) => {
      sheet.addRow({
        id: h.id,
        solarPlantName: h.solarPlantName,
        roundNumber: `Round ${h.roundNumber}`,
        countNumber: h.countNumber,
        completedAt: h.completedAt,
        teamName: h.teamName,
        userName: h.userName,
        status: h.status,
        note: h.note,
      });
    });
  }

  // 3. Sheet: MA Report Tracking
  if (type === 'reports' || type === 'all') {
    const sheet = workbook.addWorksheet('MA Report Tracking');
    sheet.columns = [
      { header: 'No.', key: 'no', width: 8 },
      { header: 'Solar Plant', key: 'solarPlantName', width: 35 },
      { header: 'MA Date', key: 'maDate', width: 16 },
      { header: 'MA Period', key: 'maPeriod', width: 16 },
      { header: 'Report Status', key: 'isReportCompleted', width: 18 },
      { header: 'Send to Customer Date', key: 'sendToCustomerDate', width: 22 },
      { header: 'O&M Contract', key: 'omContract', width: 15 },
      { header: 'Round', key: 'roundNumber', width: 12 },
      { header: 'Note', key: 'note', width: 25 },
    ];

    styleHeaderRow(sheet.getRow(1), '9333EA');

    data.reports.forEach((rep, idx) => {
      sheet.addRow({
        no: idx + 1,
        solarPlantName: rep.solarPlantName,
        maDate: rep.maDate,
        maPeriod: rep.maPeriod,
        isReportCompleted: rep.isReportCompleted ? 'Completed' : 'Pending',
        sendToCustomerDate: rep.sendToCustomerDate,
        omContract: rep.omContract,
        roundNumber: rep.roundNumber,
        note: rep.note,
      });
    });
  }

  // Generate buffer and trigger browser download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateStr = new Date().toISOString().split('T')[0];
  a.download = `Solar_Maintenance_${type}_${dateStr}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
