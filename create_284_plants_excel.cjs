const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const seedData = require('./initial_seed_data.json');

async function create284PlantsExcel() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Solar Maintenance System';
  workbook.created = new Date();

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

  const seedPlants = seedData.plants;

  seedPlants.forEach((p, index) => {
    const rowValues = [
      index + 1,
      p.solarPlant,
      p.capacityKw || '',
      p.locationArea || '',
      p.propertyVillage || '',
      p.status || 'Active',
      p.qtContract || 'TRUE',
      p.dateIssueNewContract || '',
      p.contractAccept || 'FALSE',
      p.paidDate || '',
      p.contactName || '',
      p.tel || '',
      p.email || '',
      p.otherContact || '',
      p.turnOnDate || '',
      p.latestRenewContract || '',
      p.maContractExpired || '',
      p.latestMaintenance || '',
      `${p.omContractCount || 4} / ${p.omContractCount || 4} Tax`,
    ];

    const plantRounds = (seedData.rounds || []).filter((r) => r.solarPlantId === p.id);
    for (let r = 1; r <= 12; r++) {
      const rnd = plantRounds.find((rItem) => rItem.roundNumber === r);
      rowValues.push(rnd ? rnd.scheduledDate || '' : '');
      rowValues.push(rnd && rnd.isCompleted ? '✓' : '');
    }

    rowValues.push(p.mapUrl || '');
    sheet1.addRow(rowValues);
  });

  // Additional 5 new plants
  const additional5Plants = [
    {
      no: 280,
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
      no: 281,
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
      no: 282,
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
      no: 283,
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
      no: 284,
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

  additional5Plants.forEach((p) => {
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

  const targetPathRoot = path.join(__dirname, 'Maintenance_Schedule_284_Plants_With_5_New.xlsx');
  const targetPathPublic = path.join(__dirname, 'public', 'Maintenance_Schedule_284_Plants_With_5_New.xlsx');

  await workbook.xlsx.writeFile(targetPathRoot);
  await workbook.xlsx.writeFile(targetPathPublic);

  console.log('✅ Generated Full Excel file with 284 plants (279 seed + 5 new):');
  console.log('   - File 1:', targetPathRoot);
  console.log('   - File 2:', targetPathPublic);
}

create284PlantsExcel().catch(console.error);
