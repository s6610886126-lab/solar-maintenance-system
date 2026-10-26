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
 * Export Application Data back to .xlsx matching the original company template format
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

  // Helper for thin black borders
  const thinBorder = {
    top: { style: 'thin' as const, color: { argb: 'FF000000' } },
    bottom: { style: 'thin' as const, color: { argb: 'FF000000' } },
    left: { style: 'thin' as const, color: { argb: 'FF000000' } },
    right: { style: 'thin' as const, color: { argb: 'FF000000' } },
  };

  const dataBorder = {
    top: { style: 'thin' as const, color: { argb: 'FFD1D5DB' } },
    bottom: { style: 'thin' as const, color: { argb: 'FFD1D5DB' } },
    left: { style: 'thin' as const, color: { argb: 'FFD1D5DB' } },
    right: { style: 'thin' as const, color: { argb: 'FFD1D5DB' } },
  };

  // 1. Sheet: Maintenance Schedule (matching original 1.Maintenance Schedule format)
  if (type === 'schedule' || type === 'all') {
    const sheet = workbook.addWorksheet('Maintenance Schedule', {
      views: [{ state: 'frozen', xSplit: 2, ySplit: 3 }]
    });

    const colWidths = [
      14.57, // 1: No
      40.43, // 2: Solar Plant
      12.29, // 3: Capacity (kW)
      14.00, // 4: Location / Area
      14.00, // 5: Property / Village
      8.14,  // 6: Map (hidden)
      16.00, // 7: Status
      14.14, // 8: QT & Contract
      15.57, // 9: Date Issue New Contract
      15.14, // 10: Contract Accept
      15.71, // 11: PAID Date
      21.43, // 12: Name
      21.86, // 13: Tel.
      25.00, // 14: Email
      23.71, // 15: Other Contact
      16.57, // 16: Turn On Date
      16.57, // 17: Latest Renew Contract
      16.57, // 18: MA Contract Expired
      17.57, // 19: Latest Maintenance
      9.57,  // 20: Period (hidden)
      7.29,  // 21: Count
      8.14,  // 22: Round
      // Rounds 1 to 12 (Date, Done)
      11.29, 7.29, 11.29, 7.29, 11.29, 7.29, 11.29, 7.29, 11.29, 7.29, 11.29, 7.29,
      11.29, 7.29, 11.29, 7.29, 11.29, 7.29, 11.29, 7.29, 11.29, 7.29, 11.29, 7.29,
      35.00, // 47: Note
      40.00, // 48: Email (hidden)
    ];

    colWidths.forEach((w, idx) => {
      const col = sheet.getColumn(idx + 1);
      col.width = w;
      if (idx + 1 === 6 || idx + 1 === 20 || idx + 1 === 48) {
        col.hidden = true;
      }
    });

    sheet.getRow(1).height = 15;
    sheet.getRow(2).height = 15;
    const r3 = sheet.getRow(3);
    r3.height = 28;

    const headerTitles = [
      'No', 'Solar Plant', 'Capacity (kW)', 'Location / Area', 'Property / Village', 'Map', 'Status',
      'QT & Contract', 'Date Issue New Contract', 'Contract Accept', 'PAID Date',
      'Name', 'Tel.', 'Email', 'Other Contact',
      'Turn On Date', 'Latest Renew Contract', 'MA Contract Expired', 'Latest Maintenance', 'Period',
      'O&M Contract', '',
      '1st', '', '2nd', '', '3rd', '', '4th', '', '5th', '', '6th', '',
      '7th', '', '8th', '', '9th', '', '10th', '', '11th', '', '12th', '',
      'Note', 'Email'
    ];

    const headerColors: Record<number, { bg: string; fg: string }> = {
      8: { bg: 'FF00FFFF', fg: 'FF000000' }, // QT cyan
      9: { bg: 'FFFF9900', fg: 'FF000000' }, // Date Issue orange
      10: { bg: 'FFFF9900', fg: 'FF000000' }, // Contract Accept orange
      11: { bg: 'FF00FF00', fg: 'FF000000' }, // Paid Date green
      16: { bg: 'FF00FF00', fg: 'FF000000' }, // Turn on green
      17: { bg: 'FFFFFF00', fg: 'FF000000' }, // Renew yellow
      18: { bg: 'FFFF0000', fg: 'FFFFFFFF' }, // Expired red
      19: { bg: 'FF6AA84F', fg: 'FFFFFFFF' }, // Latest Maint olive
      20: { bg: 'FF6AA84F', fg: 'FFFFFFFF' }, // Period olive
    };

    headerTitles.forEach((title, idx) => {
      const colIdx = idx + 1;
      const cell = r3.getCell(colIdx);
      cell.value = title;
      const color = headerColors[colIdx] || { bg: 'FFEFEFEF', fg: 'FF000000' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color.bg } };
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: color.fg } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = thinBorder;
    });

    // Merge round headers
    const merges = [
      'U3:V3', 'W3:X3', 'Y3:Z3', 'AA3:AB3', 'AC3:AD3', 'AE3:AF3',
      'AG3:AH3', 'AI3:AJ3', 'AK3:AL3', 'AM3:AN3', 'AO3:AP3', 'AQ3:AR3', 'AS3:AT3'
    ];
    merges.forEach((m) => {
      try { sheet.mergeCells(m); } catch (e) {}
    });

    sheet.autoFilter = 'A3:AU3';

    // Populate data rows starting at Row 4
    data.plants.forEach((plant, pIdx) => {
      const rowNum = 4 + pIdx;
      const row = sheet.getRow(rowNum);
      row.height = 22;

      const plantRounds = data.rounds.filter((r) => r.solarPlantId === plant.id);

      const rowValues: any[] = [
        plant.no || plant.queueNumber || (pIdx + 1),
        plant.solarPlant,
        plant.capacityKw !== null && plant.capacityKw !== undefined ? plant.capacityKw : null,
        plant.locationArea || '',
        plant.propertyVillage || '',
        plant.mapUrl || '',
        plant.status || 'Active',
        String(plant.qtContract).toLowerCase() === 'true' || plant.qtContract === 'มี' ? 'TRUE' : 'FALSE',
        plant.dateIssueNewContract || '',
        String(plant.contractAccept).toLowerCase() === 'true' || plant.contractAccept === 'ตอบรับแล้ว' ? 'TRUE' : 'FALSE',
        plant.paidDate || '',
        plant.contactName || '',
        plant.tel || '',
        plant.email || '',
        plant.otherContact || '',
        plant.turnOnDate || '',
        plant.latestRenewContract || '',
        plant.maContractExpired || '',
        plant.latestMaintenance || '',
        plant.maintenancePeriod || '',
        plant.totalCount || 0,
        plant.omContractCount || 4,
      ];

      // 12 rounds
      for (let r = 1; r <= 12; r++) {
        const rnd = plantRounds.find((round) => round.roundNumber === r);
        rowValues.push(rnd?.scheduledDate || '');
        rowValues.push(rnd?.isCompleted ? 'TRUE' : 'FALSE');
      }

      rowValues.push(plant.note || '');
      rowValues.push(plant.email || '');

      rowValues.forEach((val, cIdx) => {
        const colNum = cIdx + 1;
        const cell = row.getCell(colNum);
        cell.value = val;
        cell.font = { name: 'Calibri', size: 10 };
        cell.border = dataBorder;

        // Left align names, locations, notes
        const isLeftAlign = colNum === 2 || colNum === 4 || colNum === 5 || colNum === 12 || colNum === 14 || colNum === 15 || colNum === 47;
        cell.alignment = {
          vertical: 'middle',
          horizontal: isLeftAlign ? 'left' : 'center',
        };
      });
    });
  }

  // 2. Sheet: MA Report Tracking
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

    const hRow = sheet.getRow(1);
    hRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    hRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } };
    hRow.alignment = { vertical: 'middle', horizontal: 'center' };

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

  // 3. Sheet: Maintenance History
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

    const hRow = sheet.getRow(1);
    hRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    hRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    hRow.alignment = { vertical: 'middle', horizontal: 'center' };

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
