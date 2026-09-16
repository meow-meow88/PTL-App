import { InspectionJob } from '../types';

// Clean SVG placeholders for photographic evidence items
export const createSamplePhotoSvg = (label: string, bg: string, accent: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="280" viewBox="0 0 400 280">
    <rect width="400" height="280" fill="${bg}"/>
    <rect x="20" y="20" width="360" height="240" rx="8" fill="#1e293b" stroke="${accent}" stroke-width="2"/>
    <circle cx="200" cy="115" r="42" fill="#0f172a" stroke="${accent}" stroke-width="2"/>
    <path d="M185 115 L215 115 M200 100 L200 130" stroke="${accent}" stroke-width="3" stroke-linecap="round"/>
    <text x="200" y="195" fill="#f8fafc" font-family="sans-serif" font-size="14" font-weight="600" text-anchor="middle">${label}</text>
    <text x="200" y="220" fill="#94a3b8" font-family="sans-serif" font-size="11" text-anchor="middle">Phuket Trusted Local • Verified Field Inspection</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const sampleJobKMazen: InspectionJob = {
  id: 'PTL-INSP-20260818-004',
  clientId: 'CL-MAZEN-001',
  villaName: 'K. Mazen Villa, Green Mile Kathu',
  customerName: 'K. Mazen',
  customerGroup: 'villa_owner',
  propertyLocation: 'Green Mile Villa, Kathu, Phuket',
  serviceType: 'Smart Home & Electrical Rectification',
  status: 'Quoted',
  inspectionDate: '18 Aug 2026',
  createdAt: '2026-08-18T09:00:00Z',
  inspector: 'Field Team (Mr. Big Inspector)',
  documentRef: 'site_inspection_report_v4.pdf Attachment',
  driveFolderUrl: 'https://drive.google.com/drive/folders/1PTL-Mazen-Kathu-Evidence-2026',
  notes: 'Customer residing overseas. Comprehensive tech, network, and smart home electrical diagnostic.',
  items: [
    {
      id: 'item-1',
      category: 'NETWORK & INFRASTRUCTURE',
      locationZone: 'Main Entrance / Tech Hub',
      title: 'Modem & Optical Router Check',
      fileReference: 'IMG_3597.jpg',
      imageUrl: createSamplePhotoSvg('Modem & Optical Router Check', '#0f172a', '#38bdf8'),
      observationEn:
        'Verification of TP-Link Router and main Optical Network Unit (ONU). Indicators (Power, PON, Internet, LAN3) are active and functional.',
      observationTh:
        'ตรวจสอบสถานะอุปกรณ์ TP-Link Router และ ONU Modem พบไฟสัญญาณ POWER, PON, Internet และ LAN3 ทำงานปกติ สายสัญญาณ UTP/Cat5e เชื่อมต่อเรียบร้อย',
      status: 'Normal',
      recommendedActionEn:
        'System is operating within expected baseline. Routine biannual cleaning advised.',
      recommendedActionTh:
        'ระบบทำงานได้ตามมาตรฐาน แนะนำเป่าฝุ่นและตรวจสอบขั้วต่อทุก 6 เดือน',
      createdAt: '2026-08-18T10:15:00Z',
    },
    {
      id: 'item-2',
      category: 'NETWORK & POWER BACKUP',
      locationZone: 'Server Cabinet Zone',
      title: 'Server Rack & PoE Switch Audit',
      fileReference: 'IMG_3598.jpg',
      imageUrl: createSamplePhotoSvg('Server Rack & PoE Switch Audit', '#1e1b4b', '#818cf8'),
      observationEn:
        'Inspection of network cabinet, TP-Link TL-SG1008MP & Cisco SG250 PoE switches, cable management, and 12V 7AH UPS battery backup system.',
      observationTh:
        'ตรวจสอบตู้ Rack สวิตช์ PoE (TP-Link TL-SG1008MP และ Cisco SG250 Smart Switch) การเดินสาย LAN อยู่ในสภาพพร้อมใช้งาน และมีชุดสำรองไฟ แบตเตอรี่ 12V 7AH สำหรับสวิตช์และบันทึกภาพ CCTV',
      status: 'Normal',
      recommendedActionEn:
        'Battery voltage level tests healthy at 12.6V. Scheduled battery replacement recommended in 12 months.',
      recommendedActionTh:
        'แรงดันไฟแบตเตอรี่สำรองปกติที่ 12.6V แนะนำเปลี่ยนแบตเตอรี่ลูกใหม่ตามรอบทุก 1 ปี',
      createdAt: '2026-08-18T10:35:00Z',
    },
    {
      id: 'item-3',
      category: 'SMART HOME SYSTEM DIAGNOSTICS',
      locationZone: 'Dressing Room / His Wardrobe',
      title: 'Smart Home Dashboard Status',
      fileReference: 'IMG_3600.jpg',
      imageUrl: createSamplePhotoSvg('Smart Home Dashboard Error', '#31101e', '#f43f5e'),
      observationEn:
        "Control panel interface error log showing 'Entity not found' for dressing room switch (l1, l2) and 'Unavailable' status for His wardrobe following network change.",
      observationTh:
        'หน้าจอควบคุมห้องแต่งตัว (Dressing Room) แสดงสถานะข้อผิดพลาด Entity not found สำหรับสวิตช์ switch.dressing_room_l1 และ l2 รวมถึงสถานะ His wardrobe ขึ้น Unavailable เนื่องจากการเปลี่ยนโครงข่าย Wi-Fi/IP Address',
      status: 'Disconnected',
      recommendedActionEn:
        'Re-index Wi-Fi credentials and bind smart home entities back to Home Assistant controller dashboard.',
      recommendedActionTh:
        'ตั้งค่าและซิงค์สวิตช์เข้ากับระบบ Wi-Fi ใหม่ พร้อม re-index entity ในระบบ Dashboard',
      createdAt: '2026-08-18T11:05:00Z',
    },
    {
      id: 'item-4',
      category: 'SMART HOME HARDWARE',
      locationZone: 'Main Living Wall',
      title: 'Wall-Mounted Tablet Controller Docking',
      fileReference: 'IMG_3602.jpg',
      imageUrl: createSamplePhotoSvg('Wall Tablet Hardware Check', '#142838', '#38bdf8'),
      observationEn:
        'Check-up on side wall mounting and continuous power delivery setup for the Smart Home tablet controller. Battery cell degradation detected on current tablet unit.',
      observationTh:
        'ตรวจสอบการติดตั้งแท็บเล็ตหน้าจอควบคุมเข้ากับผนังไม้ พบตัวเครื่องติดตั้งแน่นหนาพร้อมการเสียบสายชาร์จไฟต่อเนื่อง แต่แบตเตอรี่เครื่องเดิมบวมสมควรเปลี่ยนเพื่อความปลอดภัย',
      status: 'Critical Swap',
      recommendedActionEn:
        'Procure and install a new Smart Home Control Panel hardware unit (Redmi Pad SE + Fully Kiosk license) and dedicated 5V 2A continuous supply adapter.',
      recommendedActionTh:
        'จัดหาและติดตั้งหน้าจอควบคุมเครื่องใหม่ (Redmi Pad SE 8.7" + ลิขสิทธิ์ Fully Kiosk) พร้อมหัวชาร์จจ่ายไฟนิ่ง',
      createdAt: '2026-08-18T11:30:00Z',
    },
    {
      id: 'item-5',
      category: 'ELECTRICAL & LIGHTING AUDIT',
      locationZone: 'Staircase / ทางขึ้นชั้น 2',
      title: 'Electrical Circuit & Switch Inspection',
      fileReference: 'IMG_3610.jpg',
      imageUrl: createSamplePhotoSvg('Electrical Breaker & Short Circuit', '#3f1515', '#ef4444'),
      observationEn:
        'Probing live terminals behind wall switches using a test pen to troubleshoot tripped breakers and short circuit roots. No power supplying to 2 light switches.',
      observationTh:
        'การเปิดหน้าแผงสวิตช์ไฟและทดสอบสายไฟเบื้องหลังด้วยไขควงเช็กไฟ (Test Pen) พบการเชื่อมต่อสายไฟ L/N และสวิตช์รีเลย์ เพื่อหาสาเหตุไฟตัดและจุดลัดวงจร ไม่มีไฟมาที่สวิตช์ไฟ 2 ตัว',
      status: 'Power Tripped',
      recommendedActionEn:
        'Inspect electrical circuit for short, resolve cause, and reset breaker / replace switch if needed.',
      recommendedActionTh:
        'ตรวจสอบจุดช็อตในระบบไฟ แก้ไขสาเหตุ และยกเบรกเกอร์กลับขึ้นหรือเปลี่ยนสวิตช์กรณีชำรุด',
      createdAt: '2026-08-18T11:55:00Z',
    },
    {
      id: 'item-6',
      category: 'LIGHTING AUDIT',
      locationZone: 'Cement Loft Area / โซนปูนเปลือย',
      title: 'Downlight Spot Check - Cement Loft Area',
      fileReference: 'IMG_3603.jpg',
      imageUrl: createSamplePhotoSvg('Downlight Spot Inspection', '#1e293b', '#fbbf24'),
      observationEn:
        'Visual inspection of recessed downlight fixture and bulb functionality in cement/loft styled wall zone. Fixtures clean and stable.',
      observationTh:
        'ตรวจเช็กหลอดไฟดาวน์ไลท์ฮาโลเจน/LED ฝังฝ้า บริเวณโซนผนังปูนเปลือย สภาพโคมและหลอดไฟทำงานได้ตามปกติ',
      status: 'Normal',
      recommendedActionEn: 'No corrective action needed. Normal operating condition.',
      recommendedActionTh: 'ปกติ ตรวจแล้วผ่าน ไม่จำเป็นต้องดำเนินการเพิ่มเติม',
      createdAt: '2026-08-18T12:15:00Z',
    },
    {
      id: 'item-7',
      category: 'LIGHTING AUDIT',
      locationZone: 'Master Bedroom & Bedroom 2 Toilet',
      title: 'Bedroom Lighting & Switch Test',
      fileReference: 'IMG_3607.jpg',
      imageUrl: createSamplePhotoSvg('Bedroom Lighting Test', '#241a3d', '#a78bfa'),
      observationEn:
        'Ceiling recessed downlight functional test and curtain ambient lighting circuit evaluation in master bedroom. Toilet switch unresponsive and 1 light bulb burnt out downstairs.',
      observationTh:
        'ตรวจสอบการทำงานของหลอดไฟดาวน์ไลท์บนเพดานห้องนอน รวมถึงสวิตช์ควบคุมไฟบรรยากาศผ้าม่านและหัวเตียง ตรวจพบสวิตช์ห้องน้ำไม่ทำงาน และหลอดไฟห้องน้ำชั้นล่างเสีย',
      status: 'Requires Swap',
      recommendedActionEn:
        'Replace 1-gang and 2-gang Tuya Zigbee switches and burnt-out downlight bulb.',
      recommendedActionTh:
        'เปลี่ยนสวิตช์ Zigbee ตัวใหม่ และเปลี่ยนหลอดไฟที่ขาด',
      createdAt: '2026-08-18T12:40:00Z',
    },
  ],
  quotation: {
    refNo: 'PTL-QT-2026-089',
    date: '19 Aug 2026',
    inspectionRef: 'PTL-2026-004',
    validity: '15 Days (Until 03 Sep 2026)',
    paymentTerm: '50% Deposit, 50% On Completion',
    hardwareItems: [
      {
        item: 1,
        descriptionEn: 'Xiaomi Redmi Pad SE 8.7" / 9.7" Wi-Fi',
        descriptionTh: 'Primary smart home wall-mounted display control tablet (แท็บเล็ตหน้าจอควบคุมระบบ Smart Home หลักประจำบ้าน)',
        qty: 1,
        unit: 'Unit',
        unitPrice: 4999.0,
        amount: 4999.0,
      },
      {
        item: 2,
        descriptionEn: 'Fully Kiosk Browser Single Device License',
        descriptionTh: 'Software license for locking display in Kiosk Mode for Smart Home Dashboard (ลิขสิทธิ์ซอฟต์แวร์ล็อกหน้าจอ Kiosk Mode)',
        qty: 1,
        unit: 'License',
        unitPrice: 390.0,
        amount: 390.0,
      },
      {
        item: 3,
        descriptionEn: 'Tuya Zigbee Smart Switch 1-Gang',
        descriptionTh: '1-gang smart light switch for Kitchen and Bedroom 4 (สวิตช์ไฟอัจฉริยะแบบ 1 ปุ่ม สำหรับ Kitchen และ Bedroom 4)',
        qty: 2,
        unit: 'Units',
        unitPrice: 449.0,
        amount: 898.0,
      },
      {
        item: 4,
        descriptionEn: 'Tuya Zigbee Smart Switch 2-Gang',
        descriptionTh: '2-gang smart light switch for Toilet Bedroom 4 (สวิตช์ไฟอัจฉริยะแบบ 2 ปุ่ม สำหรับ Toilet Bedroom 4)',
        qty: 1,
        unit: 'Unit',
        unitPrice: 479.0,
        amount: 479.0,
      },
      {
        item: 5,
        descriptionEn: 'UGREEN 5V 2A USB Wall Charger (Original)',
        descriptionTh: 'Standard continuous power adapter for tablet docking and control units (หัวชาร์จไฟมาตรฐานจ่ายไฟต่อเนื่อง)',
        qty: 3,
        unit: 'Units',
        unitPrice: 324.0,
        amount: 972.0,
      },
    ],
    serviceItems: [
      {
        item: 1,
        description: 'Electrical Circuit Fault Finding & Staircase Audit',
        detail: 'งานช่างเทคนิคไฟฟ้าเปิดแผงตรวจเช็กจุดลัดวงจร / ไฟตัดเบรกเกอร์ บริเวณทางขึ้นชั้น 2 และทดสอบสถานะสวิตช์สมาร์ทเดิม',
        estimatedSchedule: '29-08-2026 (13:00 - 17:00 น.)',
        qty: '1 Job',
        amount: 2500.0,
      },
      {
        item: 2,
        description: 'Smart Home Dashboard & Network Re-configuration Service',
        detail: 'ตรวจเช็กแก้ไขปัญหา Entity Not Found, Re-index Wi-Fi/IP Address, ลิงก์ระบบสวิตช์ไฟใหม่ และคอนฟิกหน้าจอ Tablet Dashboard ทั้งหมด',
        estimatedSchedule: '30-08-2026 (10:00 - 17:00 น.)',
        qty: '1 Job',
        amount: 3500.0,
      },
    ],
    procurementFeeRate: 0.15,
    terms: [
      'รับประกันงานติดตั้งและ Re-configuration ระบบ Smart Home เป็นเวลา 30 วัน',
      'อุปกรณ์เปลี่ยนใหม่รับประกันตามเงื่อนไขศูนย์/ผู้ผลิต 1 ปี',
      'ราคานี้ยังไม่รวมกรณีต้องเดินสายไฟเมนใหม่เพิ่มเติมภายนอกเหนือจากจุดตรวจเช็ก',
    ],
    contingencies: [
      'จุด Toilet Bedroom 2: ตรวจเชกระบบเดิมก่อน หากแก้ไม่ได้ ประเมินซื้อสวิตช์ Tuya Zigbee 1-Gang เพิ่มเติม 1 ตัว (~516.35 THB รวมค่าจัดหา)',
      'จุดทางขึ้นชั้น 2 (2 สวิตช์): ตรวจสอบระบบไฟช็อต/เบรกเกอร์ก่อน หากแก้ไขไฟแล้วพบว่าสวิตช์เดิมเสีย ประเมินซื้อสวิตช์เปลี่ยนใหม่ 2 ตัว (~1,032.70 THB รวมค่าจัดหา)',
    ],
  },
};

export const sampleJobRobertMiller: InspectionJob = {
  id: 'PTL-INSP-20260903-002',
  clientId: 'CL-MILLER-002',
  villaName: 'Baan Bua Villa 12, Nai Harn',
  customerName: 'Robert Miller',
  customerGroup: 'expat',
  propertyLocation: 'Baan Bua Estate, Nai Harn Beach, Rawai, Phuket',
  serviceType: 'HVAC Aircon & Pool Pump Noise Audit',
  status: 'Inspection',
  inspectionDate: '03 Sep 2026 (13:30 น.)',
  createdAt: '2026-09-03T13:30:00Z',
  inspector: 'Mr. Big & Field Technicians',
  documentRef: 'site_inspection_naiharn_v1.pdf',
  driveFolderUrl: 'https://drive.google.com/drive/folders/1PTL-RobertMiller-NaiHarn',
  notes: 'Client retired in Phuket. Urgent inspection on pool pump vibration noise and Master Bedroom AC cooling failure.',
  items: [
    {
      id: 'item-miller-1',
      category: 'POOL SYSTEM & PUMP',
      locationZone: 'Pool Pump Room',
      title: 'Pool Booster Pump Bearing Vibration & Noise',
      fileReference: 'IMG_4102.jpg',
      imageUrl: createSamplePhotoSvg('Pool Pump Bearing Diagnostic', '#0f291e', '#34d399'),
      observationEn: 'Hayward 1.5HP Pool Pump exhibits high-pitch metallic screeching (>78dB). Bearing seal degraded with minor chemical salt crusting.',
      observationTh: 'ปั๊มน้ำสระว่ายน้ำ Hayward 1.5HP มีเสียงแบริ่งดังเสียดสีรุนแรง (>78dB) ลูกปืนเริ่มติดขัดและมีคราบตะกรันเกลือคลอรีนเกาะ',
      status: 'Requires Swap',
      recommendedActionEn: 'Replace primary NSK sealed bearings, mechanical shaft seal, and re-prime filtration circuit.',
      recommendedActionTh: 'เปลี่ยนชุดลูกปืนแบริ่ง NSK และแมคคานิคอลซีลกันน้ำ พร้อมทดสอบแรงดันระบบกรองทราย',
      createdAt: '2026-09-03T13:45:00Z',
    },
    {
      id: 'item-miller-2',
      category: 'AIR CONDITIONING',
      locationZone: 'Master Suite Upper Level',
      title: 'Daikin Inverter 24,000 BTU Capacitor & Coil Check',
      fileReference: 'IMG_4105.jpg',
      imageUrl: createSamplePhotoSvg('Master AC Coil Diagnostic', '#172554', '#60a5fa'),
      observationEn: 'Compressor outdoor fan fails to spin under load. Compressor thermistor cuts off after 4 minutes due to thermal buildup.',
      observationTh: 'พัดลมคอยล์ร้อนไม่หมุนเมื่อคอมเพรสเซอร์เริ่มทำงาน ทำให้ระบบตัดการทำงานหลังเปิด 4 นาทีเนื่องจากความร้อนสะสม',
      status: 'Critical Swap',
      recommendedActionEn: 'Replace 40uF fan run capacitor and clean external aluminum fins with high-pressure coil foam.',
      recommendedActionTh: 'เปลี่ยนแคปรันพัดลม 40uF และล้างทำความสะอาดแผงรังผึ้งระบายความร้อนด้วยโฟมล้างคอยล์แอร์',
      createdAt: '2026-09-03T14:15:00Z',
    },
  ],
  quotation: {
    refNo: 'PTL-QT-2026-088',
    date: '03 Sep 2026',
    inspectionRef: 'PTL-INSP-20260903-002',
    validity: '15 Days',
    paymentTerm: '50% Deposit, 50% On Completion',
    hardwareItems: [
      {
        item: 1,
        descriptionEn: 'NSK Sealed Heavy Duty Ball Bearings (Set of 2)',
        descriptionTh: 'ตลับลูกปืนแบริ่งรอบจัดสำหรับปั๊มน้ำสระว่ายน้ำ (ชุด 2 ตลับ)',
        qty: 1,
        unit: 'Set',
        unitPrice: 750,
        amount: 750,
        sourcingChannel: 'Phuket Bearing & Machine Supply',
      },
      {
        item: 2,
        descriptionEn: 'Hayward Ceramic Mechanical Shaft Seal 5/8 Inch',
        descriptionTh: 'แมคคานิคอลซีลเซรามิกกันน้ำรั่วเพลาปั๊มสระ',
        qty: 1,
        unit: 'Pcs',
        unitPrice: 850,
        amount: 850,
        sourcingChannel: 'Pool Pro & Chemicals Phuket',
      },
      {
        item: 3,
        descriptionEn: 'Daikin 40uF Dual Motor Run Capacitor',
        descriptionTh: 'คาปาซิเตอร์พัดลมและคอมเพรสเซอร์แอร์ 40uF',
        qty: 1,
        unit: 'Pcs',
        unitPrice: 580,
        amount: 580,
        sourcingChannel: 'Amorn Electronics Phuket',
      },
    ],
    serviceItems: [
      {
        item: 1,
        description: 'Pool Pump Motor Overhaul & Shaft Seal Installation Labor',
        detail: 'งานถอดโอเวอร์ฮอลล์มอเตอร์ปั๊มน้ำสระ เปลี่ยนลูกปืน แวคคั่มและประกอบทดสอบแรงดันน้ำ',
        estimatedSchedule: '04-09-2026 (09:00 - 12:00 น.)',
        qty: '1 Job',
        amount: 2200,
      },
      {
        item: 2,
        description: 'AC Capacitor Replacement & High Pressure Chemical Coil Wash',
        detail: 'เปลี่ยนแคปรันแอร์ และบริการล้างอัดฉีดคอยล์ร้อน-คอยล์เย็นห้องนอนใหญ่',
        estimatedSchedule: '04-09-2026 (13:00 - 15:30 น.)',
        qty: '1 Job',
        amount: 1400,
      },
    ],
    procurementFeeRate: 0.15,
    terms: [
      'รับประกันงานติดตั้งและซ่อมบำรุง 30 วัน',
      'อะไหล่แท้รับประกันตามเงื่อนไขผู้จัดจำหน่าย',
    ],
    contingencies: [
      'หากขดลวดมอเตอร์ปั๊มน้ำสระเกิดการไหม้สะสม จะแจ้งราคาประเมินพันคอยล์ใหม่หรือเปลี่ยนมอเตอร์ก่อนดำเนินการ',
    ],
  },
};

export const sampleJobElenaPatong: InspectionJob = {
  id: 'PTL-INSP-20260903-003',
  clientId: 'CL-ELENA-003',
  villaName: 'The Deck Condominium, Patong',
  customerName: 'Elena Rostova',
  customerGroup: 'rental_investor',
  propertyLocation: 'The Deck Patong Penthouse, Kathu District, Phuket',
  serviceType: 'Digital Door Lock & Water Heater Incident Response',
  status: 'Completed',
  inspectionDate: '03 Sep 2026 (16:30 น.)',
  createdAt: '2026-09-03T16:30:00Z',
  inspector: 'Mr. Big & Field Technicians',
  documentRef: 'site_inspection_deck_patong_v1.pdf',
  driveFolderUrl: 'https://drive.google.com/drive/folders/1PTL-Elena-Patong-Evidence',
  notes: 'Airbnb Superhost. Guests arriving tomorrow 14:00. Urgent lock passcode resetting and water heater temperature check.',
  items: [
    {
      id: 'item-elena-1',
      category: 'SECURITY & ACCESS CONTROL',
      locationZone: 'Main Suite Entry Door',
      title: 'Digital Door Lock Keypad & Mortise Solenoid Check',
      fileReference: 'IMG_4119.jpg',
      imageUrl: createSamplePhotoSvg('Digital Lock Audit', '#2e1065', '#a855f7'),
      observationEn: 'Yale Digital Smart Lock battery low indicator active. Solenoid latch binds against door frame strike plate.',
      observationTh: 'กลอนประตูดิจิทัล Yale แจ้งเตือนแบตเตอรี่อ่อน และเดือยล็อกขัดกับเบ้าวงกบประตู ปิดแล้วล็อกอัตโนมัติไม่สนิท',
      status: 'Requires Swap',
      recommendedActionEn: 'Realign strike plate with 2mm offset, replace 8x AA Panasonic Eneloop batteries and update guest master passcode.',
      recommendedActionTh: 'ปรับตั้งระยะเบ้ารับเดือยล็อกวงกบใหม่ และเปลี่ยนถ่านอัลคาไลน์ AA พร้อมเซ็ตพาสโค้ดชุดใหม่ให้แขก',
      createdAt: '2026-09-03T16:45:00Z',
    },
  ],
  quotation: {
    refNo: 'PTL-QT-2026-091',
    date: '03 Sep 2026',
    inspectionRef: 'PTL-INSP-20260903-003',
    validity: '15 Days',
    paymentTerm: '100% Upon Completion',
    hardwareItems: [
      {
        item: 1,
        descriptionEn: 'Panasonic Alkaline AA Heavy Duty Batteries (Pack of 8)',
        descriptionTh: 'ถ่านอัลคาไลน์ Panasonic AA คุณภาพสูงสำหรับกลอนดิจิทัล (แพ็ก 8 ก้อน)',
        qty: 1,
        unit: 'Pack',
        unitPrice: 280,
        amount: 280,
        sourcingChannel: '7-Eleven / HomePro Patong',
      },
    ],
    serviceItems: [
      {
        item: 1,
        description: 'Urgent Digital Lock Strike Re-alignment & Passcode Programming',
        detail: 'งานบริการด่วนปรับระดับเบ้าล็อกวงกบ ขัดแต่งเดือย และคอนฟิกรหัสล็อกเพื่อรองรับแขกเช็คอิน',
        estimatedSchedule: 'Same Day Completed',
        qty: '1 Job',
        amount: 1200,
      },
    ],
    procurementFeeRate: 0.15,
    terms: ['รับประกันการทำงานของกลอนดิจิทัล 30 วัน'],
    contingencies: [],
  },
};

export const sampleJobBowCCTV: InspectionJob = {
  id: 'PTL-INSP-20260915-BOW',
  clientId: 'CL-BOW-001',
  villaName: 'Private Residence (คุณโบว์)',
  customerName: 'คุณโบว์ (K. Bow)',
  customerGroup: 'villa_owner',
  propertyLocation: 'Phuket, Thailand',
  serviceType: 'Outdoor Wi-Fi Security Camera Installation (CCTV)',
  status: 'Quoted',
  inspectionDate: '15 Sep 2026',
  createdAt: '2026-09-15T10:20:00.000Z',
  inspector: 'Mr. Big & Molly (PTL Tech & Sourcing)',
  documentRef: 'site_inspection_20260915_bow.pdf Attachment',
  driveFolderUrl: 'https://drive.google.com/drive/folders/1PTL-Bow-Phuket-CCTV-Evidence',
  notes: 'ติดตั้งกล้องวงจรปิดภายนอกอาคาร TP-Link Tapo C320WS 4MP 2K QHD พร้อมการ์ด MicroSD 128GB High Endurance สำหรับบันทึกภาพย้อนหลัง 24 ชม. และเชื่อมต่อแอปพลิเคชัน',
  items: [
    {
      id: 'item-bow-1',
      category: 'SECURITY & CCTV SURVEILLANCE',
      locationZone: 'Outdoor Perimeter / จุดติดตั้งกล้องภายนอก',
      title: 'Outdoor Security Wi-Fi Camera Installation Point',
      fileReference: 'IMG_4226.png',
      imageUrl: createSamplePhotoSvg('Outdoor CCTV 4MP Tapo C320WS', '#0f294a', '#38bdf8'),
      observationEn:
        'Target location for outdoor Wi-Fi security camera verified. Power supply point and 2.4GHz Wi-Fi signal coverage inspected and confirmed ready.',
      observationTh:
        'ตรวจสอบจุดติดตั้งกล้องวงจรปิด Wi-Fi ภายนอกอาคาร พบจุดจ่ายไฟและระยะครอบคลุมสัญญาณ Wi-Fi 2.4GHz มีความพร้อมสำหรับการติดตั้ง',
      status: 'Normal',
      recommendedActionEn:
        'Install TP-Link Tapo C320WS 4MP 2K QHD camera with 128GB High Endurance MicroSD, configure waterproof junction box and Tapo mobile app.',
      recommendedActionTh:
        'จัดหาและติดตั้งกล้องวงจรปิด TP-Link Tapo C320WS 4MP 2K QHD พร้อมเมมโมรี่ 128GB บันทึกภาพ 24 ชม. และเซ็ตอัปแอปพลิเคชันบนมือถือ',
      createdAt: '2026-09-15T10:20:00.000Z',
    },
  ],
  quotation: {
    refNo: 'PTL-QT-2026-008',
    invoiceNo: 'PTL-INV-2026-008',
    date: '15 Sep 2026',
    invoiceDate: '15 Sep 2026',
    dueDate: '30 Sep 2026',
    inspectionRef: 'PTL-INSP-20260915-BOW',
    validity: '15 Days (ถึง 30 ก.ย. 2026)',
    paymentTerm: '50% มัดจำเริ่มงาน (1,545 THB) / 50% ชำระวันส่งมอบงาน (1,545 THB)',
    hardwareItems: [
      {
        item: 1,
        descriptionEn:
          'TP-Link Tapo C320WS 4MP 2K QHD Outdoor Wi-Fi Security Camera + 128GB High Endurance MicroSD Card (Complete Set)',
        descriptionTh:
          'ชุดกล้องวงจรปิด Wi-Fi ภายนอกอาคาร 4MP 2K QHD (Tapo C320WS) กันน้ำกันฝุ่น IP66 พร้อมเมมโมรี่การ์ด 128GB High Endurance (ชุดพร้อมติดตั้ง)',
        qty: 1,
        unit: 'ชุด (Set)',
        unitPrice: 2390,
        amount: 2390,
        sourcingChannel: 'Authorized TP-Link Thailand Official Distributor (รับประกันศูนย์แท้ 1 ปี)',
      },
    ],
    serviceItems: [
      {
        item: 1,
        description: 'Outdoor CCTV Mounting, Cabling, Power Connection & Tapo App Setup',
        detail:
          'งานบริการช่างเทคนิค: ยึดผนังภายนอกอาคาร เดินสายไฟจ่ายไฟเลี้ยงกล้อง เชื่อมต่อ Wi-Fi และเซ็ตอัปแอปพลิเคชัน Tapo บนมือถือให้ลูกค้า',
        estimatedSchedule: 'ภายใน 1 วันทำการ (พร้อมเข้าติดตั้งทันทีเมื่ออุปกรณ์จัดส่งถึง)',
        qty: '1 จุด (Point)',
        amount: 700,
      },
    ],
    procurementFeeRate: 0,
    terms: [
      'อุปกรณ์กล้องวงจรปิด TP-Link รับประกันศูนย์แท้ 1 ปีเต็ม (เคลมผ่านตัวแทนจำหน่ายทางการ)',
      'รับประกันงานติดตั้งระบบสายไฟและการเชื่อมต่อสัญญาณโดย Phuket Trusted Local 30 วัน',
      'ราคารวมเมมโมรี่การ์ด 128GB บันทึกภาพ 24 ชม. แบบวนซ้ำ (ไม่ต้องจ่ายค่า Cloud รายเดือน)',
      'ทีมงานติดตั้งพร้อมสอนการใช้งานแอปพลิเคชัน Tapo และการแชร์ดูภาพผ่านมือถือให้คุณโบว์เรียบร้อย',
    ],
    contingencies: [
      'กรณีต้องการเดินท่อร้อยสายไฟระยะยาวเกิน 5 เมตร หรือเพิ่มจุดปลั๊กไฟกันน้ำภายนอก จะแจ้งประเมินหน้างานจริงก่อนดำเนินการ',
    ],
    mollyNotes:
      'มอลลี่คำนวณเปรียบเทียบราคาให้แล้วค่ะ! ต้นทุนสั่งซื้อ Shopee Mc winner อยู่ที่ 1,909 บาท (รวมกล้อง Tapo C320WS 4MP + การ์ด 128GB) มอลลี่ตั้งราคากลางตลาดมาตรฐานหน้าร้านไว้ที่ 2,390 บาท ทำให้มีกำไรส่วนต่างอะไหล่ 481 บาท เมื่อรวมกับค่าแรงติดตั้งช่างเทคนิค 700 บาท ยอดรวมใบเสนอราคาจะอยู่ที่ 3,090 บาทถ้วน มัดจำเริ่มงาน 50% (1,545 บาท) เป็นราคาที่แข่งขันได้ ลูกค้ารู้สึกคุ้มค่าและได้มาตรฐานงานช่าง PTL ค่ะ',
    bankName: 'Kasikornbank (ธนาคารกสิกรไทย)',
    bankAccountNo: '184-1-88992-0',
    bankAccountName: 'Phuket Trusted Local Co., Ltd.',
    promptPayId: '081-999-8877',
    depositPercent: 50,
    separateTermsPage: false,
  },
};

export const defaultDayJobs: InspectionJob[] = [
  sampleJobBowCCTV,
  sampleJobKMazen,
  sampleJobRobertMiller,
  sampleJobElenaPatong,
];

export const sampleCustomerPresets = [
  {
    group: 'villa_owner' as const,
    name: 'คุณโบว์ (K. Bow)',
    location: 'Private Residence, Phuket',
    service: 'Outdoor Wi-Fi Security Camera Installation (CCTV)',
    label: 'คุณโบว์: ติดตั้งกล้องวงจรปิด Wi-Fi ภายนอก (Tapo C320WS + 128GB)',
  },
  {
    group: 'villa_owner' as const,
    name: 'K. Mazen',
    location: 'Green Mile Villa, Kathu, Phuket',
    service: 'Smart Home & Electrical Rectification',
    label: 'กลุ่มที่ 2: เจ้าของวิลล่าต่างประเทศ (K. Mazen - Kathu)',
  },
  {
    group: 'expat' as const,
    name: 'Robert Miller',
    location: 'Baan Bua Villa 12, Nai Harn, Phuket',
    service: 'HVAC Aircon Breakdown & Pool Pump Noise Audit',
    label: 'กลุ่มที่ 1: Expat ผู้เกษียณในภูเก็ต (Robert M. - Nai Harn)',
  },
  {
    group: 'rental_investor' as const,
    name: 'Elena Rostova (Airbnb Superhost)',
    location: 'The Deck Condominium, Patong, Phuket',
    service: 'Digital Door Lock & Water Heater Incident Response',
    label: 'กลุ่มที่ 3: เจ้าของ Airbnb / ผู้ปล่อยเช่า (Elena R. - Patong)',
  },
];
