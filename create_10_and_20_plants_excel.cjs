const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

// Master list of 20 plants (Set 1 = plants 1..10, Set 2 = plants 1..20)
const masterPlants = [
  { no: 1, solarPlant: 'A.K.A Co.,Ltd. (Joob Joob Bakery)', capacityKw: 15.0, locationArea: 'Kathu', propertyVillage: 'Kathu Valley', status: 'Send', qtContract: 'TRUE', dateIssueNewContract: '2025-07-01', contractAccept: 'FALSE', paidDate: '', contactName: 'Anthony', tel: '080-6091128', email: 'gm@chefsmarketphuket.com', otherContact: 'LINE: anthony_phuket', turnOnDate: '2022-07-01', latestRenewContract: '2024-03-14', maContractExpired: '2026-03-13', latestMaintenance: '2026-03-18', omContractCount: '6 / 6 Tax', mapUrl: 'https://maps.google.com/?q=7.9056,98.3375' },
  { no: 2, solarPlant: 'AC Consulting Group Co.,Ltd', capacityKw: 12.48, locationArea: 'Muang Phuket', propertyVillage: 'Royal Place', status: 'Send', qtContract: 'TRUE', dateIssueNewContract: '2025-06-01', contractAccept: 'FALSE', paidDate: '', contactName: 'K.Tum / Khun Chan', tel: '081-893-1647', email: 'tum@acconsultphuket.com', otherContact: '081-270-5736', turnOnDate: '2024-05-19', latestRenewContract: '2024-05-19', maContractExpired: '2026-05-09', latestMaintenance: '2025-05-19', omContractCount: '4 / 4 Tax', mapUrl: 'https://maps.google.com/?q=7.8765,98.3969' },
  { no: 3, solarPlant: 'Albatross - Press On Fire', capacityKw: 24.8, locationArea: 'Choeng Thale', propertyVillage: 'Porto de Phuket', status: 'Signed', qtContract: 'TRUE', dateIssueNewContract: '2025-06-15', contractAccept: 'TRUE', paidDate: '', contactName: 'K. Bamrung', tel: '081-892-4541', email: 'albatross.phuket@gmail.com', otherContact: 'Line ID: pressonfire', turnOnDate: '2024-06-01', latestRenewContract: '2024-06-15', maContractExpired: '2026-06-15', latestMaintenance: '2025-06-15', omContractCount: '4 / 4 Tax', mapUrl: 'https://maps.google.com/?q=7.9934,98.3072' },
  { no: 4, solarPlant: 'Albatross Cafe Laguna', capacityKw: 18.5, locationArea: 'Choeng Thale', propertyVillage: 'Laguna', status: 'PAID / ACTIVE', qtContract: 'TRUE', dateIssueNewContract: '2025-06-01', contractAccept: 'TRUE', paidDate: '2025-06-10', contactName: 'K. Bamrung', tel: '081-892-4541', email: 'albatross.laguna@gmail.com', otherContact: 'Line: laguna_albatross', turnOnDate: '2023-09-01', latestRenewContract: '2024-09-20', maContractExpired: '2026-09-20', latestMaintenance: '2025-09-20', omContractCount: '4 / 4 Tax', mapUrl: 'https://maps.google.com/?q=7.9942,98.3015' },
  { no: 5, solarPlant: 'Aliroba Villa 1', capacityKw: 10.0, locationArea: 'Rawai', propertyVillage: 'Villa Aliroba', status: 'PAID / ACTIVE', qtContract: 'TRUE', dateIssueNewContract: '2025-08-01', contractAccept: 'TRUE', paidDate: '2025-08-15', contactName: 'K. Sam (GM)', tel: '083-213-0000', email: 'sam@aliroba.com', otherContact: 'WhatsApp: +66832130000', turnOnDate: '2024-08-10', latestRenewContract: '2024-08-10', maContractExpired: '2026-08-10', latestMaintenance: '2025-08-15', omContractCount: '4 / 4 Tax', mapUrl: 'https://maps.google.com/?q=7.7785,98.3195' },
  { no: 6, solarPlant: 'Anchan Tropicana V14-2 (Michael)', capacityKw: 15.0, locationArea: 'Thalang', propertyVillage: 'Anchan Tropicana', status: 'Send', qtContract: 'TRUE', dateIssueNewContract: '2025-09-01', contractAccept: 'FALSE', paidDate: '', contactName: 'Michael', tel: '089-111-2222', email: 'michael@anchantropicana.com', otherContact: '', turnOnDate: '2023-09-15', latestRenewContract: '2024-09-15', maContractExpired: '2026-09-15', latestMaintenance: '2025-09-15', omContractCount: '4 / 4 Tax', mapUrl: 'https://maps.google.com/?q=8.0200,98.3200' },
  { no: 7, solarPlant: 'Andaman Beach Hotel Phuket', capacityKw: 45.0, locationArea: 'Patong', propertyVillage: 'Patong Beach', status: 'PAID / ACTIVE', qtContract: 'TRUE', dateIssueNewContract: '2025-05-01', contractAccept: 'TRUE', paidDate: '2025-05-15', contactName: 'Khun Somchai (Chief Eng)', tel: '081-222-3333', email: 'eng@andamanbeachhotel.com', otherContact: '076-340-100', turnOnDate: '2022-05-01', latestRenewContract: '2024-05-01', maContractExpired: '2026-05-01', latestMaintenance: '2025-11-10', omContractCount: '4 / 4 Tax', mapUrl: 'https://maps.google.com/?q=7.8900,98.2950' },
  { no: 8, solarPlant: 'Baan Yamu Residence (Villa B4)', capacityKw: 12.0, locationArea: 'Paklok', propertyVillage: 'Baan Yamu', status: 'Send', qtContract: 'TRUE', dateIssueNewContract: '2025-10-01', contractAccept: 'FALSE', paidDate: '', contactName: 'Khun Aoi', tel: '084-555-6666', email: 'aoi@baanyamu.com', otherContact: '', turnOnDate: '2023-10-10', latestRenewContract: '2024-10-10', maContractExpired: '2026-10-10', latestMaintenance: '2025-10-10', omContractCount: '4 / 4 Tax', mapUrl: 'https://maps.google.com/?q=8.0050,98.4100' },
  { no: 9, solarPlant: 'Blue Canyon Country Club - Clubhouse', capacityKw: 100.0, locationArea: 'Thalang', propertyVillage: 'Blue Canyon', status: 'PAID / ACTIVE', qtContract: 'TRUE', dateIssueNewContract: '2025-01-10', contractAccept: 'TRUE', paidDate: '2025-01-25', contactName: 'Khun Prasert', tel: '081-999-8888', email: 'facility@bluecanyon.com', otherContact: '076-328-000', turnOnDate: '2021-01-10', latestRenewContract: '2024-01-10', maContractExpired: '2026-01-10', latestMaintenance: '2025-07-20', omContractCount: '4 / 4 Tax', mapUrl: 'https://maps.google.com/?q=8.1050,98.3200' },
  { no: 10, solarPlant: 'Cape Panwa Hotel Rooftop', capacityKw: 60.0, locationArea: 'Wichit', propertyVillage: 'Cape Panwa', status: 'Signed', qtContract: 'TRUE', dateIssueNewContract: '2025-04-01', contractAccept: 'TRUE', paidDate: '', contactName: 'Khun Nop', tel: '086-777-1111', email: 'gm@capepanwa.com', otherContact: '', turnOnDate: '2022-04-15', latestRenewContract: '2024-04-15', maContractExpired: '2026-04-15', latestMaintenance: '2025-10-15', omContractCount: '4 / 4 Tax', mapUrl: 'https://maps.google.com/?q=7.8050,98.4050' },

  // NEW 10 PLANTS ADDED IN SET 2 (No. 11 to 20)
  { no: 11, solarPlant: 'Dewan Phuket Hotel (เพิ่มในชุดที่ 2)', capacityKw: 20.0, locationArea: 'Muang Phuket', propertyVillage: 'Old Town', status: 'Send', qtContract: 'TRUE', dateIssueNewContract: '2025-11-01', contractAccept: 'FALSE', paidDate: '', contactName: 'Khun Lek', tel: '089-444-5555', email: 'info@dewanphuket.com', otherContact: '', turnOnDate: '2023-11-01', latestRenewContract: '2024-11-01', maContractExpired: '2026-11-01', latestMaintenance: '2025-11-01', omContractCount: '4 / 4 Tax', mapUrl: 'https://maps.google.com/?q=7.8850,98.3880' },
  { no: 12, solarPlant: 'Fishermans Harbour Urban Resort (เพิ่มในชุดที่ 2)', capacityKw: 80.0, locationArea: 'Patong', propertyVillage: 'Fishermans Harbour', status: 'PAID / ACTIVE', qtContract: 'TRUE', dateIssueNewContract: '2025-03-01', contractAccept: 'TRUE', paidDate: '2025-03-15', contactName: 'Khun Wichai', tel: '081-333-2222', email: 'maint@fishermansharbour.com', otherContact: '', turnOnDate: '2021-03-01', latestRenewContract: '2024-03-01', maContractExpired: '2026-03-01', latestMaintenance: '2025-09-01', omContractCount: '4 / 4 Tax', mapUrl: 'https://maps.google.com/?q=7.8800,98.2900' },
  { no: 13, solarPlant: 'Grand Mercure Phuket Patong (เพิ่มในชุดที่ 2)', capacityKw: 90.0, locationArea: 'Patong', propertyVillage: 'Grand Mercure', status: 'PAID / ACTIVE', qtContract: 'TRUE', dateIssueNewContract: '2025-02-01', contractAccept: 'TRUE', paidDate: '2025-02-14', contactName: 'Chief Engineer', tel: '076-231-999', email: 'eng@grandmercurephuket.com', otherContact: '', turnOnDate: '2020-02-01', latestRenewContract: '2024-02-01', maContractExpired: '2026-02-01', latestMaintenance: '2025-08-01', omContractCount: '4 / 4 Tax', mapUrl: 'https://maps.google.com/?q=7.8910,98.2990' },
  { no: 14, solarPlant: 'HOMA Phuket Town (เพิ่มในชุดที่ 2)', capacityKw: 150.0, locationArea: 'Muang Phuket', propertyVillage: 'HOMA Town', status: 'PAID / ACTIVE', qtContract: 'TRUE', dateIssueNewContract: '2025-01-15', contractAccept: 'TRUE', paidDate: '2025-01-30', contactName: 'Khun David', tel: '088-777-6666', email: 'david@homa.co', otherContact: 'Line: homa_eng', turnOnDate: '2022-01-15', latestRenewContract: '2024-01-15', maContractExpired: '2026-01-15', latestMaintenance: '2025-07-15', omContractCount: '6 / 6 Tax', mapUrl: 'https://maps.google.com/?q=7.8980,98.3820' },
  { no: 15, solarPlant: 'Impiana Resort Patong (เพิ่มในชุดที่ 2)', capacityKw: 35.0, locationArea: 'Patong', propertyVillage: 'Impiana', status: 'Send', qtContract: 'TRUE', dateIssueNewContract: '2025-07-15', contractAccept: 'FALSE', paidDate: '', contactName: 'Khun Porn', tel: '081-666-5555', email: 'impiana@impiana.com', otherContact: '', turnOnDate: '2023-07-15', latestRenewContract: '2024-07-15', maContractExpired: '2026-07-15', latestMaintenance: '2025-07-15', omContractCount: '4 / 4 Tax', mapUrl: 'https://maps.google.com/?q=7.8960,98.2980' },
  { no: 16, solarPlant: 'Keemala Resort Kamala (เพิ่มในชุดที่ 2)', capacityKw: 50.0, locationArea: 'Kamala', propertyVillage: 'Keemala', status: 'PAID / ACTIVE', qtContract: 'TRUE', dateIssueNewContract: '2025-06-10', contractAccept: 'TRUE', paidDate: '2025-06-25', contactName: 'Khun Sompong', tel: '082-555-1111', email: 'eng@keemala.com', otherContact: '', turnOnDate: '2021-06-10', latestRenewContract: '2024-06-10', maContractExpired: '2026-06-10', latestMaintenance: '2025-12-10', omContractCount: '4 / 4 Tax', mapUrl: 'https://maps.google.com/?q=7.9500,98.2880' },
  { no: 17, solarPlant: 'Laguna Phuket Golf Club (เพิ่มในชุดที่ 2)', capacityKw: 75.0, locationArea: 'Choeng Thale', propertyVillage: 'Laguna', status: 'Signed', qtContract: 'TRUE', dateIssueNewContract: '2025-05-20', contractAccept: 'TRUE', paidDate: '', contactName: 'Khun Chai', tel: '081-444-3333', email: 'golf@lagunaphuket.com', otherContact: '', turnOnDate: '2022-05-20', latestRenewContract: '2024-05-20', maContractExpired: '2026-05-20', latestMaintenance: '2025-11-20', omContractCount: '4 / 4 Tax', mapUrl: 'https://maps.google.com/?q=7.9950,98.3050' },
  { no: 18, solarPlant: 'Maya Phuket Airport Hotel (เพิ่มในชุดที่ 2)', capacityKw: 30.0, locationArea: 'Nai Yang', propertyVillage: 'Airport Area', status: 'Send', qtContract: 'TRUE', dateIssueNewContract: '2025-12-01', contractAccept: 'FALSE', paidDate: '', contactName: 'Khun Joy', tel: '089-888-7777', email: 'info@mayaphuket.com', otherContact: '', turnOnDate: '2023-12-01', latestRenewContract: '2024-12-01', maContractExpired: '2026-12-01', latestMaintenance: '2025-12-01', omContractCount: '4 / 4 Tax', mapUrl: 'https://maps.google.com/?q=8.1150,98.3050' },
  { no: 19, solarPlant: 'Novotel Phuket City Phokeethra (เพิ่มในชุดที่ 2)', capacityKw: 110.0, locationArea: 'Muang Phuket', propertyVillage: 'Phokeethra', status: 'PAID / ACTIVE', qtContract: 'TRUE', dateIssueNewContract: '2025-04-10', contractAccept: 'TRUE', paidDate: '2025-04-20', contactName: 'Engineering Dept', tel: '076-397-777', email: 'h9932-eng@accor.com', otherContact: '', turnOnDate: '2020-04-10', latestRenewContract: '2024-04-10', maContractExpired: '2026-04-10', latestMaintenance: '2025-10-10', omContractCount: '4 / 4 Tax', mapUrl: 'https://maps.google.com/?q=7.8820,98.3920' },
  { no: 20, solarPlant: 'Outrigger Surin Beach Resort (เพิ่มในชุดที่ 2)', capacityKw: 40.0, locationArea: 'Surin Beach', propertyVillage: 'Outrigger', status: 'Signed', qtContract: 'TRUE', dateIssueNewContract: '2025-08-20', contractAccept: 'TRUE', paidDate: '', contactName: 'Khun Tom', tel: '081-111-9999', email: 'surin@outrigger.com', otherContact: '', turnOnDate: '2022-08-20', latestRenewContract: '2024-08-20', maContractExpired: '2026-08-20', latestMaintenance: '2025-08-20', omContractCount: '4 / 4 Tax', mapUrl: 'https://maps.google.com/?q=7.9750,98.2820' },
];

function generateDatesForRounds(plantIndex) {
  const dates = {};
  const baseYear = 2025;
  const startMonth = (plantIndex % 12);
  for (let r = 1; r <= 12; r++) {
    const monthIndex = (startMonth + (r - 1)) % 12;
    const yearOffset = Math.floor((startMonth + (r - 1)) / 12);
    const year = baseYear + yearOffset;
    const monthStr = String(monthIndex + 1).padStart(2, '0');
    const dayStr = String(10 + (plantIndex % 15)).padStart(2, '0');
    dates[`r${r}_date`] = `${year}-${monthStr}-${dayStr}`;
    dates[`r${r}_done`] = r <= 2 ? 'TRUE' : 'FALSE';
  }
  return dates;
}

async function buildExcel(plantList, filename, title) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Solar Maintenance System';
  workbook.created = new Date();

  const sheet1 = workbook.addWorksheet('Maintenance Schedule', {
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
  sheet1.columns = columns;

  // Header style
  const headerRow = sheet1.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10, name: 'Calibri' };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  headerRow.height = 28;

  plantList.forEach((plant, idx) => {
    const roundDates = generateDatesForRounds(idx);
    const rowData = { ...plant, ...roundDates };
    const row = sheet1.addRow(rowData);
    row.height = 22;
    row.alignment = { vertical: 'middle' };
  });

  const publicDir = path.join(__dirname, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const publicPath = path.join(publicDir, filename);
  const rootPath = path.join(__dirname, filename);

  await workbook.xlsx.writeFile(publicPath);
  await workbook.xlsx.writeFile(rootPath);
  console.log(`Generated ${filename} with ${plantList.length} plants in public/ and root.`);
}

async function run() {
  // Set 1: 10 plants
  await buildExcel(masterPlants.slice(0, 10), 'mock_maintenance_schedule_10_plants.xlsx', '10 Plants');
  // Set 2: 20 plants (plants 1..10 + 10 new plants)
  await buildExcel(masterPlants.slice(0, 20), 'mock_maintenance_schedule_20_plants.xlsx', '20 Plants (10 Old + 10 New)');
  console.log('ALL DONE!');
}

run().catch(console.error);
