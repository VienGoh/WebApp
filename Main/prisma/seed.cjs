// prisma/seed.cjs
const { PrismaClient } = require('@prisma/client');
const { fakerID_ID: faker } = require('@faker-js/faker'); // locale Indonesia

const prisma = new PrismaClient();

// =================== CONFIG (ringan) ===================
const N_MECHANICS = 3;
const DAYS = 892;                      // jumlah hari ke belakang
const ORDERS_PER_DAY = 4;              // 6 servis per hari
const N_SERVICE_ORDERS = DAYS * ORDERS_PER_DAY; // auto 2190
const N_CUSTOMERS = 700;               // cukup untuk kebutuhan order
const AVG_VEHICLES_PER_CUSTOMER = 1.1; // kebanyakan 1 motor
const N_PARTS = 200;                   // parts cukup
const BATCH_SIZE = 200;                // createMany chunk
const ORDER_BATCH_SIZE = 30;           // paralel kecil (anti timeout)
const BATCH_DELAY_MS = 120;            // jeda antar batch
// =======================================================

// Helpers
function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Telepon +62 (contoh: +62812xxxxxxx)
function phoneID() {
  const prefixes = ['812','813','814','815','816','817','818','819','851','852','853','855','856','857','858','859','877','878','879','881','882','883','885','886','887','888','889'];
  const pref = pick(prefixes);
  let tail = '';
  const len = randInt(7,9); // total digit setelah prefix 7-9
  for (let i = 0; i < len; i++) tail += randInt(0,9);
  return `+62${pref}${tail}`;
}

// Plat Medan (BK)
function generatePlate(existing) {
  let plate;
  do {
    const number = String(randInt(1000, 9999));
    const letters = faker.helpers.arrayElements('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), 2).join('');
    plate = `BK ${number} ${letters}`;
  } while (existing.has(plate));
  existing.add(plate);
  return plate;
}

// Motor populer di Indonesia
const MOTOR_BRANDS = {
  Honda: ['Beat','Vario 125','Vario 150','Scoopy','PCX','CB150R','Revo','Supra X 125'],
  Yamaha: ['NMAX','Aerox','Mio','Fino','R15','Jupiter Z1','Vega'],
  Suzuki: ['Satria F150','Address','Nex II','GSX R150'],
  Kawasaki: ['W175','KLX 150'],
  TVS: ['Neo XR','Rockz']
};

// Parts (ringkas)
const PART_CATEGORIES = [
  { cat: 'Oli Mesin', variants: ['10W-30','10W-40','Matic'], min: 45000, max: 160000, weight: 10 },
  { cat: 'Kampas Rem', variants: ['Depan','Belakang'], min: 30000, max: 110000, weight: 7 },
  { cat: 'Busi', variants: ['Standard','Iridium'], min: 20000, max: 90000, weight: 6 },
  { cat: 'Filter Udara', variants: ['Foam','Kertas'], min: 30000, max: 120000, weight: 3 },
  { cat: 'Belt CVT', variants: ['Matic 110','Matic 125','Matic 150'], min: 120000, max: 450000, weight: 2 },
];
function weightedPick(categories) {
  const total = categories.reduce((a, c) => a + (c.weight || 1), 0);
  let r = Math.random() * total;
  for (const c of categories) { r -= (c.weight || 1); if (r <= 0) return c; }
  return categories[categories.length - 1];
}

// Tanggal servis tersebar: 6 order per hari (acak jamnya)
function serviceDateForIndex(i) {
  const dayIndex = Math.floor(i / ORDERS_PER_DAY); // 0..DAYS-1
  const base = new Date();
  base.setHours(9, 0, 0, 0);
  base.setDate(base.getDate() - (DAYS - 1 - dayIndex));
  // acak jam antara 09:00–17:30
  const minutes = randInt(0, 510); // 8.5 jam
  base.setMinutes(base.getMinutes() + minutes);
  return base;
}

(async function main() {
  try {
    console.log('Seed start...');

    // Bersihkan data lama (aman re-run)
    console.log('Clearing tables...');
    await prisma.servicePart.deleteMany();
    await prisma.serviceItem.deleteMany();
    await prisma.serviceOrder.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.part.deleteMany();
    await prisma.mechanic.deleteMany();
    await prisma.user.deleteMany();
    console.log('Tables cleared.');

    // Mechanics (3 orang)
    console.log('Seeding mechanics...');
    const mechanicNames = ['Andi Saputra','Budi Santoso','Citra Lestari'];
    await prisma.mechanic.createMany({
      data: mechanicNames.map(n => ({ name: n, active: true }))
    });
    const mechanics = await prisma.mechanic.findMany();

    // Parts
    console.log('Seeding parts...');
    const partRows = [];
    for (let i = 0; i < N_PARTS; i++) {
      const cat = weightedPick(PART_CATEGORIES);
      const variant = pick(cat.variants);
      partRows.push({
        sku: `P-${10000 + i}`,
        name: `${cat.cat} ${variant}`,
        price: Math.round(Math.random() * (cat.max - cat.min) + cat.min)
      });
    }
    await prisma.part.createMany({ data: partRows });
    const parts = await prisma.part.findMany();

    // Customers (nama Indonesia + telepon +62)
    console.log('Seeding customers...');
    const customers = [];
    for (let i = 0; i < N_CUSTOMERS; i++) {
      const full = faker.person.fullName(); // Indonesia locale
      customers.push({
        name: full,
        email: faker.internet.email({ firstName: full.split(' ')[0] }).toLowerCase(),
        phone: phoneID()
      });
    }
    for (const ch of chunkArray(customers, BATCH_SIZE)) {
      await prisma.customer.createMany({ data: ch });
      process.stdout.write('.');
    }
    console.log('\ncustomers done');

    // Vehicles (hanya motor)
    console.log('Seeding vehicles...');
    const customersDB = await prisma.customer.findMany({ select: { id: true } });
    const existingPlates = new Set();
    const vehicles = [];
    for (const c of customersDB) {
      const n = Math.random() < 0.9 ? 1 : (Math.random() < 0.5 ? 2 : 1);
      for (let k = 0; k < n; k++) {
        const brand = pick(Object.keys(MOTOR_BRANDS));
        const model = pick(MOTOR_BRANDS[brand]);
        vehicles.push({
          customerId: c.id,
          plate: generatePlate(existingPlates),
          brand,
          model,
          year: randInt(2010, 2024),
          serviceIntervalDays: 180
        });
      }
    }
    for (const ch of chunkArray(vehicles, BATCH_SIZE)) {
      await prisma.vehicle.createMany({ data: ch });
      process.stdout.write('.');
    }
    console.log('\nvehicles done');
    const vehiclesDB = await prisma.vehicle.findMany({ select: { id: true } });

    // Service Orders — 6 per hari
    console.log('Seeding service orders (low concurrency)...');
    const createOrder = async (i) => {
      const v = pick(vehiclesDB);
      const mech = pick(mechanics);
      const order = await prisma.serviceOrder.create({
        data: {
          vehicleId: v.id,
          mechanicId: mech.id,
          date: serviceDateForIndex(i),
          odometer: randInt(5000, 90000),
          notes: Math.random() < 0.25 ? faker.lorem.sentence() : null
        }
      });

      // Jasa (1–2)
      const nItems = randInt(1, 2);
      await prisma.serviceItem.createMany({
        data: Array.from({ length: nItems }).map(() => ({
          serviceOrderId: order.id,
          name: pick(['Ganti Oli','Tune Up','Ganti Kampas Rem','Service Rutin']),
          price: randInt(20000, 250000)
        }))
      });

      // Part (0–1) unik per order
      if (Math.random() < 0.6) {
        const cat = weightedPick(PART_CATEGORIES);
        const cands = parts.filter(p => p.name.startsWith(cat.cat));
        const part = pick(cands.length ? cands : parts);
        await prisma.servicePart.create({
          data: {
            serviceOrderId: order.id,
            partId: part.id,
            qty: randInt(1, 2),
            unitPrice: part.price
          }
        });
      }
    };

    const total = N_SERVICE_ORDERS;
    const totalBatches = Math.ceil(total / ORDER_BATCH_SIZE);
    let idx = 0;
    for (let b = 0; b < totalBatches; b++) {
      const jobs = [];
      for (let j = 0; j < ORDER_BATCH_SIZE && idx < total; j++, idx++) {
        jobs.push(createOrder(idx));
      }
      await Promise.all(jobs);
      process.stdout.write('.');
      await sleep(BATCH_DELAY_MS);
    }
    console.log('\nservice orders done');

const bcrypt = require('bcryptjs');

// ...
console.log('Seeding users...');
const adminHash    = bcrypt.hashSync('admin123', 10);
const penelitiHash = bcrypt.hashSync('peneliti123', 10);

await prisma.user.createMany({
  data: [
    { name: 'Admin',    email: 'admin@example.com',    password: adminHash,    role: 'ADMIN' },
    { name: 'Peneliti', email: 'peneliti@example.com', password: penelitiHash, role: 'PENELITI' }
  ]
});


    console.log('\n✅ SEED FINISHED SUCCESSFULLY');
  } catch (e) {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
