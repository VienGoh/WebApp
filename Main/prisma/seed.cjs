// prisma/seed.cjs
const { PrismaClient } = require("@prisma/client");
const { fakerID_ID: faker } = require("@faker-js/faker");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

// =================== CONFIG ===================
const N_MECHANICS = 3;
const DAYS = 892;                             
const ORDERS_PER_DAY = 4;                     
const N_SERVICE_ORDERS = DAYS * ORDERS_PER_DAY;
const N_CUSTOMERS = 700;
const N_PARTS = 40;
const BATCH_SIZE = 200;
const ORDER_BATCH_SIZE = 30;
const BATCH_DELAY_MS = 120;
// ==============================================

// Helpers
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// Harga kelipatan 500
function priceStep(min, max, step = 500) {
  const nMin = Math.ceil(min / step);
  const nMax = Math.floor(max / step);
  return randInt(nMin, nMax) * step;
}

// ===== Nama Indonesia 1–2 kata =====
const FIRST = [
  "Andi","Budi","Citra","Dewi","Eka","Fajar","Gilang","Hendra","Indah","Joko",
  "Kurnia","Lestari","Mira","Nanda","Oki","Putri","Rizki","Sari","Taufik","Wulan",
];

const LAST = [
  "Saputra","Santoso","Pratama","Wijaya","Hutapea","Siregar","Simanjuntak",
  "Sinaga","Nasution","Halim","Gunawan","Mahendra","Permata","Ramadhan",
  "Maulana","Kusuma","Syahputra","Hidayat","Panjaitan","Tanjung",
];

function randomIndoName() {
  const f = pick(FIRST);
  const l = pick(LAST);
  return Math.random() < 0.2 ? f : `${f} ${l}`;
}

// ===== Telepon +62 valid =====
function phoneID() {
  const prefixes = [
    "811","812","813","814","815","816","817","818","819",
    "821","822","823",
    "851","852","853","855","856","857","858","859",
    "877","878","879",
    "881","882","883","885","886","887","888","889",
  ];
  const pref = pick(prefixes);
  let tail = "";
  const len = randInt(7, 9);
  for (let i = 0; i < len; i++) tail += randInt(0, 9);
  return `+62${pref}${tail}`;
}

// ===== Plat BK =====
const SUFFIXES = ["AA","AB","AC","AD","AE","AF","AG","AH","AK","AL",
                  "BA","BB","BC","BD","BE","BF","BG","BH","BK","BL",
                  "CA","CB","CC","CD","CE"];

function generatePlate(set) {
  let p;
  do {
    p = `BK ${randInt(2000, 6000)} ${pick(SUFFIXES)}`;
  } while (set.has(p));
  set.add(p);
  return p;
}

// ===== Motor =====
const MOTOR = {
  Honda: ["Beat","Vario 125","Vario 150","Scoopy","PCX","CB150R","Revo","Supra X 125"],
  Yamaha: ["NMAX","Aerox","Mio","Fino","R15","Jupiter Z1","Vega"],
  Suzuki: ["Satria F150","Address","Nex II","GSX R150"],
  Kawasaki: ["W175","KLX 150"],
  TVS: ["Neo XR","Rockz"]
};

// ===== Sparepart kategori (normal) =====
const PART_CATEGORIES = [
  { cat: "Oli Mesin", variants: ["10W-30","10W-40","20W-50","Matic","Synthetic"], min: 50000, max: 160000, weight: 10 },
  { cat: "Kampas Rem Depan", variants: ["Honda","Yamaha","Suzuki","Kawasaki"], min: 35000, max: 120000, weight: 7 },
  { cat: "Kampas Rem Belakang", variants: ["Honda","Yamaha","Suzuki","Kawasaki"], min: 35000, max: 120000, weight: 7 },
  { cat: "Busi", variants: ["CR7HSA","CPR8EA-9","Iridium","Standard"], min: 20000, max: 90000, weight: 6 },
  { cat: "Filter Udara", variants: ["Foam","Kertas","Performance"], min: 30000, max: 130000, weight: 4 },
  { cat: "Rantai", variants: ["420","428","520","O-Ring"], min: 80000, max: 350000, weight: 3 },
  { cat: "Gir Depan", variants: ["12T","13T","14T","15T"], min: 25000, max: 90000, weight: 3 },
  { cat: "Gir Belakang", variants: ["34T","36T","38T","40T"], min: 45000, max: 180000, weight: 3 },
  { cat: "Ban Dalam", variants: ["70/90-17","80/90-17","90/90-14","Tubetype"], min: 25000, max: 80000, weight: 3 },
  { cat: "Ban Luar", variants: ["70/90-17","80/90-17","90/90-14","Street"], min: 180000, max: 600000, weight: 2 },
];

function weightedPick(list) {
  const sum = list.reduce((a, c) => a + (c.weight || 1), 0);
  let r = Math.random() * sum;
  for (const c of list) {
    r -= (c.weight || 1);
    if (r <= 0) return c;
  }
  return list[list.length - 1];
}

// ===== Sparepart mahal =====
const EXPENSIVE = [
  { name: "Blok Mesin Set Honda 150cc", min: 1200000, max: 2500000 },
  { name: "Blok Mesin Set Yamaha 155cc", min: 1200000, max: 2500000 },
  { name: "Blok Mesin Set Suzuki 150cc", min: 1100000, max: 2300000 },
  { name: "Head Cylinder Assy 150cc", min: 900000, max: 2000000 },
  { name: "Kit Overhaul CVT Matic 150cc", min: 800000, max: 1800000 }
];
const NOTES = [
  "Keluhan: mesin terasa kurang bertenaga.",
  "Keluhan: rem depan kurang pakem.",
  "Keluhan: muncul suara berisik dari area CVT.",
  "Keluhan: motor susah dinyalakan saat pagi.",
  "Keluhan: tarikan berat saat di tanjakan.",
  "Keluhan: getaran terasa pada kecepatan tinggi.",
  "Keluhan: knalpot mengeluarkan asap putih.",
  "Keluhan: mesin cepat panas.",
  "Keluhan: indikator oli sering menyala.",
  "Keluhan: ada suara tek-tek pada bagian mesin."
];


// ===== Tanggal Servis =====
function serviceDate(i) {
  const idx = Math.floor(i / ORDERS_PER_DAY);
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  d.setDate(d.getDate() - (DAYS - 1 - idx));
  d.setMinutes(d.getMinutes() + randInt(0, 510));
  return d;
}

// ===============================================================
//                        MAIN SEEDER
// ===============================================================
(async function main() {
  try {
    console.log("Clearing...");
    await prisma.servicePart.deleteMany();
    await prisma.serviceItem.deleteMany();
    await prisma.serviceOrder.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.part.deleteMany();
    await prisma.mechanic.deleteMany();
    await prisma.user.deleteMany();

    // ===== Mechanics =====
    await prisma.mechanic.createMany({
      data: [
        { name: "Andi Saputra", active: true },
        { name: "Budi Santoso", active: true },
      ],
    });

    const mechanics = await prisma.mechanic.findMany();

    // ===== Sparepart =====
    let parts = [];
    let sku = 10000;

    // Part mahal dulu
    for (const p of EXPENSIVE) {
      parts.push({
        sku: `P-${sku++}`,
        name: p.name,
        price: priceStep(p.min, p.max),
      });
    }

    // Part normal
    for (const c of PART_CATEGORIES) {
      for (const v of c.variants) {
        parts.push({
          sku: `P-${sku++}`,
          name: `${c.cat} ${v}`,
          price: priceStep(c.min, c.max),
        });
      }
    }

    parts = parts.slice(0, N_PARTS);
    await prisma.part.createMany({ data: parts });
    parts = await prisma.part.findMany();

    const expensiveParts = parts.filter(
      (p) =>
        p.name.includes("Blok Mesin") ||
        p.name.includes("Head Cylinder") ||
        p.name.includes("Kit Overhaul")
    );

    // ===== Customers =====
    const customers = [];
    for (let i = 0; i < N_CUSTOMERS; i++) {
      const nm = randomIndoName();
      customers.push({
        name: nm,
        email: faker.internet.email({ firstName: nm.split(" ")[0] }).toLowerCase(),
        phone: phoneID(),
      });
    }

    for (const c of chunk(customers, BATCH_SIZE)) {
      await prisma.customer.createMany({ data: c });
    }

    const customersDB = await prisma.customer.findMany({ select: { id: true } });

    // ===== Vehicles =====
    const plateSet = new Set();
    const vehicles = [];

    for (const c of customersDB) {
      const count = Math.random() < 0.9 ? 1 : 2;
      for (let k = 0; k < count; k++) {
        const brand = pick(Object.keys(MOTOR));
        vehicles.push({
          customerId: c.id,
          plate: generatePlate(plateSet),
          brand,
          model: pick(MOTOR[brand]),
          year: randInt(2010, 2024),
          serviceIntervalDays: 180,
        });
      }
    }

    for (const v of chunk(vehicles, BATCH_SIZE)) {
      await prisma.vehicle.createMany({ data: v });
    }

    const vehiclesDB = await prisma.vehicle.findMany();

    // ==========================================================
    //                  SERVICE ORDERS (fix duplicate)
    // ==========================================================
    console.log("Seeding service orders...");

    for (let i = 0; i < N_SERVICE_ORDERS; i++) {
      const v = pick(vehiclesDB);
      const mech = pick(mechanics);
      const isHigh = Math.random() < 0.05;

      const order = await prisma.serviceOrder.create({
        data: {
          vehicleId: v.id,
          mechanicId: mech.id,
          date: serviceDate(i),
          odometer: randInt(5000, 90000),
          notes: Math.random() < 0.25 ? pick(NOTES) : null,
        },
      });

      let items = [];
      let partsUsed = [];
      let usedPartIds = new Set();

      if (!isHigh) {
        // NORMAL ORDER 50k–150k
        items.push({
          serviceOrderId: order.id,
          name: pick(["Service Rutin", "Ganti Oli", "Ganti Kampas Rem", "Tune Up"]),
          price: priceStep(50000, 110000),
        });

        if (Math.random() < 0.4) {
          items.push({
            serviceOrderId: order.id,
            name: pick(["Cek kelistrikan", "Setel rantai", "Bersihkan CVT"]),
            price: priceStep(5000, 20000),
          });
        }

        if (Math.random() < 0.6) {
          const cat = weightedPick(PART_CATEGORIES);
          const cand = parts.filter((p) => p.name.startsWith(cat.cat));
          const pr = pick(cand.length ? cand : parts);

          if (!usedPartIds.has(pr.id)) {
            usedPartIds.add(pr.id);
            partsUsed.push({
              serviceOrderId: order.id,
              partId: pr.id,
              qty: 1,
              unitPrice: priceStep(10000, 20000),
            });
          }
        }
      } else {
        // HIGH COST 500k–2M
        items.push({
          serviceOrderId: order.id,
          name: pick(["Overhaul Mesin", "Turun Mesin & Overhaul", "Perbaikan Berat Mesin"]),
          price: priceStep(100000, 300000),
        });

        if (Math.random() < 0.7) {
          items.push({
            serviceOrderId: order.id,
            name: pick(["Setel klep", "Ganti oli gardan", "Cek kelistrikan lengkap"]),
            price: priceStep(50000, 150000),
          });
        }

        const n = randInt(2, 4);
        const highList = expensiveParts.length ? expensiveParts : parts;

        for (let x = 0; x < n; x++) {
          let pr;
          let tries = 0;

          // cari part unik
          do {
            pr = pick(highList);
            tries++;
          } while (usedPartIds.has(pr.id) && tries < 10);

          if (usedPartIds.has(pr.id)) break;

          usedPartIds.add(pr.id);
          partsUsed.push({
            serviceOrderId: order.id,
            partId: pr.id,
            qty: 1,
            unitPrice: priceStep(200000, 400000),
          });
        }
      }

      if (items.length) await prisma.serviceItem.createMany({ data: items });
      if (partsUsed.length) await prisma.servicePart.createMany({ data: partsUsed });

      if (i % 200 === 0) process.stdout.write(".");
      if (i % ORDER_BATCH_SIZE === 0) await sleep(BATCH_DELAY_MS);
    }

    // ===== Users =====
    await prisma.user.createMany({
      data: [
        { name: "Admin", email: "admin@example.com", password: bcrypt.hashSync("admin123", 10), role: "ADMIN" },
        { name: "Peneliti", email: "peneliti@example.com", password: bcrypt.hashSync("peneliti123", 10), role: "PENELITI" },
      ],
    });

    console.log("\nSEEDING COMPLETED SUCCESSFULLY!");
  } catch (e) {
    console.error("❌ ERROR:", e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
