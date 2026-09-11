# Data Center Operation & Energy Inspection Web Application
### ระบบตรวจการ Data Center & อนุรักษ์พลังงาน (DCIM Routine Patrol)

เว็บแอปพลิเคชันสำหรับงานปฏิบัติการและเดินตรวจรอบ Data Center (Routine Patrol / Inspection) รองรับการใช้งานพร้อมกัน 7+ คนบนมือถือและคอมพิวเตอร์ ทำงานในจุดอับสัญญาณได้ (Offline PWA) พร้อมแดชบอร์ดวิเคราะห์อุณหภูมิ ความชื้น กำลังไฟฟ้า และการอนุรักษ์พลังงาน ออกแบบในสไตล์ **Enterprise SCADA & Industrial Control Interface** ที่มีความเป็นทางการ โทนสีสุภาพ และปราศจากเอฟเฟกต์สีรุ้งหรืออิโมจิ

> 📖 **คู่มือการใช้งานระบบฉบับสมบูรณ์ (System Manual):** สามารถอ่านรายละเอียดขั้นตอนการปฏิบัติงานของช่างและแอดมินฉบับเต็มได้ที่ไฟล์ [`SYSTEM_MANUAL.md`](file:///d:/WebApp/Operation%20Service/SYSTEM_MANUAL.md)

---

## ฟังก์ชันเด่นของระบบ (Key Features)

1. **ระบบการเดินตรวจรอบ (Routine Inspection):**
   - **ดรอปดาวน์เลือกอุปกรณ์ด่วน:** พนักงานสามารถคลิกดรอปดาวน์แล้วเลือกชื่ออุปกรณ์ที่ต้องการตรวจได้ทันที พร้อมมีป้าย `[ตรวจแล้ว]` หรือ `[รอตรวจ]` กำกับชัดเจน
   - **ปุ่ม "ตรวจจุดถัดไป":** คลิกเดียวเพื่อสลับไปยังอุปกรณ์ที่ยังไม่ได้ตรวจตัวถัดไปให้อัตโนมัติโดยไม่ต้องกลับไปค้นหา
   - **Checklist สรุปรายการทุกห้อง:** มีการ์ดบอกสถานะจำนวนจุดที่ตรวจแล้วในแต่ละห้อง (เช่น `ตรวจแล้ว (2/2)`) และปุ่มเปิดดู Checklist ทั้งหมดว่าเหลือจุดใดค้างอยู่บ้าง พร้อมปุ่มคลิกกระโดดไปตรวจจุดนั้นได้ทันที
   - **ระบบป้องกันการตรวจตกหล่น (Completion Guard):** หากกดปิดรอบตรวจโดยที่ยังมีอุปกรณ์ค้างอยู่ ระบบจะแสดงหน้าต่างเตือนและแจกแจงรายการที่ยังตกค้างก่อนยืนยัน
   - **สแกน QR Code ประจำตู้:** รองรับการเปิดกล้องมือถือสแกน QR Code เพื่อเปิดฟอร์มของอุปกรณ์นั้นได้ทันที หรือเลือกจากรายการห้อง/อุปกรณ์
   - **Dynamic Fields ตามประเภทอุปกรณ์:** กรอกค่าเฉพาะที่จำเป็นสำหรับอุปกรณ์แต่ละประเภท (เช่น PDU วัด Voltage 3 เฟส + Current + kW, CRAC แอร์วัด Temp + Humidity, Battery วัด Vdc)
   - **บันทึกภาพถ่ายเฉพาะจุดบกพร่อง (Defect Only):** แนบภาพถ่ายเมื่อพบความผิดปกติ พร้อมระบบย่อขนาดภาพอัตโนมัติบนเครื่อง (Canvas Compression < 300 KB) เพื่อประหยัดดาต้าและอัปโหลดได้รวดเร็ว
2. **รองรับโหมดออฟไลน์ (Offline Mode via IndexedDB):**
   - ในห้องอับสัญญาณ (เช่น Battery Room, ลานหม้อแปลง) สามารถบันทึกข้อมูลและรูปถ่ายลงเครื่องได้ตามปกติผ่าน Dexie.js
   - ระบบจะตรวจจับและทำการ Auto-Sync ข้อมูลขึ้นเซิร์ฟเวอร์ทันทีเมื่อกลับมามีสัญญาณเน็ต
3. **แดชบอร์ดและการอนุรักษ์พลังงาน (Energy & Climate Dashboard):**
   - **Hotspot Detection:** แจ้งเตือนจุดความร้อนสะสม (>26°C ตามเกณฑ์ ASHRAE) เพื่อตรวจสอบการไหลเวียนของลมเย็น (Airflow)
   - **Overcooling Detection:** ตรวจจับจุดที่ทำความเย็นเกินจำเป็น (<19°C) เพื่อเป็นโอกาสในการปรับจูน Setpoint แอร์และประหยัดพลังงาน
   - **Power Trends (kW):** กราฟแนวโน้มกำลังไฟฟ้าที่ใช้งานจริง
   - **Defects Gallery:** แกลเลอรีภาพถ่ายจุดผิดปกติพร้อมคลิกซูมดูรายละเอียด
4. **ระบบความปลอดภัยและผู้ใช้งาน (Role & Approval):**
   - พนักงานลงทะเบียนเอง (Self-Registration)
   - Admin เป็นผู้อนุมัติสิทธิ์ (Pending Approval Workflow) ก่อนเข้าใช้งาน
   - แบ่งสิทธิ์ชัดเจน: `ADMIN` (จัดการระบบ, จัดการห้อง/อุปกรณ์, อนุมัติผู้ใช้) และ `OPERATOR` (เดินตรวจรอบ)
5. **ป้าย QR Code ประจำอุปกรณ์:**
   - มีชุดชื่ออุปกรณ์มาตรฐานของ Data Center ให้เลือกใส่ทันที (Preset Options)
   - Admin สามารถดูและสั่งพิมพ์ (Print) ป้าย QR Code เพื่อนำไปติดหน้าตู้ Rack หรือหน้าปัดอุปกรณ์ใน Data Center ได้ทันที

---

## ข้อมูลบัญชีสำหรับทดสอบ (Demo Accounts)

| บทบาท (Role) | Username | Password | สิทธิ์การเข้าถึง |
|---|---|---|---|
| **ผู้ดูแลระบบ (Admin)** | `admin` | `admin123` | จัดการทุกส่วน, อนุมัติผู้ใช้, เพิ่มห้อง/อุปกรณ์, พิมพ์ QR, ดู Dashboard |
| **เจ้าหน้าที่ตรวจ (Operator)** | `technician1` | `tech123` | เริ่มรอบตรวจ, เลือกอุปกรณ์/สแกน QR, บันทึกค่า, แนบรูป Defect |

*(หน้าเข้าสู่ระบบมีปุ่ม Quick Switch บัญชีทดสอบให้คลิกกรอกอัตโนมัติได้ทันที)*

---

## วิธีการรันระบบ (How to Run)

### วิธีที่ 1: คลิกเดียวสำหรับ Windows (One-Click Start)
ดับเบิลคลิกไฟล์ **`start-dc-ops.bat`** ที่โฟลเดอร์หลัก ระบบจะเปิดทั้ง Backend (Port 5000) และ Frontend (Port 3000) ให้อัตโนมัติ

### วิธีที่ 2: รันผ่าน Terminal / Command Prompt

**1. เริ่มต้นเซิร์ฟเวอร์ Backend (Port 5000):**
```bash
cd backend
npm.cmd run dev
```

**2. เริ่มต้นเว็บแอปพลิเคชัน Frontend (Port 3000):**
```bash
cd frontend
npm.cmd run dev
```

เปิดบราวเซอร์ไปที่: **`http://localhost:3000`**

---

## โครงสร้างโปรเจกต์ (Project Structure)

```
d:\WebApp\Operation Service/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # โครงสร้างฐานข้อมูล SQLite/PostgreSQL
│   │   └── seed.ts            # ข้อมูลตั้งต้น (ห้อง, อุปกรณ์, บัญชีแอดมิน, ค่าตรวจตัวอย่าง)
│   ├── src/
│   │   ├── controllers/       # Auth, Room, Equipment, Inspection, Dashboard, Upload
│   │   ├── middleware/        # JWT Auth & Admin authorization
│   │   ├── routes/            # REST API endpoints
│   │   └── server.ts          # Express App
│   ├── uploads/               # โฟลเดอร์เก็บภาพถ่าย Defect
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/        # Navbar, QRScannerModal, ProtectedRoute
│   │   ├── context/           # AuthContext
│   │   ├── pages/             # Login, Register, Dashboard, Inspection, History, Admin
│   │   ├── services/          # api.ts (Axios), offlineDb.ts (Dexie IndexedDB)
│   │   └── App.tsx
│   ├── public/                # PWA manifest, Icons
│   └── package.json
├── start-dc-ops.bat           # สคริปต์คลิกเดียวเริ่มระบบ
├── README.md                  # สรุปภาพรวมโปรเจกต์ (ไฟล์นี้)
└── SYSTEM_MANUAL.md           # คู่มือการใช้งานระบบและแนวทางปฏิบัติงานฉบับละเอียด
```
