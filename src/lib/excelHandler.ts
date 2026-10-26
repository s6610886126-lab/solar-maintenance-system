import ExcelJS from 'exceljs';
import { SolarPlant, MaintenanceRound, MaintenanceHistory, MAReport } from '../types/maintenance';

export interface ParsedExcelData {
  plants: SolarPlant[];
  rounds: MaintenanceRound[];
  history: MaintenanceHistory[];
  reports: MAReport[];
  sheetNames: string[];
}

function getCellValueText(val: any): string {
  if (val === null || val === undefined) return '';
  if (val instanceof Date) {
    const yyyy = val.getFullYear();
    const mm = String(val.getMonth() + 1).padStart(2, '0');
    const dd = String(val.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  if (typeof val === 'object') {
    if (val.result !== undefined && val.result !== null) return String(val.result);
    if (val.text !== undefined && val.text !== null) return String(val.text);
    if (val.hyperlink) return String(val.hyperlink);
    return '';
  }
  return String(val).trim();
}

function formatDateLocal(val: any): string | null {
  if (!val) return null;
  if (val instanceof Date) {
    const yyyy = val.getFullYear();
    const mm = String(val.getMonth() + 1).padStart(2, '0');
    const dd = String(val.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (s.includes('T')) {
    const part = s.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(part)) return part;
  }
  const m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (m) {
    return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  }
  return s || null;
}

function isCheckDone(val: any): boolean {
  if (val === true || val === 1) return true;
  if (!val) return false;
  const s = String(val).trim().toLowerCase();
  return (
    s === 'true' ||
    s === '✓' ||
    s === '✔' ||
    s === '1' ||
    s === 'yes' ||
    s === 'y' ||
    s === 'done' ||
    s === 'ผ่าน' ||
    s === 'เสร็จ'
  );
}

function parseOmContractCount(raw: string): number {
  if (!raw) return 4;
  const trimmed = raw.trim();
  const num = parseInt(trimmed, 10);
  if (num && num > 0 && num <= 24) return num;

  const slashMatch = trimmed.match(/^(\d+)\s*\/\s*\d+/);
  if (slashMatch) {
    const n = parseInt(slashMatch[1], 10);
    if (n > 0 && n <= 24) return n;
  }

  const smallMatch = trimmed.match(/\b([1-9]|1[0-2])\b/);
  if (smallMatch) return parseInt(smallMatch[0], 10);

  return 4;
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
  const history: MaintenanceHistory[] = [];
  let queueOrder = 1;

  if (scheduleSheet) {
    // 1. Dynamically locate the header row (search rows 1 to 10)
    let headerRowIndex = 1;
    for (let r = 1; r <= 10; r++) {
      const row = scheduleSheet.getRow(r);
      let foundPlant = false;
      row.eachCell((cell) => {
        const txt = getCellValueText(cell.value).toLowerCase();
        if (txt.includes('solar plant') || txt.includes('plant') || txt.includes('customer')) {
          foundPlant = true;
        }
      });
      if (foundPlant) {
        headerRowIndex = r;
        break;
      }
    }

    // 2. Map header columns dynamically by name
    const headerRow = scheduleSheet.getRow(headerRowIndex);
    const headers: { col: number; txt: string }[] = [];
    headerRow.eachCell((cell, col) => {
      const txt = getCellValueText(cell.value).toLowerCase().replace(/[\r\n\t]+/g, ' ').trim();
      headers.push({ col, txt });
    });

    const getCol = (keywords: string[]): number | null => {
      for (const kw of keywords) {
        const found = headers.find((h) => h.txt.includes(kw));
        if (found) return found.col;
      }
      return null;
    };

    const noCol = getCol(['no', 'ลำดับ']);
    const nameCol = getCol(['solar plant', 'plant', 'customer']) || 2;
    const capCol = getCol(['capacity', 'kw']);
    const locCol = getCol(['location', 'area', 'พื้นที่']);
    const propCol = getCol(['property', 'village', 'หมู่บ้าน']);
    const mapCol = getCol(['map', 'google map']);
    const statusCol = getCol(['status', 'สถานะ']);
    const qtCol = getCol(['qt & contract', 'qt']);
    const dateIssueCol = getCol(['date issue', 'issue']);
    const acceptCol = getCol(['contract accept', 'accept']);
    const paidDateCol = getCol(['paid date', 'paid']);
    const contactNameCol = getCol(['name', 'ชื่อ']);
    const telCol = getCol(['tel', 'เบอร์']);
    const emailCol = getCol(['email', 'อีเมล']);
    const otherContactCol = getCol(['other contact', 'ติดต่อ']);
    const turnOnCol = getCol(['turn on', 'cod']);
    const renewCol = getCol(['latest renew', 'renew']);
    const expiredCol = getCol(['ma contract expired', 'expired']);
    const latestMaintCol = getCol(['latest maintenance', 'ล้างล่าสุด']);
    const periodCol = getCol(['period', 'รอบ']);

    // Detect first round column (find '1st' or 'round 1')
    let firstRoundCol: number | null = null;
    for (const h of headers) {
      if (h.txt === '1st' || h.txt.startsWith('1st ') || h.txt === 'round 1' || h.txt === 'รอบ 1') {
        if (!firstRoundCol || h.col < firstRoundCol) {
          firstRoundCol = h.col;
        }
      }
    }
    if (!firstRoundCol) {
      firstRoundCol = 20; // fallback default
    }

    // Detect O&M Contract column:
    // Look for explicit header "o&m contract" or "round", otherwise column immediately before 1st round
    let omCol = getCol(['o&m contract', 'round']);
    if (!omCol || omCol >= firstRoundCol) {
      omCol = firstRoundCol - 1;
    }

    // 3. Parse data rows starting after headerRowIndex
    scheduleSheet.eachRow((row, rowNumber) => {
      if (rowNumber <= headerRowIndex) return;

      const rawName = row.getCell(nameCol).value;
      if (!rawName) return;

      const name = getCellValueText(rawName).trim();
      if (!name || name.toLowerCase() === 'solar plant' || name.toLowerCase() === 'name') return;

      const queueNo = noCol ? parseInt(getCellValueText(row.getCell(noCol).value), 10) || queueOrder : queueOrder;
      const plantId = `import-plant-${queueOrder}`;

      const rawCap = capCol ? row.getCell(capCol).value : null;
      const capacity = rawCap ? parseFloat(String(rawCap)) || null : null;

      const location = locCol ? getCellValueText(row.getCell(locCol).value) : '';
      const property = propCol ? getCellValueText(row.getCell(propCol).value) : '';
      const status = statusCol ? getCellValueText(row.getCell(statusCol).value) || 'Active' : 'Active';

      const rawQt = qtCol ? row.getCell(qtCol).value : null;
      const qtContract = rawQt === true || rawQt === 'true' || rawQt === 'TRUE' || rawQt === 1 || rawQt === 'มี' ? 'true' : 'false';

      const dateIssueNewContract = dateIssueCol ? formatDateLocal(row.getCell(dateIssueCol).value) : null;

      const rawAccept = acceptCol ? row.getCell(acceptCol).value : null;
      const contractAccept = rawAccept === true || rawAccept === 'true' || rawAccept === 'TRUE' || rawAccept === 1 || rawAccept === 'ตอบรับแล้ว' ? 'true' : 'false';

      const paidDate = paidDateCol ? formatDateLocal(row.getCell(paidDateCol).value) : null;
      const contactName = contactNameCol ? getCellValueText(row.getCell(contactNameCol).value) : '';
      const tel = telCol ? getCellValueText(row.getCell(telCol).value) : '';
      const email = emailCol ? getCellValueText(row.getCell(emailCol).value) : '';
      const otherContact = otherContactCol ? getCellValueText(row.getCell(otherContactCol).value) : '';

      const turnOnDate = turnOnCol ? formatDateLocal(row.getCell(turnOnCol).value) : null;
      const latestRenewContract = renewCol ? formatDateLocal(row.getCell(renewCol).value) : null;
      const maContractExpired = expiredCol ? formatDateLocal(row.getCell(expiredCol).value) : null;
      const latestMaintenance = latestMaintCol ? formatDateLocal(row.getCell(latestMaintCol).value) : null;
      const maintenancePeriod = periodCol ? getCellValueText(row.getCell(periodCol).value) : '';

      // Safe O&M Contract count
      const rawOm = omCol ? getCellValueText(row.getCell(omCol).value) : '';
      const omContractCount = parseOmContractCount(rawOm);

      // Map URL detection: from mapCol or cell hyperlinks
      let mapUrl = '';
      if (mapCol) {
        const mapCell: any = row.getCell(mapCol);
        mapUrl = mapCell?.hyperlink || getCellValueText(mapCell.value);
      }
      if (!mapUrl) {
        const c2: any = row.getCell(nameCol);
        if (c2?.hyperlink) mapUrl = c2.hyperlink;
      }

      // Parse 12 rounds
      let completedCount = 0;
      for (let r = 1; r <= 12; r++) {
        const dateCol = firstRoundCol + (r - 1) * 2;
        const doneCol = dateCol + 1;

        const rawDate = row.getCell(dateCol).value;
        const rDate = formatDateLocal(rawDate) || '';
        const rawDone = row.getCell(doneCol).value;
        const isDone = isCheckDone(rawDone);

        if (isDone) completedCount++;

        rounds.push({
          id: `${plantId}-r${r}`,
          solarPlantId: plantId,
          roundNumber: r,
          scheduledDate: rDate,
          isCompleted: isDone,
          completedAt: isDone ? rDate || new Date().toISOString().split('T')[0] : null,
          teamName: 'Team A',
          countNumber: isDone ? r : null,
          note: '',
        });

        if (isDone) {
          history.push({
            id: `hist-${plantId}-r${r}`,
            solarPlantId: plantId,
            solarPlantName: name,
            roundNumber: r,
            countNumber: r,
            completedAt: rDate ? `${rDate}T10:00:00.000Z` : new Date().toISOString(),
            teamName: 'Team A',
            userName: 'Admin',
            status: 'Completed',
            note: `Maintenance Round ${r}`,
          });
        }
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
        maintenancePeriod,
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

  return { plants, rounds, history, reports, sheetNames };
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
