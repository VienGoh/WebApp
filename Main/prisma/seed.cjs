// prisma/seed.cjs
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function upsertUsers() {
  const adminHash = await bcrypt.hash("admin123", 10);
  const penelitiHash = await bcrypt.hash("peneliti123", 10);

  await prisma.user.upsert({
    where: { email: "admin@local.test" },
    update: {},
    create: {
      email: "admin@local.test",
      name: "Admin",
      password: adminHash,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "peneliti@local.test" },
    update: {},
    create: {
      email: "peneliti@local.test",
      name: "Peneliti",
      password: penelitiHash,
      role: "PENELITI",
    },
  });

  console.log("✓ Users (ADMIN & PENELITI)");
}

async function seedMasters() {
  // Customers
  const c1 = await prisma.customer.create({
    data: { name: "Budi Santoso", phone: "0812-1111-2222", email: "budi@example.com" },
  });
  const c2 = await prisma.customer.create({
    data: { name: "Siti Rahma", phone: "0812-3333-4444", email: "siti@example.com" },
  });

  // Vehicles (plate unique, serviceIntervalDays ada default 180)
  const v1 = await prisma.vehicle.upsert({
    where: { plate: "BK1234AA" },
    update: {},
    create: {
      customerId: c1.id,
      plate: "BK1234AA",
      brand: "Toyota",
      model: "Avanza",
      year: 2018,
      // serviceIntervalDays akan pakai default 180
    },
  });

  const v2 = await prisma.vehicle.upsert({
    where: { plate: "BK9876ZZ" },
    update: {},
    create: {
      customerId: c2.id,
      plate: "BK9876ZZ",
      brand: "Honda",
      model: "Brio",
      year: 2020,
    },
  });

  // Mechanics (name unique)
  const m1 = await prisma.mechanic.upsert({
    where: { name: "Anton" },
    update: {},
    create: { name: "Anton", active: true },
  });
  const m2 = await prisma.mechanic.upsert({
    where: { name: "Rudi" },
    update: {},
    create: { name: "Rudi", active: true },
  });

  // Parts (sku optional tapi kita isi agar unik)
  const pOil = await prisma.part.upsert({
    where: { sku: "OIL-10W40-1L" },
    update: {},
    create: { sku: "OIL-10W40-1L", name: "Oli Mesin 10W-40 1L", price: 95000 },
  });
  const pFilter = await prisma.part.upsert({
    where: { sku: "FLT-ENG-AVZ" },
    update: {},
    create: { sku: "FLT-ENG-AVZ", name: "Filter Oli Avanza", price: 45000 },
  });
  const pBrake = await prisma.part.upsert({
    where: { sku: "BRK-PAD-FR" },
    update: {},
    create: { sku: "BRK-PAD-FR", name: "Kampas Rem Depan", price: 185000 },
  });

  console.log("✓ Masters (Customer, Vehicle, Mechanic, Part)");

  return { vehicles: { v1, v2 }, mechanics: { m1, m2 }, parts: { pOil, pFilter, pBrake } };
}

async function seedTransactions(ctx) {
  const { v1, v2 } = ctx.vehicles;
  const { m1 } = ctx.mechanics;
  const { pOil, pFilter, pBrake } = ctx.parts;

  // Service Order untuk v1 (ganti oli + filter)
  await prisma.serviceOrder.create({
    data: {
      vehicleId: v1.id,
      mechanicId: m1.id,
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 30 hari lalu
      odometer: 45000,
      notes: "Servis berkala 10.000 km",
      items: {
        create: [
          { name: "Jasa Ganti Oli", price: 30000 },
          { name: "Pemeriksaan Umum", price: 20000 },
        ],
      },
      parts: {
        create: [
          { partId: pOil.id, qty: 3, unitPrice: pOil.price },
          { partId: pFilter.id, qty: 1, unitPrice: pFilter.price },
        ],
      },
    },
  });

  // Service Order untuk v2 (cek rem + ganti kampas)
  await prisma.serviceOrder.create({
    data: {
      vehicleId: v2.id,
      mechanicId: m1.id,
      date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10), // 10 hari lalu
      odometer: 22000,
      notes: "Rem depan bunyi",
      items: {
        create: [{ name: "Jasa Ganti Kampas Rem", price: 40000 }],
      },
      parts: {
        create: [{ partId: pBrake.id, qty: 1, unitPrice: pBrake.price }],
      },
    },
  });

  console.log("✓ Transactions (ServiceOrder, ServiceItem, ServicePart)");
}

async function main() {
  await upsertUsers();
  const ctx = await seedMasters();
  await seedTransactions(ctx);
  console.log("✅ SEED SELESAI");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
