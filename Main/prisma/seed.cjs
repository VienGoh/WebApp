/* prisma/seed.cjs */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const r = (a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick = (arr)=>arr[r(0,arr.length-1)];

const FIRST = ["Budi","Andi","Rizky","Ahmad","Fajar","Dwi","Bayu","Rama","Yudha","Faris","Siti","Aisyah","Dewi","Nadia","Wulan","Indah","Rina","Putri","Aulia","Maya","Joko","Teguh","Hendra","Yoga","Galih"];
const LAST  = ["Santoso","Pratama","Nugraha","Saputra","Maulana","Firmansyah","Kurniawan","Wibowo","Setiawan","Wijaya","Lestari","Anggraini","Saraswati","Putri","Siregar"];
const REG   = ["B","D","F","H","L","N","AB","AE","AG","E","R","S","W","DK","KT","DA"];
const BRANDS = [
  ["Toyota",["Avanza","Kijang","Agya","Yaris"]],
  ["Honda",["Brio","Jazz","HR-V","CR-V"]],
  ["Daihatsu",["Xenia","Sigra","Ayla","Terios"]],
  ["Suzuki",["Ertiga","Karimun","Ignis","APV"]],
  ["Mitsubishi",["Xpander","Pajero","L300"]],
  ["Yamaha",["NMAX","Aerox","Mio"]],
  ["Honda (MC)",["Beat","Vario","Scoopy","CB150R"]],
];
const MECHS = ["Slamet Riyadi","Roni Saputra","Arif Kurnia","Dedi Hidayat","Imam Santoso","Tono Prasetyo","Jajang Sopyan"];
const ITEMS = [
  ["Ganti Oli",120_000],["Tune Up",180_000],["Service Rem",150_000],
  ["Spooring & Balancing",250_000],["Cek Kelistrikan",90_000],
  ["Ganti Busi",60_000],["Bersih Throttle Body",160_000],
];
const PARTS = [
  ["Oli Mesin 1L",95_000],["Filter Oli",45_000],["Filter Udara",75_000],
  ["Busi",35_000],["Kampas Rem",120_000],["Aki 35Ah",750_000],
  ["Karet Wiper",40_000],["V-Belt",85_000],
];

const plate = ()=>{
  const letters="BCDFGHJKLMNPRSTVWY"; let suf="";
  for(let i=0;i<r(2,3);i++) suf+=letters[r(0,letters.length-1)];
  return `${pick(REG)} ${r(1000,9999)} ${suf}`;
};
const phone = ()=>`+62${r(811,899)}${r(1000,9999)}${r(1000,9999)}`;
const email = (name,i)=>`${name.toLowerCase().replace(/\s+/g,".")}${i}@mail.id`;
const addDays=(d,n)=>new Date(d.getTime()+n*86400000);

async function main(){
  // bersihkan tabel
  await prisma.servicePart.deleteMany();
  await prisma.serviceItem.deleteMany();
  await prisma.serviceOrder.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.mechanic.deleteMany();
  await prisma.part.deleteMany();

  // mekanik
  await prisma.mechanic.createMany({ data: MECHS.map(name=>({name})) });

  // parts
  const parts = [];
  for (const [name,price] of PARTS) {
    parts.push(await prisma.part.create({ data:{ name, price } }));
  }

  // customers + vehicles + orders
  const customerCount = 25;
  for (let i=0;i<customerCount;i++){
    const full = `${pick(FIRST)} ${pick(LAST)}`;
    const cust = await prisma.customer.create({
      data: { name: full, phone: phone(), email: email(full,i) }
    });

    for (let v=0; v<r(1,2); v++){
      const [brand,models] = pick(BRANDS);
      const veh = await prisma.vehicle.create({
        data: {
          customerId: cust.id,
          plate: plate(),
          brand, model: pick(models),
          year: r(2010,2024),
          serviceIntervalDays: [120,150,180,210,240][r(0,4)],
        }
      });

      let odo = r(10_000,120_000);
      let t = addDays(new Date(), -r(500,700));
      for (let o=0;o<r(2,6);o++){
        t   = addDays(t, r(25,120));
        odo = odo + r(800,7000);
        const order = await prisma.serviceOrder.create({
          data:{
            vehicleId: veh.id,
            date: t,
            odometer: odo,
            notes: Math.random()<0.2 ? "Keluhan: bunyi pada roda depan" : null,
            mechanic: { connect: { name: pick(MECHS) } }
          }
        });
        // items 1–3
        for (let s=0;s<r(1,3);s++){
          const [name,price] = pick(ITEMS);
          await prisma.serviceItem.create({ data:{ serviceOrderId: order.id, name, price }});
        }
        // parts 0–3
        for (let pz=0;pz<r(0,3);pz++){
          const pt = pick(parts);
          const qty = r(1, pt.name.includes("Oli")?4:2);
          await prisma.servicePart.create({
            data:{ serviceOrderId: order.id, partId: pt.id, qty, unitPrice: pt.price }
          });
        }
      }
    }
  }
  console.log("✅ Seed selesai.");
}

main().catch(e=>{console.error(e);process.exit(1)}).finally(async()=>{await prisma.$disconnect()});
