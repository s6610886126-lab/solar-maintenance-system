const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

async function createMockExcel() {
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

  // -------------------------------------------------------------
  // SHEET 1: Maintenance Schedule
  // -------------------------------------------------------------
  const sheet1 = workbook.addWorksheet('Maintenance Schedule', {
    views: [{ state: 'frozen', xSplit: 2, ySplit: 1 }]
  });

  const columns = [
    { header: 'No', key: 'no', width: 6 },
    { header: 'Solar Plant', key: 'solarPlant', width: 34 },
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

  // 20 Mock Solar Plants
  const mockPlants = [
    {
      no: 1,
      solarPlant: 'A.K.A Co.,Ltd. (Joob Joob Bakery)',
      capacityKw: 15.0,
      locationArea: 'Kathu',
      propertyVillage: 'Kathu Valley',
      status: 'Send',
      qtContract: 'TRUE',
      dateIssueNewContract: '2025-07-01',
      contractAccept: 'FALSE',
      paidDate: '',
      contactName: 'Anthony',
      tel: '080-6091128',
      email: 'gm@chefsmarketphuket.com',
      otherContact: 'LINE: anthony_phuket',
      turnOnDate: '2022-07-01',
      latestRenewContract: '2024-03-14',
      maContractExpired: '2026-03-13',
      latestMaintenance: '2026-03-18',
      omContractCount: '6 / 6 Tax',
      rounds: [
        { d: '2022-07-01', done: true },
        { d: '2022-11-21', done: true },
        { d: '2024-03-18', done: true },
        { d: '2024-09-16', done: true },
        { d: '2025-03-18', done: true },
        { d: '2025-09-22', done: true },
        { d: '2026-03-18', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false }
      ],
      mapUrl: 'https://maps.google.com/?q=7.9056,98.3375'
    },
    {
      no: 2,
      solarPlant: 'AC Consulting Group Co.,Ltd',
      capacityKw: 12.48,
      locationArea: 'Muang Phuket',
      propertyVillage: 'Royal Place',
      status: 'Send',
      qtContract: 'TRUE',
      dateIssueNewContract: '2025-06-01',
      contractAccept: 'FALSE',
      paidDate: '',
      contactName: 'K.Tum / Khun Chan',
      tel: '081-893-1647',
      email: 'tum@acconsultphuket.com',
      otherContact: '081-270-5736',
      turnOnDate: '2024-05-19',
      latestRenewContract: '2024-05-19',
      maContractExpired: '2026-05-09',
      latestMaintenance: '2025-05-19',
      omContractCount: '4 / 4 Tax',
      rounds: [
        { d: '2024-05-19', done: true },
        { d: '2024-12-01', done: true },
        { d: '2025-01-20', done: true },
        { d: '2025-05-19', done: true },
        { d: '2026-05-19', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false }
      ],
      mapUrl: 'https://maps.google.com/?q=7.8765,98.3969'
    },
    {
      no: 3,
      solarPlant: 'Albatross - Press On Fire',
      capacityKw: 24.8,
      locationArea: 'Choeng Thale',
      propertyVillage: 'Porto de Phuket',
      status: 'Signed',
      qtContract: 'TRUE',
      dateIssueNewContract: '2025-06-15',
      contractAccept: 'TRUE',
      paidDate: '',
      contactName: 'K. Bamrung',
      tel: '081-892-4541',
      email: 'albatross.phuket@gmail.com',
      otherContact: 'Line ID: pressonfire',
      turnOnDate: '2024-06-01',
      latestRenewContract: '2024-06-15',
      maContractExpired: '2026-06-15',
      latestMaintenance: '2025-06-15',
      omContractCount: '4 / 4 Tax',
      rounds: [
        { d: '2024-06-15', done: true },
        { d: '2024-12-01', done: true },
        { d: '2025-01-20', done: true },
        { d: '2025-06-15', done: true },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false }
      ],
      mapUrl: 'https://maps.google.com/?q=7.9934,98.3072'
    },
    {
      no: 4,
      solarPlant: 'Albatross Cafe Laguna',
      capacityKw: 18.5,
      locationArea: 'Choeng Thale',
      propertyVillage: 'Laguna',
      status: 'PAID / ACTIVE',
      qtContract: 'TRUE',
      dateIssueNewContract: '2025-06-01',
      contractAccept: 'TRUE',
      paidDate: '2025-06-10',
      contactName: 'K. Bamrung',
      tel: '081-892-4541',
      email: 'albatross.laguna@gmail.com',
      otherContact: 'Line: laguna_albatross',
      turnOnDate: '2023-09-01',
      latestRenewContract: '2024-09-20',
      maContractExpired: '2026-09-20',
      latestMaintenance: '2025-09-20',
      omContractCount: '4 / 4 Tax',
      rounds: [
        { d: '2024-03-18', done: true },
        { d: '2024-09-20', done: true },
        { d: '2025-01-20', done: true },
        { d: '2025-09-20', done: true },
        { d: '2026-03-20', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false }
      ],
      mapUrl: 'https://maps.google.com/?q=7.9942,98.3015'
    },
    {
      no: 5,
      solarPlant: 'Aliroba Villa 1',
      capacityKw: 10.0,
      locationArea: 'Rawai',
      propertyVillage: 'Villa Aliroba',
      status: 'PAID / ACTIVE',
      qtContract: 'TRUE',
      dateIssueNewContract: '2025-08-01',
      contractAccept: 'TRUE',
      paidDate: '2025-08-15',
      contactName: 'K. Sam (GM)',
      tel: '083-213-0000',
      email: 'sam@aliroba.com',
      otherContact: 'WhatsApp: +66832130000',
      turnOnDate: '2024-08-10',
      latestRenewContract: '2024-08-10',
      maContractExpired: '2026-08-10',
      latestMaintenance: '2025-08-15',
      omContractCount: '4 / 4 Tax',
      rounds: [
        { d: '2024-08-10', done: true },
        { d: '2024-11-20', done: true },
        { d: '2025-02-15', done: true },
        { d: '2025-08-15', done: true },
        { d: '2026-08-20', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false }
      ],
      mapUrl: 'https://maps.google.com/?q=7.7785,98.3195'
    },
    {
      no: 6,
      solarPlant: 'Anchan Tropicana V14-2 (Michael)',
      capacityKw: 15.0,
      locationArea: 'Thalang',
      propertyVillage: 'Anchan Tropicana',
      status: 'Send',
      qtContract: 'TRUE',
      dateIssueNewContract: '2025-07-15',
      contractAccept: 'FALSE',
      paidDate: '',
      contactName: 'Michael Rosemary',
      tel: '098-765-4321',
      email: 'm.rosemary@anchan.com',
      otherContact: '',
      turnOnDate: '2024-07-01',
      latestRenewContract: '2024-07-15',
      maContractExpired: '2026-08-15',
      latestMaintenance: '2025-08-01',
      omContractCount: '4 / 4 Tax',
      rounds: [
        { d: '2024-08-01', done: true },
        { d: '2024-10-14', done: true },
        { d: '2025-01-15', done: true },
        { d: '2025-08-01', done: true },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false }
      ],
      mapUrl: 'https://maps.google.com/?q=8.0245,98.3412'
    },
    {
      no: 7,
      solarPlant: 'Andaman / Erwin',
      capacityKw: 20.0,
      locationArea: 'Rawai',
      propertyVillage: 'Siam Real Estate',
      status: 'Signed',
      qtContract: 'TRUE',
      dateIssueNewContract: '2025-09-01',
      contractAccept: 'TRUE',
      paidDate: '',
      contactName: 'K. Metha / Erwin',
      tel: '084-648-5373',
      email: 'erwin@siamrealestate.com',
      otherContact: '081-978-2234',
      turnOnDate: '2024-09-10',
      latestRenewContract: '2024-09-10',
      maContractExpired: '2026-09-10',
      latestMaintenance: '2025-09-15',
      omContractCount: '4 / 4 Tax',
      rounds: [
        { d: '2024-09-15', done: true },
        { d: '2024-12-14', done: true },
        { d: '2025-03-25', done: true },
        { d: '2025-09-15', done: true },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false }
      ],
      mapUrl: 'https://maps.google.com/?q=7.7854,98.3241'
    },
    {
      no: 8,
      solarPlant: 'Andaman / IMPACT 41',
      capacityKw: 15.0,
      locationArea: 'Choeng Thale',
      propertyVillage: 'Impact',
      status: 'PAID / ACTIVE',
      qtContract: 'TRUE',
      dateIssueNewContract: '2025-08-10',
      contractAccept: 'TRUE',
      paidDate: '2025-08-20',
      contactName: 'K. Metha',
      tel: '084-648-5373',
      email: 'metha@andamanenergy.com',
      otherContact: '',
      turnOnDate: '2024-08-25',
      latestRenewContract: '2024-08-25',
      maContractExpired: '2026-08-25',
      latestMaintenance: '2025-08-25',
      omContractCount: '4 / 4 Tax',
      rounds: [
        { d: '2024-08-25', done: true },
        { d: '2024-11-20', done: true },
        { d: '2025-02-25', done: true },
        { d: '2025-08-25', done: true },
        { d: '2026-08-25', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false }
      ],
      mapUrl: 'https://maps.google.com/?q=7.9892,98.3125'
    },
    {
      no: 9,
      solarPlant: 'Andaman / IMPACT 42',
      capacityKw: 14.4,
      locationArea: 'Choeng Thale',
      propertyVillage: 'Impact',
      status: 'Send',
      qtContract: 'TRUE',
      dateIssueNewContract: '2025-08-10',
      contractAccept: 'FALSE',
      paidDate: '',
      contactName: 'K. Metha',
      tel: '084-648-5373',
      email: 'metha@andamanenergy.com',
      otherContact: '',
      turnOnDate: '2024-08-25',
      latestRenewContract: '2024-08-25',
      maContractExpired: '2026-08-25',
      latestMaintenance: '2025-08-25',
      omContractCount: '4 / 4 Tax',
      rounds: [
        { d: '2024-08-25', done: true },
        { d: '2024-11-20', done: true },
        { d: '2025-02-25', done: true },
        { d: '2025-08-25', done: true },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false }
      ],
      mapUrl: 'https://maps.google.com/?q=7.9895,98.3128'
    },
    {
      no: 10,
      solarPlant: 'Asset World Sign & Set',
      capacityKw: 40.25,
      locationArea: 'Muang Phuket',
      propertyVillage: 'Laguna Phuket',
      status: 'PAID / ACTIVE',
      qtContract: 'TRUE',
      dateIssueNewContract: '2025-10-01',
      contractAccept: 'TRUE',
      paidDate: '2025-10-15',
      contactName: 'Khun Sombat (GM)',
      tel: '081-456-7890',
      email: 'sombat@assetworld.co.th',
      otherContact: 'Office: 076-324000',
      turnOnDate: '2023-10-15',
      latestRenewContract: '2024-10-15',
      maContractExpired: '2026-10-15',
      latestMaintenance: '2025-10-15',
      omContractCount: '4 / 4 Tax',
      rounds: [
        { d: '2024-10-15', done: true },
        { d: '2025-01-15', done: true },
        { d: '2025-04-15', done: true },
        { d: '2025-10-15', done: true },
        { d: '2026-10-15', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false }
      ],
      mapUrl: 'https://maps.google.com/?q=7.8921,98.3842'
    },
    {
      no: 11,
      solarPlant: 'BAAN PW',
      capacityKw: 25.0,
      locationArea: 'Thalang',
      propertyVillage: 'Baan PW Estate',
      status: 'Signed',
      qtContract: 'TRUE',
      dateIssueNewContract: '2025-11-01',
      contractAccept: 'TRUE',
      paidDate: '',
      contactName: 'Khun Prasert',
      tel: '089-123-4567',
      email: 'prasert@baanpw.com',
      otherContact: '',
      turnOnDate: '2024-05-01',
      latestRenewContract: '2024-05-01',
      maContractExpired: '2026-05-01',
      latestMaintenance: '2025-11-20',
      omContractCount: '4 / 4 Tax',
      rounds: [
        { d: '2024-11-20', done: true },
        { d: '2025-02-20', done: true },
        { d: '2025-05-20', done: true },
        { d: '2025-11-20', done: true },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false }
      ],
      mapUrl: 'https://maps.google.com/?q=8.0152,98.3289'
    },
    {
      no: 12,
      solarPlant: 'Bangkok Motorbike',
      capacityKw: 12.0,
      locationArea: 'Chalong',
      propertyVillage: 'Chaofa West',
      status: 'Waiting',
      qtContract: 'TRUE',
      dateIssueNewContract: '2025-09-20',
      contractAccept: 'FALSE',
      paidDate: '',
      contactName: 'K. Somchai',
      tel: '086-470-3849',
      email: 'bkk.motorbike.phuket@gmail.com',
      otherContact: '',
      turnOnDate: '2024-05-18',
      latestRenewContract: '2024-05-18',
      maContractExpired: '2026-05-18',
      latestMaintenance: '2025-05-18',
      omContractCount: '4 / 4 Tax',
      rounds: [
        { d: '2024-05-18', done: true },
        { d: '2024-09-25', done: true },
        { d: '2025-01-18', done: true },
        { d: '2025-05-18', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false }
      ],
      mapUrl: 'https://maps.google.com/?q=7.8456,98.3512'
    },
    {
      no: 13,
      solarPlant: 'Bansard Urgo',
      capacityKw: 35.0,
      locationArea: 'Choeng Thale',
      propertyVillage: 'Bang Tao Beach',
      status: 'Expired',
      qtContract: 'FALSE',
      dateIssueNewContract: '',
      contractAccept: 'FALSE',
      paidDate: '',
      contactName: 'Pascal Durand',
      tel: '081-999-8877',
      email: 'p.durand@bansard.com',
      otherContact: 'WhatsApp: +33612345678',
      turnOnDate: '2023-04-10',
      latestRenewContract: '2023-04-10',
      maContractExpired: '2024-04-10',
      latestMaintenance: '2024-08-09',
      omContractCount: '2 / 2 Tax',
      rounds: [
        { d: '2023-10-15', done: true },
        { d: '2024-08-09', done: true },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false }
      ],
      mapUrl: 'https://maps.google.com/?q=7.9912,98.2985'
    },
    {
      no: 14,
      solarPlant: 'Botanica Phase 4-Brodier',
      capacityKw: 15.0,
      locationArea: 'Choeng Thale',
      propertyVillage: 'Botanica Phase 4',
      status: 'PAID / ACTIVE',
      qtContract: 'TRUE',
      dateIssueNewContract: '2025-05-01',
      contractAccept: 'TRUE',
      paidDate: '2025-05-15',
      contactName: 'Mr. Brodier',
      tel: '089-222-3344',
      email: 'brodier.phuket@gmail.com',
      otherContact: '',
      turnOnDate: '2024-05-10',
      latestRenewContract: '2024-05-10',
      maContractExpired: '2026-05-10',
      latestMaintenance: '2025-05-10',
      omContractCount: '4 / 4 Tax',
      rounds: [
        { d: '2024-05-10', done: true },
        { d: '2024-08-15', done: true },
        { d: '2024-11-20', done: true },
        { d: '2025-05-10', done: true },
        { d: '2026-05-10', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false }
      ],
      mapUrl: 'https://maps.google.com/?q=8.0125,98.3187'
    },
    {
      no: 15,
      solarPlant: 'Botanica Parnita A20 (B-70) - Mr.Herve',
      capacityKw: 19.44,
      locationArea: 'Choeng Thale',
      propertyVillage: 'Botanica Forestique',
      status: 'PAID / ACTIVE',
      qtContract: 'TRUE',
      dateIssueNewContract: '2025-07-01',
      contractAccept: 'TRUE',
      paidDate: '2025-07-10',
      contactName: 'Mr. Herve',
      tel: '081-333-4455',
      email: 'herve.botanica@gmail.com',
      otherContact: 'K. Joy: 089-111-7782',
      turnOnDate: '2024-06-01',
      latestRenewContract: '2024-06-01',
      maContractExpired: '2026-06-01',
      latestMaintenance: '2025-06-20',
      omContractCount: '4 / 4 Tax',
      rounds: [
        { d: '2024-06-20', done: true },
        { d: '2024-09-15', done: true },
        { d: '2024-12-10', done: true },
        { d: '2025-06-20', done: true },
        { d: '2026-06-20', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false }
      ],
      mapUrl: 'https://maps.google.com/?q=8.0210,98.3245'
    },
    {
      no: 16,
      solarPlant: 'Botanica Parnita B-20 (Miss Bo)',
      capacityKw: 15.0,
      locationArea: 'Choeng Thale',
      propertyVillage: 'Botanica Forestique',
      status: 'Signed',
      qtContract: 'TRUE',
      dateIssueNewContract: '2025-07-01',
      contractAccept: 'TRUE',
      paidDate: '',
      contactName: 'Miss Bo',
      tel: '082-444-5566',
      email: 'bo.botanica@gmail.com',
      otherContact: '',
      turnOnDate: '2024-06-01',
      latestRenewContract: '2024-06-01',
      maContractExpired: '2026-06-01',
      latestMaintenance: '2025-06-20',
      omContractCount: '4 / 4 Tax',
      rounds: [
        { d: '2024-06-20', done: true },
        { d: '2024-09-15', done: true },
        { d: '2024-12-10', done: true },
        { d: '2025-06-20', done: true },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false }
      ],
      mapUrl: 'https://maps.google.com/?q=8.0215,98.3248'
    },
    {
      no: 17,
      solarPlant: 'Botanica Lakeside B1 (Andrew)',
      capacityKw: 19.44,
      locationArea: 'Choeng Thale',
      propertyVillage: 'Botanica Lakeside',
      status: 'Send',
      qtContract: 'TRUE',
      dateIssueNewContract: '2025-09-15',
      contractAccept: 'FALSE',
      paidDate: '',
      contactName: 'Andrew Clark',
      tel: '084-555-6677',
      email: 'andrew.lakeside@gmail.com',
      otherContact: 'K. A: 099-445-5661',
      turnOnDate: '2024-09-01',
      latestRenewContract: '2024-09-01',
      maContractExpired: '2026-09-01',
      latestMaintenance: '2025-09-18',
      omContractCount: '4 / 4 Tax',
      rounds: [
        { d: '2024-09-18', done: true },
        { d: '2024-12-15', done: true },
        { d: '2025-03-20', done: true },
        { d: '2025-09-18', done: true },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false }
      ],
      mapUrl: 'https://maps.google.com/?q=8.0289,98.3312'
    },
    {
      no: 18,
      solarPlant: 'Botanica Lakeside C1 (Simon)',
      capacityKw: 15.0,
      locationArea: 'Choeng Thale',
      propertyVillage: 'Botanica Lakeside',
      status: 'Not renew',
      qtContract: 'FALSE',
      dateIssueNewContract: '',
      contractAccept: 'FALSE',
      paidDate: '',
      contactName: 'Simon Peter',
      tel: '087-666-7788',
      email: 'simon.c1@botanica.com',
      otherContact: '',
      turnOnDate: '2023-08-01',
      latestRenewContract: '2023-08-01',
      maContractExpired: '2024-08-01',
      latestMaintenance: '2024-08-10',
      omContractCount: '4 / 4 Tax',
      rounds: [
        { d: '2023-08-10', done: true },
        { d: '2023-11-15', done: true },
        { d: '2024-02-20', done: true },
        { d: '2024-08-10', done: true },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false }
      ],
      mapUrl: 'https://maps.google.com/?q=8.0295,98.3318'
    },
    {
      no: 19,
      solarPlant: 'Botanica Lakeside C2 (Maxim)',
      capacityKw: 19.44,
      locationArea: 'Choeng Thale',
      propertyVillage: 'Botanica Lakeside',
      status: 'PAID / ACTIVE',
      qtContract: 'TRUE',
      dateIssueNewContract: '2025-06-19',
      contractAccept: 'TRUE',
      paidDate: '2025-06-25',
      contactName: 'Maxim Romanov',
      tel: '+7-928-000-23-39',
      email: 'maxim.lakeside@gmail.com',
      otherContact: 'WhatsApp: +79280002339',
      turnOnDate: '2024-06-15',
      latestRenewContract: '2024-06-15',
      maContractExpired: '2026-06-15',
      latestMaintenance: '2025-06-25',
      omContractCount: '4 / 4 Tax',
      rounds: [
        { d: '2024-06-25', done: true },
        { d: '2024-09-20', done: true },
        { d: '2024-12-15', done: true },
        { d: '2025-06-25', done: true },
        { d: '2026-06-25', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false }
      ],
      mapUrl: 'https://maps.google.com/?q=8.0301,98.3325'
    },
    {
      no: 20,
      solarPlant: 'Botanica Lakeside C3 (Thomas)',
      capacityKw: 15.0,
      locationArea: 'Choeng Thale',
      propertyVillage: 'Botanica Lakeside',
      status: 'PAID / ACTIVE',
      qtContract: 'TRUE',
      dateIssueNewContract: '2025-06-19',
      contractAccept: 'TRUE',
      paidDate: '2025-06-28',
      contactName: 'Thomas Wagner',
      tel: '085-777-8899',
      email: 'thomas.c3@botanica.com',
      otherContact: '',
      turnOnDate: '2024-06-15',
      latestRenewContract: '2024-06-15',
      maContractExpired: '2026-06-15',
      latestMaintenance: '2025-06-28',
      omContractCount: '4 / 4 Tax',
      rounds: [
        { d: '2024-06-28', done: true },
        { d: '2024-09-22', done: true },
        { d: '2024-12-18', done: true },
        { d: '2025-06-28', done: true },
        { d: '2026-06-28', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false },
        { d: '', done: false }
      ],
      mapUrl: 'https://maps.google.com/?q=8.0308,98.3330'
    }
  ];

  // Status color map for Excel rows
  const statusColors = {
    'PAID / ACTIVE': 'DCFCE7',
    'Send': 'FED7D7',
    'Signed': 'FEF3C7',
    'Waiting': 'E9D5FF',
    'Not renew': 'E2E8F0',
    'Expired': 'FEE2E2',
  };

  mockPlants.forEach((p, idx) => {
    const rowData = {
      no: p.no,
      solarPlant: p.solarPlant,
      capacityKw: p.capacityKw,
      locationArea: p.locationArea,
      propertyVillage: p.propertyVillage,
      status: p.status,
      qtContract: p.qtContract,
      dateIssueNewContract: p.dateIssueNewContract,
      contractAccept: p.contractAccept,
      paidDate: p.paidDate,
      contactName: p.contactName,
      tel: p.tel,
      email: p.email,
      otherContact: p.otherContact,
      turnOnDate: p.turnOnDate,
      latestRenewContract: p.latestRenewContract,
      maContractExpired: p.maContractExpired,
      latestMaintenance: p.latestMaintenance,
      omContractCount: p.omContractCount,
      mapUrl: p.mapUrl
    };

    p.rounds.forEach((rnd, rIdx) => {
      rowData[`r${rIdx + 1}_date`] = rnd.d;
      rowData[`r${rIdx + 1}_done`] = rnd.done ? 'TRUE' : 'FALSE';
    });

    const row = sheet1.addRow(rowData);
    row.height = 22;
    row.alignment = { vertical: 'middle' };

    // Style status cell
    const statusCell = row.getCell(6);
    const colorHex = statusColors[p.status] || 'F1F5F9';
    statusCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF' + colorHex }
    };
    statusCell.font = { bold: true, size: 9 };
    statusCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Format done check cells
    for (let r = 1; r <= 12; r++) {
      const doneCell = row.getCell(19 + r * 2);
      if (doneCell.value === 'TRUE') {
        doneCell.font = { bold: true, color: { argb: 'FF16A34A' } };
        doneCell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else {
        doneCell.alignment = { vertical: 'middle', horizontal: 'center' };
      }
    }
  });

  // -------------------------------------------------------------
  // SHEET 2: MA Report Tracking
  // -------------------------------------------------------------
  const sheet2 = workbook.addWorksheet('MA Report Tracking', {
    views: [{ state: 'frozen', xSplit: 2, ySplit: 1 }]
  });

  sheet2.columns = [
    { header: 'No', key: 'no', width: 6 },
    { header: 'Solar Plant', key: 'solarPlant', width: 34 },
    { header: 'MA Date', key: 'maDate', width: 14 },
    { header: 'MA Period', key: 'maPeriod', width: 18 },
    { header: 'Report Status', key: 'status', width: 16 },
    { header: 'Send to Customer Date', key: 'sendDate', width: 22 },
    { header: 'O&M Contract', key: 'omContract', width: 14 },
    { header: 'Round Number', key: 'roundNumber', width: 14 },
    { header: 'Note', key: 'note', width: 25 },
  ];
  styleHeaderRow(sheet2.getRow(1), '2563EB');

  mockPlants.forEach((p, idx) => {
    const isCompleted = idx % 3 !== 0;
    const row = sheet2.addRow({
      no: p.no,
      solarPlant: p.solarPlant,
      maDate: p.latestMaintenance || '2025-06-15',
      maPeriod: 'Q2 / 2025',
      status: isCompleted ? 'Completed' : 'Pending',
      sendDate: isCompleted ? (p.latestMaintenance || '2025-06-20') : '',
      omContract: 4,
      roundNumber: 4,
      note: isCompleted ? 'Sent PDF via Email & LINE' : 'Awaiting technician report summary'
    });
    row.height = 22;
    row.alignment = { vertical: 'middle' };

    const stCell = row.getCell(5);
    stCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: isCompleted ? 'FFDCFCE7' : 'FFFEF3C7' }
    };
    stCell.font = { bold: true, color: { argb: isCompleted ? 'FF166534' : 'FF92400E' } };
    stCell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // Ensure public directory exists
  const publicDir = path.join(__dirname, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const file1 = path.join(__dirname, 'mock_maintenance_schedule_20_plants.xlsx');
  const file2 = path.join(publicDir, 'mock_maintenance_schedule_20_plants.xlsx');

  await workbook.xlsx.writeFile(file1);
  await workbook.xlsx.writeFile(file2);

  console.log('✅ Generated mock excel files successfully:');
  console.log('  1. ' + file1);
  console.log('  2. ' + file2);
}

createMockExcel().catch(console.error);
