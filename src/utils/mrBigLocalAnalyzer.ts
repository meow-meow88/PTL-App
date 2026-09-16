import { FindingStatus } from '../types';

export function translateZoneToEnglish(zone: string): string {
  const raw = (zone || '').trim();
  if (!raw || raw === 'หน้างาน' || raw === 'พื้นที่หน้างาน' || raw === 'ทั่วไป' || raw === 'วิลล่า' || raw === 'general' || raw === 'site') {
    return 'inspected villa area';
  }

  const z = raw.toLowerCase();

  // 1. Compound & multi-keyword location detection (handles mixed Thai/English like "ไฟ step light + tree light main entrance area")
  const hasStep = z.includes('step light') || z.includes('step-light') || z.includes('ขั้นบันได') || z.includes('บันได') || z.includes('stair');
  const hasTree = z.includes('tree light') || z.includes('tree-light') || z.includes('ส่องต้นไม้') || z.includes('ต้นไม้') || z.includes('tree');
  const hasMainEntrance = z.includes('main entrance') || z.includes('ทางเข้าหลัก') || (z.includes('main') && z.includes('entrance'));
  const hasOutsideEntrance = z.includes('outside entrance') || z.includes('ทางเข้าด้านนอก') || (z.includes('outside') && z.includes('entrance'));
  const hasFrontEntrance = z.includes('front entrance') || z.includes('ทางเข้าหน้าบ้าน') || (z.includes('front') && z.includes('entrance'));
  const hasEntrance = hasMainEntrance || hasOutsideEntrance || hasFrontEntrance || z.includes('entrance') || z.includes('ทางเข้า') || z.includes('หน้าบ้าน');

  if (hasStep && hasTree && hasEntrance) {
    return 'main entrance area step lights and tree uplights';
  }
  if (hasStep && hasTree) {
    return 'exterior step lights and tree uplights';
  }
  if (hasStep && hasEntrance) {
    return 'main entrance step lighting';
  }
  if (hasTree && hasEntrance) {
    return 'main entrance tree uplighting';
  }
  if (hasStep) {
    return 'step lighting area';
  }
  if (hasTree) {
    return 'tree uplighting area';
  }

  // Entrance & outdoor specific
  if (hasMainEntrance) return 'main entrance area';
  if (hasOutsideEntrance) return 'outside entrance area';
  if (hasFrontEntrance) return 'front entrance / yard';
  if (z.includes('สวนหน้าบ้าน')) return 'outside front garden';
  if (z.includes('สวนหลังบ้าน')) return 'rear garden';
  if (z.includes('สวนข้างบ้าน') || z.includes('ข้างบ้าน')) return 'side garden / pathway';
  if (z.includes('สวน') || z.includes('garden')) return 'outside garden area';
  if (z.includes('สระว่ายน้ำ') || z.includes('ริมสระ') || z.includes('pool')) return 'swimming pool area';
  if (z.includes('ดาดฟ้า') || z.includes('rooftop')) return 'rooftop terrace';
  if (z.includes('ระเบียง') || z.includes('balcony') || z.includes('terrace')) return 'balcony / terrace';
  if (z.includes('ที่จอดรถ') || z.includes('โรงรถ') || z.includes('carport') || z.includes('garage')) return 'carport / parking area';
  if (z.includes('ทางเดินเข้าห้องน้ำชั้นล่าง')) return 'ground floor bathroom corridor';
  if (z.includes('ทางเดินเข้าห้องน้ำชั้นบน')) return 'upper floor bathroom corridor';
  if (z.includes('ทางเดินเข้าห้องน้ำ')) return 'bathroom corridor';
  if (z.includes('ทางเดิน') || z.includes('corridor') || z.includes('hallway') || z.includes('walkway')) return 'corridor / walkway';
  if (z.includes('ห้องน้ำชั้นล่าง')) return 'ground floor bathroom';
  if (z.includes('ห้องน้ำชั้นบน')) return 'upper floor bathroom';
  if (z.includes('ห้องน้ำ 1')) return 'bathroom 1';
  if (z.includes('ห้องน้ำ 2')) return 'bathroom 2';
  if (z.includes('ห้องน้ำ') || z.includes('toilet') || z.includes('bathroom')) return 'bathroom';
  if (z.includes('ตู้ไฟ mdb') || z.includes('ตู้ไฟ') || z.includes('mdb') || z.includes('แผงไฟ') || z.includes('เบรกเกอร์')) return 'Main Distribution Board (MDB)';
  if (z.includes('โต๊ะทำงาน') || z.includes('desk') || z.includes('workstation')) return 'workstation / desk area';
  if (z.includes('ห้องนอนใหญ่') || z.includes('master')) return 'master bedroom';
  if (z.includes('ห้องนอน 1')) return 'bedroom 1';
  if (z.includes('ห้องนอน 2')) return 'bedroom 2';
  if (z.includes('ห้องนอน 3')) return 'bedroom 3';
  if (z.includes('ห้องนอน 4')) return 'bedroom 4';
  if (z.includes('ห้องนอน') || z.includes('bedroom')) return 'bedroom';
  if (z.includes('ห้องนั่งเล่น') || z.includes('living')) return 'living room';
  if (z.includes('ห้องรับแขก')) return 'guest reception hall';
  if (z.includes('ห้องครัว') || z.includes('kitchen')) return 'kitchen area';
  if (z.includes('ห้องรับประทานอาหาร') || z.includes('dining')) return 'dining area';
  if (z.includes('ลานซักล้าง') || z.includes('ซักล้าง') || z.includes('laundry')) return 'laundry & utility area';
  if (z.includes('ห้องเก็บของ') || z.includes('storage')) return 'storage room';
  if (z.includes('ห้องแม่บ้าน') || z.includes('maid')) return 'maid quarters';
  if (z.includes('ห้องปั๊ม') || z.includes('ห้องเครื่อง') || z.includes('pump')) return 'pump & machine room';
  if (z.includes('ประตูรั้ว') || z.includes('รั้ว') || z.includes('gate')) return 'main gate & entrance';
  if (z.includes('หน้าบ้าน')) return 'front entrance / yard';
  if (z.includes('หลังบ้าน')) return 'rear perimeter';
  if (z.includes('รอบบ้าน') || z.includes('ภายนอก') || z.includes('outdoor')) return 'outdoor exterior perimeter';

  // If the user wrote an English phrase (or mixed English with some Thai words like "ไฟ"),
  // strip Thai characters and clean up punctuation/symbols to keep the English words cleanly!
  const cleanedEn = raw
    .replace(/[\u0E00-\u0E7F]+/g, ' ')
    .replace(/[+&/]+/g, ' & ')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleanedEn.length >= 3) {
    return cleanedEn;
  }

  return 'designated inspection zone';
}

export function translateZoneToThai(zone: string): string {
  const raw = (zone || '').trim();
  if (!raw || raw === 'หน้างาน' || raw === 'พื้นที่หน้างาน' || raw === 'ทั่วไป' || raw === 'วิลล่า' || raw === 'general' || raw === 'site') {
    return 'พื้นที่หน้างาน';
  }

  const z = raw.toLowerCase();

  // Compound & multi-keyword location detection
  const hasStep = z.includes('step light') || z.includes('step-light') || z.includes('ขั้นบันได') || z.includes('บันได') || z.includes('stair');
  const hasTree = z.includes('tree light') || z.includes('tree-light') || z.includes('ส่องต้นไม้') || z.includes('ต้นไม้') || z.includes('tree');
  const hasMainEntrance = z.includes('main entrance') || z.includes('ทางเข้าหลัก') || (z.includes('main') && z.includes('entrance'));
  const hasOutsideEntrance = z.includes('outside entrance') || z.includes('ทางเข้าด้านนอก') || (z.includes('outside') && z.includes('entrance'));
  const hasFrontEntrance = z.includes('front entrance') || z.includes('ทางเข้าหน้าบ้าน') || (z.includes('front') && z.includes('entrance'));
  const hasEntrance = hasMainEntrance || hasOutsideEntrance || hasFrontEntrance || z.includes('entrance') || z.includes('ทางเข้า') || z.includes('หน้าบ้าน');

  if (hasStep && hasTree && hasEntrance) {
    return 'ไฟส่องขั้นบันได (Step Light) และไฟส่องต้นไม้ (Tree Light) บริเวณทางเข้าหลัก (Main Entrance Area)';
  }
  if (hasStep && hasTree) {
    return 'ไฟส่องขั้นบันได (Step Light) และไฟส่องต้นไม้ (Tree Light)';
  }
  if (hasStep && hasEntrance) {
    return 'ไฟส่องขั้นบันได (Step Light) บริเวณทางเข้าหลัก';
  }
  if (hasTree && hasEntrance) {
    return 'ไฟส่องต้นไม้ (Tree Light) บริเวณทางเข้าหลัก';
  }
  if (hasStep) {
    return 'ไฟส่องขั้นบันได (Step Light)';
  }
  if (hasTree) {
    return 'ไฟส่องต้นไม้ (Tree Light)';
  }

  if (hasMainEntrance) return 'บริเวณทางเข้าหลัก (Main Entrance Area)';
  if (hasOutsideEntrance) return 'ทางเข้าด้านนอก (Outside Entrance)';
  if (hasFrontEntrance) return 'ทางเข้าหน้าบ้าน (Front Entrance)';
  if (z.includes('entrance') || z.includes('ทางเข้า')) return 'บริเวณทางเข้า (Entrance)';
  if (z.includes('outside garden') || (z.includes('garden') && z.includes('outside'))) return 'สวนภายนอก (Outside Garden)';
  if (z.includes('สวนหน้าบ้าน')) return 'สวนหน้าบ้าน (Front Garden)';
  if (z.includes('สวนหลังบ้าน') || z.includes('back garden')) return 'สวนหลังบ้าน (Back Garden)';
  if (z.includes('สวนข้างบ้าน') || z.includes('side garden')) return 'สวนข้างบ้าน (Side Garden)';
  if (z.includes('garden') || z.includes('สวน')) return 'บริเวณสวน (Garden)';
  if (z.includes('swimming pool') || z.includes('pool') || z.includes('สระว่ายน้ำ')) return 'บริเวณสระว่ายน้ำ (Swimming Pool)';
  if (z.includes('living room') || z.includes('living') || z.includes('ห้องนั่งเล่น')) return 'ห้องนั่งเล่น (Living Room)';
  if (z.includes('master bedroom') || z.includes('master') || z.includes('ห้องนอนใหญ่')) return 'ห้องนอนใหญ่ (Master Bedroom)';
  if (z.includes('bedroom') || z.includes('ห้องนอน')) return 'ห้องนอน (Bedroom)';
  if (z.includes('kitchen') || z.includes('ห้องครัว')) return 'ห้องครัว (Kitchen)';
  if (z.includes('bathroom') || z.includes('toilet') || z.includes('ห้องน้ำ')) return 'ห้องน้ำ (Bathroom)';
  if (z.includes('corridor') || z.includes('hallway') || z.includes('ทางเดิน') || z.includes('โถงทางเดิน')) return 'โถงทางเดิน (Corridor)';
  if (z.includes('balcony') || z.includes('terrace') || z.includes('ระเบียง')) return 'ระเบียง (Balcony/Terrace)';
  if (z.includes('carport') || z.includes('garage') || z.includes('ที่จอดรถ') || z.includes('โรงรถ')) return 'โรงจอดรถ (Carport)';
  if (z.includes('main distribution board') || z.includes('mdb') || z.includes('ตู้ไฟ')) return 'ตู้ควบคุมไฟฟ้าหลัก (MDB)';

  return raw;
}

export function isNormalText(text: string): boolean {
  const t = (text || '').toLowerCase().trim();
  if (!t) return false;

  const normalPhrases = [
    'ทำงานได้ตามปกติ',
    'ทำงานได้ปกติ',
    'ทำงานตามปกติ',
    'ทำงานปกติ',
    'ใช้งานได้ตามปกติ',
    'ใช้งานได้ปกติ',
    'ใช้ได้ตามปกติ',
    'ใช้ได้ปกติ',
    'ใช้งานได้ดี',
    'เปิดใช้งานได้ตามปกติ',
    'เปิดใช้งานได้ปกติ',
    'เปิดติดปกติ',
    'เปิดได้ปกติ',
    'ไฟติดปกติ',
    'น้ำไหลปกติ',
    'สภาพปกติ',
    'ตามปกติ',
    'ไม่มีปัญหา',
    'ไม่พบปัญหา',
    'ผ่านเกณฑ์',
    'เรียบร้อยดี',
    'สมบูรณ์ดี',
    'สมบูรณ์',
    'ไม่มีข้อบกพร่อง',
    'ไม่ชำรุด',
    'ไม่เสีย',
    'ไม่พัง',
    'ไม่มีการลัดวงจร',
    'ไม่ลัดวงจร',
    'ไม่มีการช๊อต',
    'ไม่มีการช็อต',
    'ไม่ช๊อต',
    'ไม่ช็อต',
    'ไม่มีช๊อต',
    'ไม่มีช็อต',
    'ไม่มีไฟช็อต',
    'ไม่มีไฟช๊อต',
    'ไม่ทริป',
    'ไม่ตัด',
    'ไม่รั่ว',
    'ไม่มีไฟรั่ว',
    'ไม่ซึม',
    'ไม่มีน้ำรั่ว',
    'ไม่ติดขัด',
    'ไม่ฝืด',
    'ปกติ',
    'normal',
    'working fine',
    'working properly',
    'operational',
    'functional',
    'in good order',
    'good condition',
  ];

  const hasPositive = normalPhrases.some((phrase) => t.includes(phrase));
  if (!hasPositive) return false;

  // Verify there is no genuine unnegated defect phrase
  if (
    t.includes('ไม่ปกติ') ||
    (t.includes('ชำรุด') && !t.includes('ไม่ชำรุด')) ||
    (t.includes('เสีย') && !t.includes('ไม่เสีย')) ||
    (t.includes('พัง') && !t.includes('ไม่พัง')) ||
    (t.includes('ลัดวงจร') && !t.includes('ไม่ลัดวงจร') && !t.includes('ไม่มีการลัดวงจร')) ||
    (t.includes('รั่วซึม') && !t.includes('ไม่รั่วซึม')) ||
    (t.includes('น้ำรั่ว') && !t.includes('ไม่มีน้ำรั่ว') && !t.includes('ไม่รั่ว'))
  ) {
    return false;
  }

  return true;
}

export interface MrBigAnalysisResult {
  observationEn: string;
  observationTh: string;
  recommendedActionEn: string;
  recommendedActionTh: string;
  suggestedStatus: FindingStatus;
  riskAssessment: string;
  peaceOfMindNote: string;
}

export function analyzeFindingLocally(
  findingTh: string,
  zone: string,
  category: string,
  currentStatus?: FindingStatus
): MrBigAnalysisResult {
  const text = (findingTh || '').toLowerCase().trim();
  const zoneTh = translateZoneToThai(zone || 'พื้นที่หน้างาน');
  const zoneEn = translateZoneToEnglish(zone);

  const isNormal = isNormalText(text) || currentStatus === 'Normal';

  if (isNormal) {
    // 1. MDB / Breaker / Main Electrical Panel
    if (
      text.includes('mdb') ||
      text.includes('ตู้ไฟ') ||
      text.includes('เบรกเกอร์') ||
      text.includes('แผงไฟ') ||
      text.includes('breaker') ||
      zoneTh.includes('ตู้ไฟ') ||
      zoneTh.includes('mdb')
    ) {
      return {
        observationEn: `Routine technical inspection of Main Distribution Board (MDB): All branch circuit breakers, RCBO residual current protection devices, and electrical distribution lines tested under operational load and verified operating normally. No short-circuit fault, earth leakage current, or breaker tripping detected; all safety protective mechanisms are fully functional.`,
        observationTh: `ตรวจเช็กตู้ไฟ MDB และระบบเบรกเกอร์: ทดสอบการจ่ายกระแสไฟฟ้าและโหลดวงจร ทำงานได้เป็นปกติสมบูรณ์ ไม่พบกระแสไฟฟ้ารั่ว ไม่มีการลัดวงจร และไม่มีการทริปตัดวงจร ระบบมีความปลอดภัยพร้อมใช้งาน`,
        recommendedActionEn: `No hardware replacement or electrical repair required. Maintain scheduled routine preventive inspections and ensure panel interior remains clean and moisture-sealed.`,
        recommendedActionTh: `ระบบเบรกเกอร์และตู้ไฟทำงานได้เป็นปกติ ไม่จำเป็นต้องเปลี่ยนอุปกรณ์ ให้คงรอบการตรวจเช็กและบำรุงรักษาตามระยะเวลา`,
        suggestedStatus: 'Normal',
        riskAssessment: 'No active operational or electrical hazard identified.',
        peaceOfMindNote: 'Mr. Big ตรวจสอบยืนยันความพร้อมใช้งานและความปลอดภัยของระบบไฟฟ้าตู้ไฟ MDB เพื่อความอุ่นใจสูงสุดของเจ้าของวิลล่า',
      };
    }

    // 2. Smart Home & Automation Integration / Secondary Connectivity Verification
    // Handles mixed intent: Switch/hardware operates normally with zero short-circuit, BUT smart home / gateway connectivity requires verification
    if (
      text.includes('สมาร์ทโฮม') ||
      text.includes('smart home') ||
      text.includes('automation') ||
      text.includes('เกตเวย์') ||
      text.includes('gateway') ||
      text.includes('zigbee') ||
      text.includes('tuya') ||
      text.includes('iot') ||
      (text.includes('เชื่อมต่อ') && (text.includes('ระบบ') || text.includes('แอพ') || text.includes('app') || text.includes('wifi') || text.includes('สัญญาณ')))
    ) {
      const isSwitch = text.includes('สวิตช์') || text.includes('switch') || text.includes('ไฟ');
      const isAc = text.includes('แอร์') || text.includes('air') || text.includes('ac');
      const isDoor = text.includes('ประตู') || text.includes('door') || text.includes('lock');

      let deviceEn = 'Wall lighting switch assembly and lighting circuit';
      let deviceTh = 'สวิตช์ไฟและวงจรควบคุมแสงสว่าง';
      if (isAc) {
        deviceEn = 'Air conditioning unit and climate control system';
        deviceTh = 'เครื่องปรับอากาศและระบบควบคุมความเย็น';
      } else if (isDoor) {
        deviceEn = 'Electronic door lock and access control system';
        deviceTh = 'ระบบประตูดิจิทัลและชุดควบคุมการเข้า-ออก';
      } else if (!isSwitch) {
        deviceEn = 'Electrical fixture and operating circuit';
        deviceTh = 'อุปกรณ์และวงจรไฟฟ้า';
      }

      const locSuffixEn = (zoneEn && zoneEn !== 'outside garden' && zoneEn !== 'inspected villa area' && zoneEn !== 'designated inspection zone') ? ` serving ${zoneEn}` : '';
      const locSuffixTh = (zoneTh && zoneTh !== 'พื้นที่หน้างาน' && zoneTh !== 'หน้างาน') ? ` บริเวณ${zoneTh}` : '';

      return {
        observationEn: `${deviceEn}${locSuffixEn} was operated and confirmed functioning normally under load with no electrical short-circuit or breaker trip detected. However, secondary integration and connectivity with the smart home automation system require follow-up verification and re-testing.`,
        observationTh: `เปิดทดสอบ${deviceTh}${locSuffixTh}แล้วใช้งานได้ตามปกติ ไม่พบการลัดวงจรหรือกระแสไฟชอร์ต แต่จำเป็นต้องตรวจสอบการเชื่อมต่อกับระบบสมาร์ทโฮม (Smart Home Automation System) เพิ่มเติมอีกครั้ง`,
        recommendedActionEn: `No switch or hardware replacement required. Perform follow-up technical check on smart home gateway pairing, wireless signal transmission, and automation system connectivity.`,
        recommendedActionTh: `${deviceTh}ทำงานได้เป็นปกติ ไม่จำเป็นต้องเปลี่ยนอุปกรณ์ แต่ให้ช่างเทคนิคตรวจสอบสัญญาณเชื่อมต่อ เกตเวย์ และระบบสมาร์ทโฮมอีกครั้งเพื่อความสมบูรณ์ในการสั่งการ`,
        suggestedStatus: 'Normal',
        riskAssessment: 'No active electrical hazard or short-circuit detected. Physical lighting operation is safe; smart home control requires secondary configuration verification.',
        peaceOfMindNote: 'Mr. Big ตรวจสอบวงจรสวิตช์ไฟฟ้าให้เรียบร้อย ปลอดภัยไม่มีไฟชอร์ต พร้อมประสานงานเช็กระบบสมาร์ทโฮมให้ครบถ้วน',
      };
    }

    // 3. Light Switch / Wall Rocker Switch (Standard Normal)
    if (text.includes('สวิตช์') || text.includes('switch')) {
      return {
        observationEn: `Wall lighting switch assembly and lighting circuit serving ${zoneEn} were inspected and functionally verified: Switch toggle operates smoothly with crisp mechanical contact, circuit continuity is intact, and luminaires illuminate steadily without flicker or voltage drop.`,
        observationTh: `ตรวจเช็กสวิตช์ควบคุมแสงสว่างบริเวณ${zoneTh}: ทดสอบเปิด-ปิดวงจรทำงานได้เป็นปกติ สวิตช์แน่นสัมผัสดี ไฟเปิดติดสว่างสม่ำเสมอ ไม่มีการกะพริบหรือขัดข้อง`,
        recommendedActionEn: `No switch replacement required. Maintain scheduled periodic property care inspection.`,
        recommendedActionTh: `สวิตช์ไฟและวงจรทำงานได้เป็นปกติ ไม่จำเป็นต้องเปลี่ยนอะไหล่ ให้คงรอบการตรวจเช็กตามระยะเวลา`,
        suggestedStatus: 'Normal',
        riskAssessment: 'No operational defect or electrical hazard identified.',
        peaceOfMindNote: 'Mr. Big ตรวจสอบระบบสวิตช์แสงสว่างเรียบร้อย ทำงานได้สมบูรณ์',
      };
    }

    // 3. Electrical Outlets / Sockets / Pop-up
    if (
      text.includes('ปลั๊ก') ||
      text.includes('เต้ารับ') ||
      text.includes('เต้าเสียบ') ||
      text.includes('socket') ||
      text.includes('outlet') ||
      text.includes('pop up')
    ) {
      return {
        observationEn: `Electrical socket outlet unit at ${zoneEn} was verified with polarity and grounding test instruments: Verified correct live-neutral-earth wiring polarity, robust grounding bond, and nominal supply voltage under load.`,
        observationTh: `ตรวจเช็กเต้ารับไฟฟ้าบริเวณ${zoneTh}: ตรวจสอบขั้วไฟฟ้า L-N-G ระบบสายดิน และแรงดันไฟฟ้าทดสอบโหลดแล้วทำงานได้ถูกต้องสมบูรณ์เป็นปกติ`,
        recommendedActionEn: `No socket replacement required. Continue regular property care inspection schedule.`,
        recommendedActionTh: `เต้ารับไฟฟ้าทำงานได้เป็นปกติ ไม่จำเป็นต้องเปลี่ยนอุปกรณ์`,
        suggestedStatus: 'Normal',
        riskAssessment: 'No electrical hazard or voltage irregularities identified.',
        peaceOfMindNote: 'เต้ารับไฟฟ้าผ่านการทดสอบความปลอดภัยโดย Mr. Big เรียบร้อยดี',
      };
    }

    // 4. Outdoor / Garden / PAR38 Lighting
    if (
      text.includes('par38') ||
      text.includes('ไฟสนาม') ||
      text.includes('ไฟสวน') ||
      text.includes('สปอร์ตไลท์') ||
      text.includes('สปอตไลท์') ||
      text.includes('ไฟส่องต้นไม้')
    ) {
      return {
        observationEn: `Outdoor landscape luminaires and PAR38 floodlight fixtures at ${zoneEn} were inspected and operationally verified: Steady illumination, intact waterproof silicone seals, and normal operational load confirmed.`,
        observationTh: `ตรวจเช็กระบบไฟสนาม PAR38 บริเวณ${zoneTh}: ดวงโคมสว่างปกติ ซีลยางกันน้ำอยู่ในสภาพสมบูรณ์ ไม่มีความชื้นสะสม และระบบไฟทำงานได้ตามมาตรฐาน`,
        recommendedActionEn: `No lamp replacement required. Maintain routine cleaning and periodic seal inspections.`,
        recommendedActionTh: `ไฟสนามทำงานได้เป็นปกติ ไม่จำเป็นต้องเปลี่ยนหลอดไฟ ให้คงรอบการตรวจเช็กตามระยะเวลา`,
        suggestedStatus: 'Normal',
        riskAssessment: 'No weather ingress or electrical short-circuit hazard identified.',
        peaceOfMindNote: 'Mr. Big ตรวจเช็กระบบไฟสนามภายนอกให้สวยงามและปลอดภัยต่อสภาพอากาศภูเก็ต',
      };
    }

    // 5. General Lighting / Bulbs
    if (text.includes('ไฟ') || text.includes('หลอด') || text.includes('โคม') || text.includes('light')) {
      return {
        observationEn: `Lighting fixtures and illumination circuitry at ${zoneEn} were inspected and tested: All luminaires illuminate evenly at standard lumen output with no flickering, abnormal ballast hum, or physical damage.`,
        observationTh: `ตรวจเช็กโคมไฟและระบบส่องสว่างบริเวณ${zoneTh}: เปิดทดสอบแล้วดวงโคมสว่างสม่ำเสมอ ไม่กะพริบ ไม่มีเสียงฮัม และทำงานได้เป็นปกติสมบูรณ์`,
        recommendedActionEn: `No bulb or fixture replacement required. Continue scheduled periodic visual inspection.`,
        recommendedActionTh: `ระบบไฟฟ้าส่องสว่างทำงานได้เป็นปกติ ไม่จำเป็นต้องเปลี่ยนหลอดหรือโคมไฟ`,
        suggestedStatus: 'Normal',
        riskAssessment: 'No operational or photometric defect identified.',
        peaceOfMindNote: 'ตรวจสอบความสมบูรณ์ของระบบส่องสว่างโดยทีมงาน Mr. Big',
      };
    }

    // 6. Sliding Doors / Rollers / Windows
    if (
      text.includes('บานเลื่อน') ||
      text.includes('รางเลื่อน') ||
      text.includes('ลูกล้อ') ||
      text.includes('ประตู') ||
      text.includes('หน้าต่าง') ||
      text.includes('door') ||
      text.includes('window')
    ) {
      return {
        observationEn: `Sliding door assembly and roller carriage mechanism at ${zoneEn} were inspected and operationally tested: Door glides smoothly along guide track with balanced alignment, secure lock engagement, and no binding or derailment.`,
        observationTh: `ตรวจเช็กประตูบานเลื่อนและรางเลื่อนบริเวณ${zoneTh}: ทดสอบการเลื่อนเปิด-ปิดลื่นไหลดี ไม่ตกร่อง ไม่ฝืด ระบบล็อกทำงานแน่นหนาเรียบร้อย`,
        recommendedActionEn: `No roller or hardware replacement required. Maintain scheduled track cleaning and silicone lubrication.`,
        recommendedActionTh: `ประตูบานเลื่อนและลูกล้อทำงานได้เป็นปกติ ไม่จำเป็นต้องเปลี่ยนอะไหล่`,
        suggestedStatus: 'Normal',
        riskAssessment: 'No mechanical or security hazard identified.',
        peaceOfMindNote: 'Mr. Big ตรวจสอบการทำงานของประตูบานเลื่อนเรียบร้อย ปลอดภัยและใช้งานสะดวก',
      };
    }

    // 7. Plumbing / Sanitary / Faucets
    if (
      text.includes('ก๊อก') ||
      text.includes('น้ำ') ||
      text.includes('ท่อ') ||
      text.includes('สุขภัณฑ์') ||
      text.includes('ชักโครก') ||
      text.includes('plumbing') ||
      text.includes('faucet')
    ) {
      return {
        observationEn: `Plumbing fixtures, valves, and drainage pathways at ${zoneEn} were verified under line pressure: Smooth valve actuation, steady clear water flow, and zero leakage, seepage, or drainage obstruction observed.`,
        observationTh: `ตรวจเช็กระบบประปาและสุขภัณฑ์บริเวณ${zoneTh}: ทดสอบแรงดันน้ำและเปิด-ปิดวาล์ว น้ำไหลแรงสม่ำเสมอ ไม่พบการรั่วซึม และท่อระบายน้ำไหลคล่องสะดวก`,
        recommendedActionEn: `No plumbing repairs or fixture replacement required. Maintain routine preventive inspection schedule.`,
        recommendedActionTh: `ระบบประปาทำงานได้เป็นปกติ ไม่พบรอยรั่วซึม ไม่จำเป็นต้องเปลี่ยนอุปกรณ์`,
        suggestedStatus: 'Normal',
        riskAssessment: 'No active water leak or pressure hazard identified.',
        peaceOfMindNote: 'ตรวจสอบระบบประปาและสุขภัณฑ์โดย Mr. Big ไม่มีน้ำรั่วซึมให้กังวลใจ',
      };
    }

    // 8. Air Conditioning
    if (text.includes('แอร์') || text.includes('air') || text.includes('hvac') || text.includes('ความเย็น')) {
      return {
        observationEn: `Air conditioning system serving ${zoneEn} was evaluated in cooling mode: Verified normal compressor cycling, adequate chilled airflow, and unobstructed condensate drainage.`,
        observationTh: `ตรวจเช็กเครื่องปรับอากาศบริเวณ${zoneTh}: ทดสอบระบบทำความเย็น คอมเพรสเซอร์ทำงานปกติ ลมเย็นสม่ำเสมอ และท่อน้ำทิ้งระบายได้ดีไม่มีน้ำหยด`,
        recommendedActionEn: `No immediate technical intervention required. Maintain scheduled quarterly chemical filter cleaning and coil service.`,
        recommendedActionTh: `แอร์ทำงานได้เป็นปกติ ทำความเย็นได้ดี ให้คงรอบการล้างแอร์ตามระยะเวลา`,
        suggestedStatus: 'Normal',
        riskAssessment: 'No thermal inefficiency or equipment fault identified.',
        peaceOfMindNote: 'Mr. Big ดูแลตรวจเช็กระบบแอร์ให้อากาศเย็นสบายและประหยัดพลังงาน',
      };
    }

    // 9. General Normal Inspection
    return {
      observationEn: `Routine villa inspection at ${zoneEn}: System and components were thoroughly inspected, functionally verified in normal operational order with no defects, and operating to engineering standards.`,
      observationTh: `ตรวจเช็กสภาพการใช้งานบริเวณ${zoneTh}: อุปกรณ์และระบบผ่านการทดสอบ ทำงานได้เป็นปกติ ไม่พบข้อบกพร่องหรือความเสียหาย`,
      recommendedActionEn: `No hardware replacement or corrective repairs required. Maintain scheduled periodic property care inspections.`,
      recommendedActionTh: `อุปกรณ์ทำงานได้เป็นปกติ ไม่จำเป็นต้องเปลี่ยนอะไหล่หรือซ่อมแซม ให้คงรอบการตรวจเช็กตามระยะเวลา`,
      suggestedStatus: 'Normal',
      riskAssessment: 'No operational, structural, or safety risks identified.',
      peaceOfMindNote: 'Mr. Big ตรวจสอบยืนยันความสมบูรณ์เรียบร้อยของวิลล่าเพื่อความสบายใจของเจ้าของวิลล่า',
    };
  }

  // Defect fallbacks (if non-normal and offline)
  const isStepLight =
    text.includes('step light') ||
    text.includes('step-light') ||
    text.includes('ไฟ step') ||
    text.includes('ไฟสเต็ป') ||
    text.includes('ขั้นบันได') ||
    text.includes('บันได') ||
    text.includes('stair light') ||
    zone.toLowerCase().includes('step') ||
    zone.toLowerCase().includes('บันได');

  const isTreeLight =
    text.includes('tree light') ||
    text.includes('tree-light') ||
    text.includes('ไฟส่องต้นไม้') ||
    text.includes('ไฟต้นไม้') ||
    text.includes('tree uplight') ||
    text.includes('uplight') ||
    zone.toLowerCase().includes('tree') ||
    zone.includes('ต้นไม้');

  const isEntranceArea =
    zoneEn.toLowerCase().includes('entrance') ||
    zoneEn.toLowerCase().includes('front') ||
    zoneTh.includes('ทางเข้า') ||
    zoneTh.includes('หน้าบ้าน');

  const isWiringOrPowerSupply =
    text.includes('power supply wiring') ||
    text.includes('power supply') ||
    text.includes('wiring') ||
    text.includes('สายไฟ') ||
    text.includes('วงจรสายไฟ') ||
    text.includes('ตรวจเช็คสายไฟ') ||
    text.includes('ตรวจเช็กสายไฟ') ||
    text.includes('สายไฟจ่ายไฟ') ||
    text.includes('สายไฟขาด') ||
    text.includes('feed cable') ||
    text.includes('cable');

  const isFixtureFailsOrNoLight =
    text.includes('fails to operate') ||
    text.includes('fail to operate') ||
    text.includes('does not operate') ||
    text.includes('not operate') ||
    text.includes('not working') ||
    text.includes('does not turn on') ||
    text.includes('fails to turn on') ||
    text.includes('not turn on') ||
    text.includes('light fixture') ||
    text.includes('fixture') ||
    text.includes('ไฟไม่ติด') ||
    text.includes('เปิดไม่ติด') ||
    text.includes('ไม่ติด') ||
    text.includes('ไม่สว่าง') ||
    text.includes('ไม่ทำงาน');

  const isSwitchOperationAction =
    text.includes('upon turning on') ||
    text.includes('when turning on') ||
    text.includes('turn on the switch') ||
    text.includes('turning on the switch') ||
    text.includes('turned on the switch') ||
    text.includes('actuating the switch') ||
    text.includes('flip the switch') ||
    text.includes('เปิดสวิตช์แล้ว') ||
    text.includes('กดสวิตช์แล้ว') ||
    text.includes('สวิตช์เปิดแล้ว');

  const isLightRelated =
    text.includes('หลอดไฟ') ||
    text.includes('โคมไฟ') ||
    text.includes('ไฟ') ||
    text.includes('หลอด') ||
    text.includes('luminaire') ||
    text.includes('lamp') ||
    text.includes('light');

  // Trigger 0: Outdoor Entrance Step & Tree Lighting / Subterranean Power Supply Wiring / Fixtures Inoperative upon Switching
  if (
    ((isStepLight || isTreeLight || isEntranceArea) && (isFixtureFailsOrNoLight || isWiringOrPowerSupply)) ||
    (isWiringOrPowerSupply && (isLightRelated || isFixtureFailsOrNoLight || isSwitchOperationAction)) ||
    (isSwitchOperationAction && isFixtureFailsOrNoLight && (isStepLight || isTreeLight || isEntranceArea || isLightRelated))
  ) {
    const fixtureLabelEn = (isStepLight && isTreeLight)
      ? 'step lights and tree uplights'
      : isStepLight
      ? 'step lights'
      : isTreeLight
      ? 'tree uplights'
      : 'lighting fixtures';

    const fixtureLabelTh = (isStepLight && isTreeLight)
      ? 'ไฟส่องขั้นบันได (Step Light) และไฟส่องต้นไม้ (Tree Light)'
      : isStepLight
      ? 'ไฟส่องขั้นบันได (Step Light)'
      : isTreeLight
      ? 'ไฟส่องต้นไม้ (Tree Light)'
      : 'ชุดโคมไฟส่องสว่าง';

    return {
      observationEn: `Upon actuating the switch, exterior ${fixtureLabelEn} at ${zoneEn} fail to operate and remain completely unlit. Technical evaluation indicates an electrical continuity disruption in the power supply wiring circuit, subterranean feeder cable degradation, loose wire splices in junction pull-boxes, or failure in the secondary power supply driver.`,
      observationTh: `เมื่อเปิดสวิตช์ไฟ พบว่า${fixtureLabelTh} บริเวณ${zoneTh} ไม่ติดและไม่ทำงานอย่างสิ้นเชิง การตรวจสอบเชิงวิศวกรรมบ่งชี้ว่ามีความผิดปกติในระบบสายไฟจ่ายกำลัง (Power Supply Wiring) เช่น สายไฟใต้ดินขาดในหรือเสื่อมสภาพ, จุดต่อสายในกล่องพักสายหลุดหลวมจากความชื้น, หรือชุดเพาเวอร์ซัพพลาย/หม้อแปลงจ่ายไฟชำรุด`,
      recommendedActionEn: `Chief Electrical Engineer Remediation Plan:
1) Subterranean Cable & Continuity Audit: Safely isolate and de-energize circuit branch; conduct continuity and Megger insulation resistance testing (> 1.0 MΩ) across underground power supply feed cables to pinpoint the exact location of cable breakage or short-to-ground fault.
2) Wiring Rectification & Waterproof Sealing: Replace degraded feed cables with weather-resistant NYY/XLPE conductors, seal subterranean cable splices with waterproof junction sealing, and apply moisture-proof insulation tape.
3) Cost-Effective 12V 3W & Weatherproof Power Supply Upgrade: Recommend replacing damaged fixtures with accessible 12V 3W In-Ground Uplights with waterproof silicone gasket sealing and installing a heavy-duty IP67 weatherproof 12V DC power supply. This ensures 100% electrocution safety (12V SELV) and permanently prevents RCBO breaker trips at fair market rates.`,
      recommendedActionTh: `คำแนะนำเชิงวิศวกรรมระดับหัวหน้าผู้จัดการระบบไฟฟ้า (คุ้มค่าและปลอดภัยสูงสุด):
1) ตรวจสอบความต่อเนื่องและค่าฉนวนสายไฟ: ตัดกระแสไฟฟ้าเพื่อความปลอดภัย ทำการวัดความต่อเนื่อง (Continuity Test) และวัดค่าความต้านทานความเป็นฉนวน (Insulation Resistance Test ด้วย Megger > 1.0 MΩ) ของสายไฟเมนจ่ายกำลังใต้ดินที่เชื่อมต่อกับไฟ step light และ tree light เพื่อหาจุดที่สายไฟขาดในหรือชำรุด
2) ซ่อมแซมระบบสายไฟและจุดต่อ: เปลี่ยนสายไฟช่วงที่เสียหายด้วยสายทนสภาพอากาศ NYY/XLPE และซีลกันน้ำที่กล่องพักสายใต้ดินทุกจุดเพื่อป้องกันน้ำและความชื้นแทรกซึม
3) ติดตั้งหลอด In-Ground Uplight 12V 3W และเพาเวอร์ซัพพลาย 12V กันน้ำ: แนะนำใช้หลอด In-Ground Uplight 12V 3W แสงวอร์มไวท์ พร้อมซีลกันน้ำ และต่อเข้ากับชุดเพาเวอร์ซัพพลาย 12V แบบกันน้ำ IP67 ทนทานสูงที่มีจำหน่ายแพร่หลายในตลาดปัจจุบัน ปลอดภัยจากไฟดูด 100% หมดปัญหาไฟรั่วทริปเบรกเกอร์ และประหยัดค่าใช้จ่ายอย่างคุ้มค่า`,
      suggestedStatus: 'Not Working',
      riskAssessment: 'Inoperative entrance step and tree illumination creates immediate trip-and-fall physical hazards for arriving guests at night. Concealed subterranean cable faults risk progressive insulation breakdown, moisture short-circuits, and recurring earth-leakage tripping at the MDB panel.',
      peaceOfMindNote: 'Mr. Big วิเคราะห์ตรงจุดตามมาตรฐานวิศวกรรมไฟฟ้า: แนะนำหลอด 12V 3W และเพาเวอร์ซัพพลายกันน้ำที่หาซื้อง่ายตามสภาพตลาดจริง ช่วยให้หัวหน้างานและ Molly สรุปใบเสนอราคาได้รวดเร็ว ปลอดภัยตามรอบรับประกัน 1 ปี และเปิดให้หัวหน้างานพิจารณาตัดสินใจ',
    };
  }

  // 1. Low-Voltage 12V / 24V SELV Safety Lighting Conversion & In-Ground Landscape Uplight
  const is12v =
    text.includes('12v') ||
    text.includes('12 v') ||
    text.includes('12โวลต์') ||
    text.includes('12 โวลต์') ||
    text.includes('แรงดันต่ำ') ||
    text.includes('selv') ||
    text.includes('หม้อแปลง');

  const isInGroundUplight =
    text.includes('in ground') ||
    text.includes('in-ground') ||
    text.includes('inground') ||
    text.includes('up light') ||
    text.includes('uplight') ||
    text.includes('ไฟฝังพื้น') ||
    text.includes('ฝังพื้น') ||
    text.includes('ส่องขึ้น') ||
    text.includes('well light');

  const isFlickerOrUrgent =
    text.includes('กระพริบ') ||
    text.includes('กะพริบ') ||
    text.includes('เปลี่ยน') ||
    text.includes('ด่วน') ||
    text.includes('ชำรุด') ||
    text.includes('เสีย') ||
    text.includes('flicker') ||
    text.includes('strobe');

  // Trigger 1: 12V SELV Safety Conversion OR In-Ground Uplight OR Outdoor flickering luminaire
  if ((is12v && isLightRelated) || isInGroundUplight || (is12v && isFlickerOrUrgent)) {
    const isEntrance =
      zoneEn.toLowerCase().includes('entrance') ||
      zoneEn.toLowerCase().includes('front') ||
      zoneTh.includes('ทางเข้า') ||
      zoneTh.includes('หน้าบ้าน');

    const luminaireTypeEn = isEntrance
      ? 'Exterior entrance & pathway luminaire'
      : 'Exterior landscape in-ground / well light luminaire';
    const luminaireTypeTh = isEntrance
      ? 'โคมไฟส่องสว่างทางเข้า (Exterior Entrance Luminaire)'
      : 'โคมไฟส่องสว่างภายนอก/โคมไฟฝังพื้น (Exterior Landscape Luminaire)';

    const descEn = `${luminaireTypeEn} at ${zoneEn} exhibits persistent electrical flickering and driver instability caused by moisture ingress past degraded seals. The existing fixture is wired directly to hazardous high-voltage 220V AC mains supply in an exposed, damp outdoor environment. Under tropical humidity and rainwater pooling, running 220V on wet ground poses severe earth-leakage tripping (RCBO nuisance trips) and critical electrocution hazard to occupants, guests, and pets.`;
    const descTh = `ตรวจพบ${luminaireTypeTh} บริเวณ${zoneTh} มีอาการไฟกระพริบและไดรเวอร์ไม่เสถียรเนื่องจากความชื้นและน้ำซึมผ่านซีลขั้วโคม โดยระบบเดิมยังต่อตรงกับไฟแรงดันสูง 220V ในพื้นที่ภายนอกอาคารซึ่งสัมผัสความชื้นและน้ำฝนโดยตรง เสี่ยงต่อการเกิดกระแสไฟฟ้ารั่วลงดิน (Earth Leakage) ทำให้เบรกเกอร์ RCBO ทริปตัดไฟทั้งวิลล่า และก่อให้เกิดอันตรายจากไฟฟ้าดูด (Fatal Shock Hazard) ต่อผู้พักอาศัยและสัตว์เลี้ยงในช่วงฝนตก`;

    const actionEn = `Chief Electrical Engineer Cost-Effective Remediation Plan:
1) Equipment to Replace: Safely de-energize circuit branch; replace defective fixture/lamp with an Outdoor In-Ground Uplight 12V 3W LED luminaire (IP67/IP68 waterproof sealed with impact-resistant tempered lens).
2) Waterproof Sealing: Apply high-durability exterior waterproof silicone gasket sealing around the luminaire collar and wrap electrical connections with weather-resistant moisture tape to prevent rainwater penetration.
3) Weatherproof 12V Power Supply: Install a heavy-duty outdoor weatherproof IP67 12V DC power supply / driver. Technical justification: Converting to 12V SELV (Safety Extra-Low Voltage) keeps operating voltage strictly below human physiological hazard limits, completely eliminating electrocution dangers in wet ground and preventing nuisance RCBO breaker trips at the main MDB, while keeping procurement and maintenance costs fair and affordable for the villa owner.`;

    const actionTh = `คำแนะนำเชิงวิศวกรรมระดับหัวหน้าผู้จัดการระบบไฟฟ้า (แนวทางคุ้มค่าและปลอดภัยสูงสุด):
1) สิ่งที่ต้องเปลี่ยน: ตัดกระแสไฟฟ้าเพื่อความปลอดภัย รื้อถอนจุดเดิมที่ชำรุดและเปลี่ยนเป็น "หลอด/โคมไฟ In-Ground Uplight 12V 3W" แสงวอร์มไวท์ ที่ประหยัดพลังงาน ระบายความร้อนดี และมีชุดซีลยางกันน้ำ
2) การซีลกันน้ำ (Waterproof Sealing): ซีลกันน้ำขอบโคมด้วยซิลิโคนเกรดทนสภาพอากาศภายนอก และพันเทปละลายกันความชื้นจุดต่อสายไฟ เพื่อป้องกันน้ำฝนและความชื้นซึมเข้าตัวโคมอย่างสนิท
3) ชุดจ่ายไฟ Power Supply 12V แบบกันน้ำ: ติดตั้งชุดเพาเวอร์ซัพพลาย 12V แบบกันน้ำ (IP67 Weatherproof 12V Power Supply) บอดี้ทนทาน ซึ่งมีจำหน่ายแพร่หลายในราคาสมเหตุสมผลในตลาดปัจจุบัน โดยระบบแรงดันต่ำ 12V SELV จะช่วยป้องกันอันตรายจากไฟฟ้าดูด 100% แม้ฝนตกน้ำขัง และหมดปัญหาไฟรั่วทริปเบรกเกอร์เมน RCBO ดับทั้งวิลล่า ช่วยให้เจ้าของวิลล่าประหยัดงบประมาณได้อย่างคุ้มค่าสูงสุด`;

    return {
      observationEn: descEn,
      observationTh: descTh,
      recommendedActionEn: actionEn,
      recommendedActionTh: actionTh,
      suggestedStatus: 'Requires Swap',
      riskAssessment: 'Operating high-voltage 220V luminaires in outdoor entrance/ground areas violates life-safety standards in tropical monsoon environments, presenting severe electrocution and recurring RCBO tripping risks. Converting to 12V SELV is mandatory for electrical safety.',
      peaceOfMindNote: 'Mr. Big แนะนำทางออกที่ตรงจุดและคุ้มค่า: ใช้หลอด In-Ground Uplight 12V 3W ซีลกันน้ำแน่นหนา พร้อมเพาเวอร์ซัพพลาย 12V แบบกันน้ำ ทนทาน ปลอดภัยจากไฟดูด 100% สอดคล้องกับสภาพตลาดจริงในภูเก็ตและการรับประกัน 1 ปี ช่วยให้หัวหน้างานและ Molly สรุปใบเสนอราคาได้รวดเร็วทันใจ โดยให้หัวหน้างานพิจารณาตัดสินใจขั้นสุดท้าย',
    };
  }

  // 2. Underwater Pool / Fountain Light / ไฟสระว่ายน้ำ
  if (
    text.includes('ไฟสระ') ||
    text.includes('pool light') ||
    text.includes('underwater') ||
    text.includes('ไฟน้ำพุ') ||
    text.includes('ใต้น้ำ')
  ) {
    return {
      observationEn: `Submersible underwater pool / water feature luminaire at ${zoneEn} exhibits electrical malfunction, moisture penetration into the sealed housing, or LED diode burnout.`,
      observationTh: `ตรวจพบไฟส่องสว่างใต้น้ำในสระว่ายน้ำ/ม่านน้ำตกบริเวณ${zoneTh} ชำรุด น้ำซึมเข้าตัวโคม หรือหลอดขาดไม่สว่าง`,
      recommendedActionEn: `Safely isolate underwater lighting circuit. Replace with an IP68 fully resin-filled 12V AC underwater LED pool light and verify SELV isolation transformer grounding.`,
      recommendedActionTh: `ตัดกระแสไฟเพื่อความปลอดภัย รื้อเปลี่ยนโคมไฟสระว่ายน้ำเป็นรุ่น Resin-Filled หล่อเรซิ่นตันกันน้ำ 100% (IP68) ใช้ไฟ 12V AC ปลอดภัย พร้อมตรวจเช็กระบบหม้อแปลงนิรภัย`,
      suggestedStatus: 'Requires Swap',
      riskAssessment: 'Damaged pool lighting seals risk water ingress and electrical leakage into pool water, posing serious swimmer safety risks.',
      peaceOfMindNote: 'Mr. Big ให้ความสำคัญสูงสุดกับความปลอดภัยในสระว่ายน้ำ ตรวจเช็กระบบไฟ 12V ใต้น้ำอย่างเข้มงวด',
    };
  }

  // 3. Outdoor PAR38 Floodlight
  if (
    text.includes('par38') ||
    text.includes('ไฟสนาม') ||
    text.includes('ไฟสวน') ||
    text.includes('สปอร์ตไลท์') ||
    text.includes('สปอตไลท์') ||
    text.includes('ไฟส่องต้นไม้')
  ) {
    return {
      observationEn: `Outdoor IP65 waterproof PAR38 floodlight lamp at ${zoneEn} is burnt out and non-functional. Waterproof gasket seal requires inspection.`,
      observationTh: `หลอดไฟสนาม PAR38 บริเวณ${zoneTh} ชำรุดไม่ติด ตรวจพบขั้วหลอดหมดอายุการใช้งาน`,
      recommendedActionEn: `Replace with genuine outdoor waterproof PAR38 15W-18W warm white LED lamp and inspect silicone gasket seal.`,
      recommendedActionTh: `เปลี่ยนหลอดไฟสนาม PAR38 LED กันน้ำ IP65 (12W-15W แสงวอร์มไวท์) เทียบเคียงราคากลางตลาดทั่วไป พร้อมตรวจเช็กซีลยางกันน้ำ`,
      suggestedStatus: 'Requires Swap',
      riskAssessment: 'Insufficient exterior night illumination reduces villa security and landscape aesthetics.',
      peaceOfMindNote: 'Mr. Big เลือกใช้อะไหล่ราคากลางตลาดทั่วไปที่หาซื้อง่ายในภูเก็ต ช่วยให้หัวหน้างานและ Molly สรุปใบเสนอราคาได้รวดเร็วทันใจ ปลอดภัยตามรอบรับประกัน 1 ปี และให้หัวหน้างานพิจารณาตัดสินใจขั้นสุดท้าย',
    };
  }

  // Pop-up socket
  if (text.includes('pop up') || text.includes('popup') || text.includes('ปลั๊ก pop') || (text.includes('โต๊ะ') && text.includes('ปลั๊ก'))) {
    return {
      observationEn: `Desk-integrated pop-up electrical socket unit at ${zoneEn} is mechanically jammed and electrically non-functional. Spring catch mechanism has failed.`,
      observationTh: `ตรวจพบชุดเต้ารับไฟฟ้าแบบป๊อปอัป (Pop-Up Socket) บริเวณ${zoneTh} ชำรุด สปริงค้างไม่เด้งขึ้น และจ่ายไฟไม่เสถียร`,
      recommendedActionEn: `De-energize circuit branch, dismantle damaged pop-up box, and install new heavy-duty pop-up desk module with dual AC sockets and fast charging ports.`,
      recommendedActionTh: `ตัดกระแสไฟฟ้าเพื่อความปลอดภัย รื้อถอนชุดเต้ารับป๊อปอัปเดิมที่เสียหาย และติดตั้งชุดใหม่มาตรฐาน มอก.`,
      suggestedStatus: 'Requires Swap',
      riskAssessment: 'Degraded electrical contacts may cause intermittent power faults or damage connected laptops.',
      peaceOfMindNote: 'Mr. Big ให้ความสำคัญกับความปลอดภัยของโต๊ะทำงานสำหรับเจ้าของและผู้เข้าพัก',
    };
  }

  // Sliding door
  if (text.includes('บานเลื่อน') || text.includes('ลูกล้อ') || text.includes('รางเลื่อน') || text.includes('ตกร่อง') || text.includes('ฝืด')) {
    return {
      observationEn: `Heavy sliding glass door assembly at ${zoneEn} exhibits severe resistance and roller misalignment. Roller bearings are seized or worn.`,
      observationTh: `ตรวจพบประตูบานเลื่อนกระจกบริเวณ${zoneTh} ฝืดหนัก ตกร่อง และมีเสียงเสียดสีเวลาเลื่อน`,
      recommendedActionEn: `Dismantle heavy door sash, replace degraded tandem rollers with heavy-duty SUS304 stainless steel roller units, and calibrate track level.`,
      recommendedActionTh: `ถอดบานกระจก เปลี่ยนชุดลูกล้อคู่สแตนเลส SUS304 เกรดงานหนัก และปรับตั้งระดับรางเลื่อนใหม่`,
      suggestedStatus: 'Requires Swap',
      riskAssessment: 'Continued forced operation may cause glass derailment or track gouging.',
      peaceOfMindNote: 'Mr. Big ปรับแต่งระบบบานเลื่อนให้เลื่อนลื่น เงียบสนิท ไร้กังวล',
    };
  }

  // Plumbing
  if (text.includes('ก๊อก') || text.includes('น้ำรั่ว') || text.includes('น้ำซึม') || text.includes('faucet') || text.includes('สายฉีด')) {
    return {
      observationEn: `Sanitary plumbing fitting at ${zoneEn} exhibits continuous dripping and cartridge seepage under line pressure.`,
      observationTh: `ตรวจพบก๊อกน้ำหรืออุปกรณ์สุขภัณฑ์บริเวณ${zoneTh} มีน้ำรั่วซึม ไส้วาล์วภายในเสื่อมสภาพ`,
      recommendedActionEn: `Shut off angle stop-valve, remove degraded faucet assembly, and install high-grade SUS304 stainless steel basin mixer with ceramic cartridge.`,
      recommendedActionTh: `ปิดสต็อปวาล์ว รื้อถอนก๊อกเดิม และติดตั้งก๊อกผสมสแตนเลส SUS304 วาล์วเซรามิกแท้ป้องกันการรั่วซึม`,
      suggestedStatus: 'Requires Swap',
      riskAssessment: 'Unresolved water leaks cause moisture damage to cabinetry and increase water utility charges.',
      peaceOfMindNote: 'Mr. Big ดูแลระบบท่อน้ำให้แน่นหนา หมดกังวลเรื่องน้ำรั่วซึม',
    };
  }

  // Smart Home & Automation Logic
  // 1. Ghost flicker / LED strobe when light turned off with smart switch (Bypass Capacitor required)
  if (
    (text.includes('กระพริบ') || text.includes('กะพริบ') || text.includes('หรี่') || text.includes('ผีหลอก')) &&
    (text.includes('ปิดไฟ') || text.includes('สวิตช์') || text.includes('สมาร์ท') || text.includes('smart'))
  ) {
    return {
      observationEn: `Interior LED luminaire circuit at ${zoneEn} exhibits residual phantom glowing/flickering when switched off. Caused by parasitic capacitive trickle current leakage from no-neutral smart wall switch through high-efficiency LED drivers.`,
      observationTh: `ตรวจพบไฟ LED บริเวณ${zoneTh} มีอาการกะพริบหรือเรืองแสงริบหรี่หลังจากปิดสวิตช์ เกิดจากสวิตช์สมาร์ทโฮมแบบไม่มีสายนิวทรัล (No-Neutral) มีกระแสไฟเลี้ยงวงจรไหลผ่านไดรเวอร์หลอด LED`,
      recommendedActionEn: `De-energize lighting circuit branch and connect an approved Safety Anti-Flicker Bypass Capacitor in parallel across Line-1 and Neutral terminals directly at the first luminaire load.`,
      recommendedActionTh: `ตัดกระแสไฟเพื่อความปลอดภัย และต่อตัวเก็บประจุ Safety Bypass Capacitor (Anti-Flicker Module) คร่อมขนานระหว่างสาย L1 และ N ที่ขั้วหลอดไฟจุดแรก`,
      suggestedStatus: 'Requires Swap',
      riskAssessment: 'Parasitic current trickle causes nocturnal visual annoyance and accelerates premature driver capacitor burnout.',
      peaceOfMindNote: 'Mr. Big จัดการติดตั้งตัวเก็บประจุแก้ไฟกระพริบเพื่อแสงสว่างที่นิ่งสนิทและยืดอายุหลอดไฟ',
    };
  }

  // 2. Smart Home / Automation Check (Fallback - prevent false defect replacement)
  if (
    text.includes('สมาร์ทโฮม') ||
    text.includes('smart home') ||
    text.includes('automation') ||
    text.includes('เกตเวย์') ||
    text.includes('gateway') ||
    text.includes('zigbee') ||
    text.includes('tuya') ||
    (text.includes('แอพ') && text.includes('offline')) ||
    (text.includes('app') && text.includes('offline'))
  ) {
    return {
      observationEn: `Smart home automation integration serving ${zoneEn} was verified: Physical switch and electrical line contacts are operational without electrical short-circuit. Wireless Zigbee/Wi-Fi coordinator pairing or RF mesh repeater transmission requires on-site network re-synchronization.`,
      observationTh: `ตรวจเช็กระบบสมาร์ทโฮมและสวิตช์บริเวณ${zoneTh}: วงจรไฟฟ้าและกลไกสวิตช์ทำงานได้ตามปกติ ไม่พบการลัดวงจร ไม่จำเป็นต้องเปลี่ยนฮาร์ดแวร์ อยู่ระหว่างตรวจสอบสัญญาณเชื่อมต่อ Zigbee/เกตเวย์`,
      recommendedActionEn: `No switch hardware replacement required. Perform coordinator gateway diagnostic check, re-bind Zigbee mesh nodes, and verify 2.4GHz RF coexistence.`,
      recommendedActionTh: `สวิตช์ไฟและวงจรทำงานได้เป็นปกติ ไม่ต้องเปลี่ยนอุปกรณ์ ให้ช่างเทคนิคตรวจสอบสัญญาณเกตเวย์ ซิงค์สัญญาณ Zigbee และทดสอบการสั่งการผ่านแอปพลิเคชัน`,
      suggestedStatus: 'Normal',
      riskAssessment: 'No active electrical hazard identified. Physical lighting operation remains secure.',
      peaceOfMindNote: 'Mr. Big ดูแลระบบไฟฟ้าและระบบสมาร์ทโฮมให้ทำงานได้อย่างราบรื่น',
    };
  }

  // 3. Electrical Engineering & MDB / Breaker / RCBO / Earth Leakage / Surge
  if (
    text.includes('เบรกเกอร์') ||
    text.includes('breaker') ||
    text.includes('ทริป') ||
    text.includes('trip') ||
    text.includes('ไฟตัด') ||
    text.includes('ไฟดับ') ||
    text.includes('ไฟดูด') ||
    text.includes('ไฟรั่ว') ||
    text.includes('rcbo') ||
    text.includes('mdb') ||
    text.includes('spd') ||
    text.includes('กราวด์') ||
    text.includes('สายดิน')
  ) {
    const isRainOrOutdoor = text.includes('ฝน') || text.includes('น้ำ') || text.includes('ชื้น') || text.includes('นอก');
    const descEn = isRainOrOutdoor
      ? `Main Distribution Board (MDB) / RCBO breaker tripped for ${zoneEn} due to environmental rainwater/moisture ingress into outdoor lighting junction boxes, exceeding 30mA residual leakage limit.`
      : `Circuit protection trip event detected at ${zoneEn}. Diagnostics indicate abnormal earth leakage current or transient line overload exceeding rated safety threshold.`;
    const descTh = isRainOrOutdoor
      ? `ตรวจพบเบรกเกอร์ป้องกันไฟรั่ว (RCBO) บริเวณ${zoneTh} ทริปตัดวงจร เกิดจากความชื้นหรือน้ำฝนซึมเข้ากล่องพักสาย/โคมไฟภายนอก ส่งผลให้กระแสไฟฟ้ารั่วลงดินเกิน 30mA`
      : `ตรวจพบเบรกเกอร์/RCBO ประจำพื้นที่${zoneTh} ทริปตัดวงจร ตรวจพบกระแสไฟฟ้ารั่วลงดินหรือโหลดกระแสเกินพิกัดความปลอดภัย`;

    return {
      observationEn: descEn,
      observationTh: descTh,
      recommendedActionEn: `Perform insulation resistance Megger testing across branch lines, seal weather-exposed junction boxes with waterproof silicone compound, verify earth grounding resistance (< 5 ohms), and replace compromised breaker unit.`,
      recommendedActionTh: `ตรวจวัดค่าความเป็นฉนวนสายไฟด้วย Megger ซีลกันน้ำกล่องพักสาย ตรวจวัดค่าความต้านทานหลักดิน (< 5 โอห์ม) และเปลี่ยนชุดเบรกเกอร์ RCBO แท้มาตรฐาน มอก.`,
      suggestedStatus: 'Power Tripped',
      riskAssessment: 'Unresolved earth leakage presents an electrical hazard to villa occupants and electronics during humid tropical weather.',
      peaceOfMindNote: 'Mr. Big ให้ความสำคัญสูงสุดกับความปลอดภัยของระบบไฟฟ้าเพื่อความสบายใจของเจ้าของและผู้เข้าพัก',
    };
  }

  // 4. IT & Villa Network Infrastructure / Wi-Fi / Router / Fiber ONT / CCTV / LAN
  if (
    text.includes('wifi') ||
    text.includes('wi-fi') ||
    text.includes('ไวไฟ') ||
    text.includes('เน็ต') ||
    text.includes('network') ||
    text.includes('lan') ||
    text.includes('router') ||
    text.includes('เร้าเตอร์') ||
    text.includes('cctv') ||
    text.includes('กล้อง') ||
    text.includes('los') ||
    text.includes('access point')
  ) {
    const isFiberLos = text.includes('los') || (text.includes('แดง') && text.includes('เร้าเตอร์'));
    const obsEn = isFiberLos
      ? `Optical Network Terminal (Fiber ONT Router) at ${zoneEn} displays a red LOS (Loss of Signal) alarm, indicating an optical fiber attenuation loss or severed incoming service drop cable.`
      : `Wireless Wi-Fi throughput and network data connection at ${zoneEn} exhibits packet latency, high drop rate, or degraded Cat6 cable termination.`;
    const obsTh = isFiberLos
      ? `ตรวจพบเร้าเตอร์ไฟเบอร์ออปติก (Fiber ONT) บริเวณ${zoneTh} ขึ้นไฟสีแดง LOS (Loss of Signal) ไม่มีสัญญาณแสงเข้า หรือสายไฟเบอร์ขาด/หักงอ`
      : `ตรวจพบสัญญาณเครือข่าย Wi-Fi หรือจุดเชื่อมต่อสาย LAN บริเวณ${zoneTh} สัญญาณไม่เสถียร สปีดตก หรือมีคลื่นรบกวนทะลุกำแพงคอนกรีต`;

    return {
      observationEn: obsEn,
      observationTh: obsTh,
      recommendedActionEn: isFiberLos
        ? `Inspect optical patch cable, clean SC/APC connector face, verify optical Rx power levels, and coordinate urgent ISP line repair.`
        : `Re-terminate degraded Cat6 RJ45 keystone plugs, optimize Access Point channel width (20/40/80 MHz), rebalance PoE switch budget, and audit local DHCP IP pool.`,
      recommendedActionTh: isFiberLos
        ? `ตรวจเช็กสายแพตช์คอร์ดไฟเบอร์ ทำความสะอาดหัวต่อ SC/APC วัดระดับสัญญาณแสง และประสานงานผู้ให้บริการอินเทอร์เน็ตเพื่อแก้ไขอย่างเร่งด่วน`
        : `ตรวจเช็กและเข้าหัวสาย LAN Cat6 ใหม่ ปรับจูนช่องสัญญาณ Access Point และตรวจสอบโหลดพาวเวอร์สวิตช์ PoE เพื่อให้อินเทอร์เน็ตเสถียรทั่ววิลล่า`,
      suggestedStatus: 'Requires Swap',
      riskAssessment: 'Interrupted internet access impacts remote working guests and disconnects smart villa security monitoring.',
      peaceOfMindNote: 'Mr. Big ตรวจสอบระบบเครือข่าย IT และ Wi-Fi ให้เชื่อมต่ออินเทอร์เน็ตได้อย่างลื่นไหลไร้สะดุด',
    };
  }

  // 5. Wall Rocker Light Switch Mechanism Defect
  if ((text.includes('สวิตช์') || text.includes('switch')) && !isSwitchOperationAction) {
    return {
      observationEn: `Wall lighting switch assembly at ${zoneEn} exhibits loose mechanical toggle feel and internal contact degradation, causing unreliable switching.`,
      observationTh: `ตรวจพบชุดสวิตช์เปิด-ปิดไฟบริเวณ${zoneTh} ชำรุด กลไกสัมผัสภายในเริ่มเสื่อมสภาพ เปิดไฟติดบ้างไม่ติดบ้าง`,
      recommendedActionEn: `Safely de-energize circuit branch, verify line voltage, and replace with certified architectural rocker switch module.`,
      recommendedActionTh: `ตัดกระแสไฟเพื่อความปลอดภัย ถอดเปลี่ยนชุดสวิตช์ไฟใหม่มาตรฐาน มอก. และตรวจสอบการเข้าหัวสายไฟ`,
      suggestedStatus: 'Requires Swap',
      riskAssessment: 'Loose electrical contacts generate localized arcing and contact heating under sustained lighting loads.',
      peaceOfMindNote: 'Mr. Big ตรวจสอบเปลี่ยนสวิตช์ให้ปลอดภัยและตอบสนองได้ดีเยี่ยม',
    };
  }

  // Default Defect Fallback
  return {
    observationEn: `On-site technical inspection at ${zoneEn}: Noted operational defect requiring maintenance and parts replacement.`,
    observationTh: `ตรวจเช็กบริเวณ${zoneTh}: พบจุดชำรุดเสียหายที่ต้องดำเนินการซ่อมแซมหรือเปลี่ยนอะไหล่`,
    recommendedActionEn: `Isolate affected component and replace malfunctioning hardware with certified compliant parts.`,
    recommendedActionTh: `ตรวจสอบจุดที่ชำรุดและดำเนินการเปลี่ยนอะไหล่ใหม่ตามมาตรฐานวิศวกรรม`,
    suggestedStatus: 'Requires Swap',
    riskAssessment: 'Defective hardware impacts daily convenience and property standards.',
    peaceOfMindNote: 'Mr. Big พร้อมดูแลแก้ไขปัญหาหน้างานให้อย่างรวดเร็วและถูกต้อง',
  };
}
