const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

async function create5NewPlantsExcel() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Solar Maintenance System';
  workbook.created = new Date();

  // Helper for header styling
  const styleHeaderRow = (row, bgHex = '0F766E') => {
    row.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10, name: 'Calibri' };
    row.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF' + bgHex },
    };
    row.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    row.height = 28;
  };

  const sheet1 = workbook.addWorksheet('Maintenance Schedule', {
    views: [{ state: 'frozen', xSplit: 2, ySplit: 1 }]
  });

  const columns = [
    { header: 'No', key: 'no', width: 6 },
    { header: 'Solar Plant', key: 'solarPlant', width: 36 },
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
  styleHeaderRow(sheet1.getRow(1), '1E293B');

  // Base 20 plants
  const basePlants = [
    { no: 1, solarPlant: 'A.K.A Co.,Ltd. (Joob Joob Bakery)', capacityKw: 15.0, locationArea: 'Kathu', propertyVillage: 'Kathu Valley', status: 'Send', qtContract: 'TRUE', dateIssueNewContract: '2025-07-01', contractAccept: 'FALSE', paidDate: '', contactName: 'Anthony', tel: '080-6091128', email: 'gm@chefsmarketphuket.com', otherContact: 'LINE: anthony_phuket', turnOnDate: '2022-07-01', latestRenewContract: '2024-03-14', maContractExpired: '2026-03-13', latestMaintenance: '2026-03-18', omContractCount: '6 / 6 Tax' },
    { no: 2, solarPlant: 'AC Consulting Group Co.,Ltd', capacityKw: 12.48, locationArea: 'Muang Phuket', propertyVillage: 'Royal Place', status: 'Send', qtContract: 'TRUE', dateIssueNewContract: '2025-06-01', contractAccept: 'FALSE', paidDate: '', contactName: 'K.Tum / Khun Chan', tel: '081-893-1647', email: 'tum@acconsultphuket.com', otherContact: '081-270-5736', turnOnDate: '2024-05-19', latestRenewContract: '2024-05-19', maContractExpired: '2026-05-09', latestMaintenance: '2025-05-19', omContractCount: '4 / 4 Tax' },
    { no: 3, solarPlant: 'Albatross - Press On Fire', capacityKw: 24.8, locationArea: 'Choeng Thale', propertyVillage: 'Porto de Phuket', status: 'Signed', qtContract: 'TRUE', dateIssueNewContract: '2025-06-15', contractAccept: 'TRUE', paidDate: '', contactName: 'K. Bamrung', tel: '081-892-4541', email: 'albatross.phuket@gmail.com', otherContact: 'Line ID: pressonfire', turnOnDate: '2024-06-01', latestRenewContract: '2024-06-15', maContractExpired: '2026-06-15', latestMaintenance: '2025-06-15', omContractCount: '4 / 4 Tax' },
    { no: 4, solarPlant: 'Albatross Cafe Laguna', capacityKw: 18.5, locationArea: 'Choeng Thale', propertyVillage: 'Laguna', status: 'PAID / ACTIVE', qtContract: 'TRUE', dateIssueNewContract: '2025-06-01', contractAccept: 'TRUE', paidDate: '2025-06-10', contactName: 'K. Bamrung', tel: '081-892-4541', email: 'albatross.laguna@gmail.com', otherContact: 'Line: laguna_albatross', turnOnDate: '2023-09-01', latestRenewContract: '2024-09-20', maContractExpired: '2026-09-20', latestMaintenance: '2025-09-20', omContractCount: '4 / 4 Tax' },
    { no: 5, solarPlant: 'Aliroba Villa 1', capacityKw: 10.0, locationArea: 'Rawai', propertyVillage: 'Villa Aliroba', status: 'PAID / ACTIVE', qtContract: 'TRUE', dateIssueNewContract: '2025-08-01', contractAccept: 'TRUE', paidDate: '2025-08-15', contactName: 'K. Sam (GM)', tel: '083-213-0000', email: 'sam@aliroba.com', otherContact: 'WhatsApp: +66832130000', turnOnDate: '2024-08-10', latestRenewContract: '2024-08-10', maContractExpired: '2026-08-10', latestMaintenance: '2025-08-15', omContractCount: '4 / 4 Tax' },
    { no: 6, solarPlant: 'Anchan Tropicana V14-2 (Michael)', capacityKw: 15.0, locationArea: 'Thalang', propertyVillage: 'Anchan Tropicana', status: 'Send', qtContract: 'TRUE', dateIssueNewContract: '2025-09-01', contractAccept: 'FALSE', paidDate: '', contactName: 'Michael', tel: '089-111-2222', email: 'michael@anchantropicana.com', otherContact: '', turnOnDate: '2023-09-15', latestRenewContract: '2024-09-15', maContractExpired: '2026-09-15', latestMaintenance: '2025-09-15', omContractCount: '4 / 4 Tax' },
    { no: 7, solarPlant: 'Andaman Beach Hotel Phuket', capacityKw: 45.0, locationArea: 'Patong', propertyVillage: 'Patong Beach', status: 'PAID / ACTIVE', qtContract: 'TRUE', dateIssueNewContract: '2025-05-01', contractAccept: 'TRUE', paidDate: '2025-05-15', contactName: 'Khun Somchai (Chief Eng)', tel: '081-222-3333', email: 'eng@andamanbeachhotel.com', otherContact: '076-340-100', turnOnDate: '2022-05-01', latestRenewContract: '2024-05-01', maContractExpired: '2026-05-01', latestMaintenance: '2025-11-10', omContractCount: '4 / 4 Tax' },
    { no: 8, solarPlant: 'Baan Yamu Residence (Villa B4)', capacityKw: 12.0, locationArea: 'Paklok', propertyVillage: 'Baan Yamu', status: 'Send', qtContract: 'TRUE', dateIssueNewContract: '2025-10-01', contractAccept: 'FALSE', paidDate: '', contactName: 'Khun Aoi', tel: '084-555-6666', email: 'aoi@baanyamu.com', otherContact: '', turnOnDate: '2023-10-10', latestRenewContract: '2024-10-10', maContractExpired: '2026-10-10', latestMaintenance: '2025-10-10', omContractCount: '4 / 4 Tax' },
    { no: 9, solarPlant: 'Blue Canyon Country Club - Clubhouse', capacityKw: 100.0, locationArea: 'Thalang', propertyVillage: 'Blue Canyon', status: 'PAID / ACTIVE', qtContract: 'TRUE', dateIssueNewContract: '2025-01-10', contractAccept: 'TRUE', paidDate: '2025-01-25', contactName: 'Khun Prasert', tel: '081-999-8888', email: 'facility@bluecanyon.com', otherContact: '076-328-000', turnOnDate: '2021-01-10', latestRenewContract: '2024-01-10', maContractExpired: '2026-01-10', latestMaintenance: '2025-07-20', omContractCount: '4 / 4 Tax' },
    { no: 10, solarPlant: 'Cape Panwa Hotel Rooftop', capacityKw: 60.0, locationArea: 'Wichit', propertyVillage: 'Cape Panwa', status: 'Signed', qtContract: 'TRUE', dateIssueNewContract: '2025-04-01', contractAccept: 'TRUE', paidDate: '', contactName: 'Khun Nop', tel: '086-777-1111', email: 'gm@capepanwa.com', otherContact: '', turnOnDate: '2022-04-15', latestRenewContract: '2024-04-15', maContractExpired: '2026-04-15', latestMaintenance: '2025-10-15', omContractCount: '4 / 4 Tax' },
    { no: 11, solarPlant: 'Dewan Phuket Hotel', capacityKw: 20.0, locationArea: 'Muang Phuket', propertyVillage: 'Old Town', status: 'Send', qtContract: 'TRUE', dateIssueNewContract: '2025-11-01', contractAccept: 'FALSE', paidDate: '', contactName: 'Khun Lek', tel: '089-444-5555', email: 'info@dewanphuket.com', otherContact: '', turnOnDate: '2023-11-01', latestRenewContract: '2024-11-01', maContractExpired: '2026-11-01', latestMaintenance: '2025-11-01', omContractCount: '4 / 4 Tax' },
    { no: 12, solarPlant: 'Fishermans Harbour Urban Resort', capacityKw: 80.0, locationArea: 'Patong', propertyVillage: 'Fishermans Harbour', status: 'PAID / ACTIVE', qtContract: 'TRUE', dateIssueNewContract: '2025-03-01', contractAccept: 'TRUE', paidDate: '2025-03-15', contactName: 'Khun Wichai', tel: '081-333-2222', email: 'maint@fishermansharbour.com', otherContact: '', turnOnDate: '2021-03-01', latestRenewContract: '2024-03-01', maContractExpired: '2026-03-01', latestMaintenance: '2025-09-01', omContractCount: '4 / 4 Tax' },
    { no: 13, solarPlant: 'Grand Mercure Phuket Patong', capacityKw: 90.0, locationArea: 'Patong', propertyVillage: 'Grand Mercure', status: 'PAID / ACTIVE', qtContract: 'TRUE', dateIssueNewContract: '2025-02-01', contractAccept: 'TRUE', paidDate: '2025-02-14', contactName: 'Chief Engineer', tel: '076-231-999', email: 'eng@grandmercurephuket.com', otherContact: '', turnOnDate: '2020-02-01', latestRenewContract: '2024-02-01', maContractExpired: '2026-02-01', latestMaintenance: '2025-08-01', omContractCount: '4 / 4 Tax' },
    { no: 14, solarPlant: 'HOMA Phuket Town (Rooftop 150kW)', capacityKw: 150.0, locationArea: 'Muang Phuket', propertyVillage: 'HOMA Town', status: 'PAID / ACTIVE', qtContract: 'TRUE', dateIssueNewContract: '2025-01-15', contractAccept: 'TRUE', paidDate: '2025-01-30', contactName: 'Khun David', tel: '088-777-6666', email: 'david@homa.co', otherContact: 'Line: homa_eng', turnOnDate: '2022-01-15', latestRenewContract: '2024-01-15', maContractExpired: '2026-01-15', latestMaintenance: '2025-07-15', omContractCount: '6 / 6 Tax' },
    { no: 15, solarPlant: 'Impiana Resort Patong', capacityKw: 35.0, locationArea: 'Patong', propertyVillage: 'Impiana', status: 'Send', qtContract: 'TRUE', dateIssueNewContract: '2025-07-15', contractAccept: 'FALSE', paidDate: '', contactName: 'Khun Porn', tel: '081-666-5555', email: 'impiana@impiana.com', otherContact: '', turnOnDate: '2023-07-15', latestRenewContract: '2024-07-15', maContractExpired: '2026-07-15', latestMaintenance: '2025-07-15', omContractCount: '4 / 4 Tax' },
    { no: 16, solarPlant: 'Keemala Resort Kamala', capacityKw: 50.0, locationArea: 'Kamala', propertyVillage: 'Keemala', status: 'PAID / ACTIVE', qtContract: 'TRUE', dateIssueNewContract: '2025-06-10', contractAccept: 'TRUE', paidDate: '2025-06-25', contactName: 'Khun Sompong', tel: '082-555-1111', email: 'eng@keemala.com', otherContact: '', turnOnDate: '2021-06-10', latestRenewContract: '2024-06-10', maContractExpired: '2026-06-10', latestMaintenance: '2025-12-10', omContractCount: '4 / 4 Tax' },
    { no: 17, solarPlant: 'Laguna Phuket Golf Club', capacityKw: 75.0, locationArea: 'Choeng Thale', propertyVillage: 'Laguna', status: 'Signed', qtContract: 'TRUE', dateIssueNewContract: '2025-05-20', contractAccept: 'TRUE', paidDate: '', contactName: 'Khun Chai', tel: '081-444-3333', email: 'golf@lagunaphuket.com', otherContact: '', turnOnDate: '2022-05-20', latestRenewContract: '2024-05-20', maContractExpired: '2026-05-20', latestMaintenance: '2025-11-20', omContractCount: '4 / 4 Tax' },
    { no: 18, solarPlant: 'Maya Phuket Airport Hotel', capacityKw: 30.0, locationArea: 'Nai Yang', propertyVillage: 'Airport Area', status: 'Send', qtContract: 'TRUE', dateIssueNewContract: '2025-12-01', contractAccept: 'FALSE', paidDate: '', contactName: 'Khun Joy', tel: '089-888-7777', email: 'info@mayaphuket.com', otherContact: '', turnOnDate: '2023-12-01', latestRenewContract: '2024-12-01', maContractExpired: '2026-12-01', latestMaintenance: '2025-12-01', omContractCount: '4 / 4 Tax' },
    { no: 19, solarPlant: 'Novotel Phuket City Phokeethra', capacityKw: 110.0, locationArea: 'Muang Phuket', propertyVillage: 'Phokeethra', status: 'PAID / ACTIVE', qtContract: 'TRUE', dateIssueNewContract: '2025-04-10', contractAccept: 'TRUE', paidDate: '2025-04-20', contactName: 'Engineering Dept', tel: '076-397-777', email: 'h9932-eng@accor.com', otherContact: '', turnOnDate: '2020-04-10', latestRenewContract: '2024-04-10', maContractExpired: '2026-04-10', latestMaintenance: '2025-10-10', omContractCount: '4 / 4 Tax' },
    { no: 20, solarPlant: 'Outrigger Surin Beach Resort', capacityKw: 40.0, locationArea: 'Surin Beach', propertyVillage: 'Outrigger', status: 'Signed', qtContract: 'TRUE', dateIssueNewContract: '2025-08-20', contractAccept: 'TRUE', paidDate: '', contactName: 'Khun Tom', tel: '081-111-9999', email: 'surin@outrigger.com', otherContact: '', turnOnDate: '2022-08-20', latestRenewContract: '2024-08-20', maContractExpired: '2026-08-20', latestMaintenance: '2025-08-20', omContractCount: '4 / 4 Tax' }
  ];

  // 5 NEW PLANTS (Added on top)
  const additional5Plants = [
    {
      no: 21,
      solarPlant: 'Phuket Beach Resort Solar Rooftop (โครงการใหม่ 1)',
      capacityKw: 50.0,
      locationArea: 'Patong',
      propertyVillage: 'Patong Beachfront',
      status: 'PAID / ACTIVE',
      qtContract: 'TRUE',
      dateIssueNewContract: '2026-01-15',
      contractAccept: 'TRUE',
      paidDate: '2026-01-20',
      contactName: 'Khun Somchai',
      tel: '081-123-4567',
      email: 'somchai@phuketbeachresort.com',
      otherContact: 'Line: somchai_solar',
      turnOnDate: '2026-01-15',
      latestRenewContract: '2026-01-15',
      maContractExpired: '2027-01-14',
      latestMaintenance: '2026-01-20',
      omContractCount: '4 / 4 Tax',
      mapUrl: 'https://maps.google.com/?q=7.8950,98.2970'
    },
    {
      no: 22,
      solarPlant: 'Andaman Green Energy Power Plant (โครงการใหม่ 2)',
      capacityKw: 120.5,
      locationArea: 'Thalang',
      propertyVillage: 'Thalang Eco Park',
      status: 'Signed',
      qtContract: 'TRUE',
      dateIssueNewContract: '2026-02-01',
      contractAccept: 'TRUE',
      paidDate: '2026-02-10',
      contactName: 'Khun Wichai',
      tel: '089-987-6543',
      email: 'wichai@andamangreen.co.th',
      otherContact: 'WhatsApp: +66899876543',
      turnOnDate: '2026-02-01',
      latestRenewContract: '2026-02-01',
      maContractExpired: '2027-01-31',
      latestMaintenance: '2026-02-15',
      omContractCount: '4 / 4 Tax',
      mapUrl: 'https://maps.google.com/?q=8.0300,98.3300'
    },
    {
      no: 23,
      solarPlant: 'Siam Eco Factory Solar Care (โครงการใหม่ 3)',
      capacityKw: 250.0,
      locationArea: 'Kathu',
      propertyVillage: 'Kathu Industrial Estate',
      status: 'Send',
      qtContract: 'TRUE',
      dateIssueNewContract: '2026-03-10',
      contractAccept: 'FALSE',
      paidDate: '',
      contactName: 'Khun Nop',
      tel: '086-555-4321',
      email: 'nop@siamecofactory.com',
      otherContact: '076-555-123',
      turnOnDate: '2026-03-10',
      latestRenewContract: '2026-03-10',
      maContractExpired: '2027-03-09',
      latestMaintenance: '2026-03-20',
      omContractCount: '4 / 4 Tax',
      mapUrl: 'https://maps.google.com/?q=7.9100,98.3400'
    },
    {
      no: 24,
      solarPlant: 'Kamala Hillside Villa Solar (โครงการใหม่ 4)',
      capacityKw: 35.8,
      locationArea: 'Kamala',
      propertyVillage: 'Kamala Ocean View',
      status: 'PAID / ACTIVE',
      qtContract: 'TRUE',
      dateIssueNewContract: '2026-04-01',
      contractAccept: 'TRUE',
      paidDate: '2026-04-05',
      contactName: 'Khun Lisa',
      tel: '092-333-4455',
      email: 'lisa@kamalahillside.com',
      otherContact: 'Line: lisa_villa',
      turnOnDate: '2026-04-01',
      latestRenewContract: '2026-04-01',
      maContractExpired: '2027-03-31',
      latestMaintenance: '2026-04-10',
      omContractCount: '4 / 4 Tax',
      mapUrl: 'https://maps.google.com/?q=7.9550,98.2850'
    },
    {
      no: 25,
      solarPlant: 'Rawai Clean Energy Station (โครงการใหม่ 5)',
      capacityKw: 80.0,
      locationArea: 'Rawai',
      propertyVillage: 'Rawai Seafood Market Area',
      status: 'Signed',
      qtContract: 'TRUE',
      dateIssueNewContract: '2026-05-15',
      contractAccept: 'TRUE',
      paidDate: '',
      contactName: 'Khun Prasert',
      tel: '084-777-8899',
      email: 'prasert@rawaicleanenergy.com',
      otherContact: '',
      turnOnDate: '2026-05-15',
      latestRenewContract: '2026-05-15',
      maContractExpired: '2027-05-14',
      latestMaintenance: '2026-05-20',
      omContractCount: '4 / 4 Tax',
      mapUrl: 'https://maps.google.com/?q=7.7800,98.3250'
    }
  ];

  const all25Plants = [...basePlants, ...additional5Plants];

  all25Plants.forEach((p) => {
    const rowValues = [
      p.no,
      p.solarPlant,
      p.capacityKw,
      p.locationArea,
      p.propertyVillage,
      p.status,
      p.qtContract,
      p.dateIssueNewContract,
      p.contractAccept,
      p.paidDate,
      p.contactName,
      p.tel,
      p.email,
      p.otherContact,
      p.turnOnDate,
      p.latestRenewContract,
      p.maContractExpired,
      p.latestMaintenance,
      p.omContractCount,
    ];

    for (let r = 1; r <= 12; r++) {
      if (r === 1) {
        rowValues.push(p.latestMaintenance || '2026-01-15');
        rowValues.push('✓');
      } else if (r === 2) {
        rowValues.push('2026-04-15');
        rowValues.push('');
      } else if (r === 3) {
        rowValues.push('2026-07-15');
        rowValues.push('');
      } else if (r === 4) {
        rowValues.push('2026-10-15');
        rowValues.push('');
      } else {
        rowValues.push('');
        rowValues.push('');
      }
    }

    rowValues.push(p.mapUrl || '');
    sheet1.addRow(rowValues);
  });

  const targetPathRoot = path.join(__dirname, 'mock_maintenance_schedule_25_plants.xlsx');
  const targetPathPublic = path.join(__dirname, 'public', 'mock_maintenance_schedule_25_plants.xlsx');

  await workbook.xlsx.writeFile(targetPathRoot);
  await workbook.xlsx.writeFile(targetPathPublic);

  console.log('✅ Generated Excel file with 25 plants (20 base + 5 new):');
  console.log('   - File 1:', targetPathRoot);
  console.log('   - File 2:', targetPathPublic);
}

create5NewPlantsExcel().catch(console.error);
