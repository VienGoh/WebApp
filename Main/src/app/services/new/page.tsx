import { prisma } from "@/lib/prisma";
import ServiceForm from "@/components/forms/ServiceForm";

export default async function Page() {
  const [vehicles, mechanics, parts] = await Promise.all([
    prisma.vehicle.findMany({ include: { customer: true }, orderBy: { id: "desc" } }),
    prisma.mechanic.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.part.findMany({ orderBy: { name: "asc" } }),
  ]);

  const vOpts = vehicles.map(v => ({ id: v.id, label: `${v.plate} · ${v.customer.name}` }));
  const mOpts = mechanics.map(m => ({ id: m.id, label: m.name }));
  const pOpts = parts.map(p => ({ id: p.id, label: `${p.sku} · ${p.name}`, price: p.price }));

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Input Servis</h1>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <ServiceForm vehicles={vOpts} mechanics={mOpts} parts={pOpts} />
      </div>
    </section>
  );
}
