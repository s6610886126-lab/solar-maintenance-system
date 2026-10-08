const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

async function create1PlantExcel() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Solar Maintenance System';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Maintenance Schedule', {
    views: [{ state: 'frozen', xSplit: 2, ySplit: 1 }]
  });

  const columns = [
    { header: 'No', key: 'no', width: 6 },
    { header: 'Solar Plant', key: 'solarPlant', width: 38 },
    { header: 'Capacity (kW)', key: 'capacityKw', width: 14 },
    { header: 'Location Area', key: 'locationArea', width: 18 },
    { header: 'Property / Village', key: 'propertyVillage', width: 22 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'QT & Contract', key: 'qtContract', width: 14 },
    { header: 'Date Issue New Contract', key: 'dateIssueNewContract', width: 22 },
    { header: 'Contract accept', key: 'contractAccept', width: 15 },
    { header: 'PAID Date', key: 'paidDate', width: 16 },
    { header: 'Name', key: 'contactName', width: 20 },
    { header: 'Tel', key: 'tel', width: 20 },
    { header: 'Email', key: 'email', width: 28 },
    { header: 'Other contact', key: 'otherContact', width: 18 },
    { header: 'Turn On Date', key: 'turnOnDate', width: 15 },
    { header: 'Latest Renew Contract', key: 'latestRenewContract', width: 20 },
    { header: 'MA Contract Expired', key: 'maContractExpired', width: 20 },
    { header: 'Latest Maintenance', key: 'latestMaintenance', width: 18 },
    { header: 'O&M Contract', key: 'omContractCount', width: 15 },
  ];

  for (let r = 1; r <= 12; r++) {
    const suffix = r === 1 ? '1st' : r === 2 ? '2nd' : r === 3 ? '3rd' : `${r}th`;
    columns.push({ header: `${suffix}`, key: `r${r}_date`, width: 14 });
    columns.push({ header: `✓`, key: `r${r}_done`, width: 8 });
  }

  columns.push({ header: 'Google Maps Link', key: 'mapUrl', width: 38 });
  sheet.columns = columns;

  // Header style
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10, name: 'Calibri' };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  headerRow.height = 28;

  const plantData = {
    no: 1,
    solarPlant: 'คุณสมชาย ใจดี (บ้านพักอาศัย รามอินทรา)',
    capacityKw: 10.50,
    locationArea: 'กรุงเทพฯ และปริมณฑล',
    propertyVillage: 'หมู่บ้านเศรษฐสิริ รามอินทรา',
    status: 'PAID / ACTIVE',
    qtContract: 'QT-2026-089',
    dateIssueNewContract: '2025-01-05',
    contractAccept: 'TRUE',
    paidDate: '2025-01-10',
    contactName: 'คุณสมชาย ใจดี',
    tel: '081-234-5678',
    email: 'somchai.j@example.com',
    otherContact: 'LINE: @somchai_solar',
    turnOnDate: '2024-01-15',
    latestRenewContract: '2024-01-15',
    maContractExpired: '2026-01-14',
    latestMaintenance: '2024-10-01',
    omContractCount: '4 / 4 Tax',
    r1_date: '2025-01-15', r1_done: 'TRUE',
    r2_date: '2025-04-15', r2_done: 'FALSE',
    r3_date: '2025-07-15', r3_done: 'FALSE',
    r4_date: '2025-10-15', r4_done: 'FALSE',
    r5_date: '', r5_done: 'FALSE',
    r6_date: '', r6_done: 'FALSE',
    r7_date: '', r7_done: 'FALSE',
    r8_date: '', r8_done: 'FALSE',
    r9_date: '', r9_done: 'FALSE',
    r10_date: '', r10_done: 'FALSE',
    r11_date: '', r11_done: 'FALSE',
    r12_date: '', r12_done: 'FALSE',
    mapUrl: 'https://maps.google.com/?q=13.8241,100.6723',
  };

  const row = sheet.addRow(plantData);
  row.height = 24;
  row.alignment = { vertical: 'middle' };

  const publicDir = path.join(__dirname, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const outputPath = path.join(publicDir, 'sample_customer_1_plant.xlsx');
  await workbook.xlsx.writeFile(outputPath);
  console.log('Created:', outputPath);
}

create1PlantExcel().catch(console.error);
