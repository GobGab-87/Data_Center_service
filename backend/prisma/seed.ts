import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create Default Users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const operatorPassword = await bcrypt.hash('tech123', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: adminPassword,
      fullName: 'ผู้ดูแลระบบ Data Center (Admin)',
      department: 'Facilities & Infrastructure',
      role: 'ADMIN',
      status: 'APPROVED',
    },
  });

  const operator = await prisma.user.upsert({
    where: { username: 'technician1' },
    update: {},
    create: {
      username: 'technician1',
      passwordHash: operatorPassword,
      fullName: 'สมชาย ใจดี (วิศวกรประจำกะ)',
      department: 'Shift Operations',
      role: 'OPERATOR',
      status: 'APPROVED',
    },
  });

  console.log(`👤 Users seeded: ${admin.username} (ADMIN), ${operator.username} (OPERATOR)`);

  // 2. Create Rooms
  const roomServer1 = await prisma.room.upsert({
    where: { code: 'SR-01' },
    update: {},
    create: {
      name: 'Server Hall 1 (Main Data Hall)',
      code: 'SR-01',
      floor: 'ชั้น 2',
      description: 'ห้องเซิร์ฟเวอร์หลัก ความจุ 40 Racks',
    },
  });

  const roomUPS = await prisma.room.upsert({
    where: { code: 'UPS-01' },
    update: {},
    create: {
      name: 'UPS & Electrical Switchgear Room',
      code: 'UPS-01',
      floor: 'ชั้น 1',
      description: 'ห้องจ่ายไฟหลัก ตู้ MDB และระบบสำรองไฟฟ้า UPS A/B',
    },
  });

  const roomBattery = await prisma.room.upsert({
    where: { code: 'BAT-01' },
    update: {},
    create: {
      name: 'Battery Bank Room',
      code: 'BAT-01',
      floor: 'ชั้น 1',
      description: 'ห้องแบตเตอรี่ VRLA สำหรับระบบสำรองไฟฉุกเฉิน',
    },
  });

  const roomChiller = await prisma.room.upsert({
    where: { code: 'CHILL-01' },
    update: {},
    create: {
      name: 'Chiller & Outdoor Mechanical Yard',
      code: 'CHILL-01',
      floor: 'ดาดฟ้า / Yard',
      description: 'ระบบทำน้ำเย็นและปั๊มน้ำหมุนเวียนระบายความร้อน',
    },
  });

  console.log('🏢 Rooms seeded: SR-01, UPS-01, BAT-01, CHILL-01');

  // 3. Create Equipment Types with Dynamic Fields
  const typePdu = await prisma.equipmentType.upsert({
    where: { name: 'PDU (Power Distribution Unit)' },
    update: {},
    create: {
      name: 'PDU (Power Distribution Unit)',
      category: 'ELECTRICAL',
      fieldsConfig: JSON.stringify([
        { key: 'v_a', label: 'แรงดันไฟฟ้า Phase A', type: 'number', unit: 'V', min: 210, max: 240 },
        { key: 'v_b', label: 'แรงดันไฟฟ้า Phase B', type: 'number', unit: 'V', min: 210, max: 240 },
        { key: 'v_c', label: 'แรงดันไฟฟ้า Phase C', type: 'number', unit: 'V', min: 210, max: 240 },
        { key: 'i_a', label: 'กระแส Phase A', type: 'number', unit: 'A' },
        { key: 'i_b', label: 'กระแส Phase B', type: 'number', unit: 'A' },
        { key: 'i_c', label: 'กระแส Phase C', type: 'number', unit: 'A' },
        { key: 'kw', label: 'กำลังไฟฟ้ารวม (Active Power)', type: 'number', unit: 'kW' },
      ]),
    },
  });

  const typeUps = await prisma.equipmentType.upsert({
    where: { name: 'UPS (Uninterruptible Power Supply)' },
    update: {},
    create: {
      name: 'UPS (Uninterruptible Power Supply)',
      category: 'ELECTRICAL',
      fieldsConfig: JSON.stringify([
        { key: 'input_v', label: 'Input Voltage L-L', type: 'number', unit: 'V', min: 380, max: 415 },
        { key: 'output_v', label: 'Output Voltage L-L', type: 'number', unit: 'V', min: 380, max: 415 },
        { key: 'load_pct', label: 'โหลดใช้งาน (Load %)', type: 'number', unit: '%', max: 80 },
        { key: 'battery_v', label: 'แรงดัน Battery Float', type: 'number', unit: 'Vdc' },
        { key: 'kw', label: 'กำลังไฟฟ้าขาออก', type: 'number', unit: 'kW' },
      ]),
    },
  });

  const typeCrac = await prisma.equipmentType.upsert({
    where: { name: 'CRAC / Precision Aircon' },
    update: {},
    create: {
      name: 'CRAC / Precision Aircon',
      category: 'COOLING',
      fieldsConfig: JSON.stringify([
        { key: 'return_temp', label: 'อุณหภูมิลมกลับ (Return Temp)', type: 'number', unit: '°C', min: 22, max: 27 },
        { key: 'supply_temp', label: 'อุณหภูมิลมจ่าย (Supply Temp)', type: 'number', unit: '°C', min: 18, max: 22 },
        { key: 'humidity', label: 'ความชื้นสัมพัทธ์ (Relative Humidity)', type: 'number', unit: '%RH', min: 40, max: 60 },
        { key: 'fan_speed', label: 'ความเร็วพัดลม EC Fan', type: 'number', unit: '%' },
      ]),
    },
  });

  console.log('⚙️ Equipment Types seeded');

  // 4. Create Equipments with QR Codes
  const pdu1 = await prisma.equipment.upsert({
    where: { code: 'PDU-SR1-01' },
    update: {},
    create: {
      name: 'PDU Server Hall Row A-B',
      code: 'PDU-SR1-01',
      qrCode: 'DCEQ-PDU-SR1-01',
      roomId: roomServer1.id,
      typeId: typePdu.id,
      normalRanges: JSON.stringify({ minV: 220, maxV: 240, maxKw: 80 }),
    },
  });

  const ups1 = await prisma.equipment.upsert({
    where: { code: 'UPS-A-500KVA' },
    update: {},
    create: {
      name: 'UPS System A (500 kVA)',
      code: 'UPS-A-500KVA',
      qrCode: 'DCEQ-UPS-A-500KVA',
      roomId: roomUPS.id,
      typeId: typeUps.id,
      normalRanges: JSON.stringify({ maxLoadPct: 75, maxKw: 400 }),
    },
  });

  const crac1 = await prisma.equipment.upsert({
    where: { code: 'CRAC-SR1-01' },
    update: {},
    create: {
      name: 'Precision AC Unit 01 (Row A)',
      code: 'CRAC-SR1-01',
      qrCode: 'DCEQ-CRAC-SR1-01',
      roomId: roomServer1.id,
      typeId: typeCrac.id,
      normalRanges: JSON.stringify({ minTemp: 19, maxTemp: 26, minHum: 40, maxHum: 60 }),
    },
  });

  const crac2 = await prisma.equipment.upsert({
    where: { code: 'CRAC-SR1-02' },
    update: {},
    create: {
      name: 'Precision AC Unit 02 (Row B)',
      code: 'CRAC-SR1-02',
      qrCode: 'DCEQ-CRAC-SR1-02',
      roomId: roomServer1.id,
      typeId: typeCrac.id,
      normalRanges: JSON.stringify({ minTemp: 19, maxTemp: 26, minHum: 40, maxHum: 60 }),
    },
  });

  console.log('📦 Equipments seeded: PDU-SR1-01, UPS-A-500KVA, CRAC-SR1-01, CRAC-SR1-02');

  // 5. Create Sample Rounds & Logs for Dashboard Trends
  const sampleRound = await prisma.inspectionRound.create({
    data: {
      shiftName: 'กะเช้า (08:00 - 16:00)',
      inspectorId: operator.id,
      status: 'COMPLETED',
      startedAt: new Date(Date.now() - 4 * 3600 * 1000),
      completedAt: new Date(Date.now() - 3 * 3600 * 1000),
      notes: 'ตรวจสอบรอบเช้า ระบบทั่วไปปกติ มีจุดสังเกตอุณหภูมิลมกลับ CRAC 02 เริ่มสูงขึ้น',
    },
  });

  // Seed sample logs across past 48 hours for nice graph
  const timestamps = [
    new Date(Date.now() - 48 * 3600 * 1000),
    new Date(Date.now() - 36 * 3600 * 1000),
    new Date(Date.now() - 24 * 3600 * 1000),
    new Date(Date.now() - 12 * 3600 * 1000),
    new Date(Date.now() - 4 * 3600 * 1000),
  ];

  for (let i = 0; i < timestamps.length; i++) {
    const t = timestamps[i];
    // CRAC 1 - Normal around 22.5°C
    await prisma.inspectionLog.create({
      data: {
        roundId: sampleRound.id,
        equipmentId: crac1.id,
        readings: JSON.stringify({
          return_temp: 22.8 + (i * 0.2),
          supply_temp: 18.5,
          humidity: 48 + (i % 3),
          fan_speed: 70,
        }),
        isDefect: false,
        recordedAt: t,
      },
    });

    // CRAC 2 - High temperature Hotspot around 27.2°C in last check!
    const isHotspot = i === timestamps.length - 1;
    await prisma.inspectionLog.create({
      data: {
        roundId: sampleRound.id,
        equipmentId: crac2.id,
        readings: JSON.stringify({
          return_temp: isHotspot ? 27.4 : 24.1 + (i * 0.4),
          supply_temp: 19.8,
          humidity: 52,
          fan_speed: 85,
        }),
        isDefect: isHotspot,
        defectNote: isHotspot ? 'อุณหภูมิลมกลับสูงเกินเกณฑ์มาตรฐาน (Hotspot 27.4°C) บริเวณตู้ Rack ท้ายแถว' : null,
        recordedAt: t,
      },
    });

    // PDU 1 Power Readings
    await prisma.inspectionLog.create({
      data: {
        roundId: sampleRound.id,
        equipmentId: pdu1.id,
        readings: JSON.stringify({
          v_a: 231,
          v_b: 230,
          v_c: 229,
          i_a: 78,
          i_b: 75,
          i_c: 77,
          kw: 52.5 + (i * 1.8),
        }),
        isDefect: false,
        recordedAt: t,
      },
    });
  }

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
