import { notFound } from "next/navigation";

import ServiceForm from "@/components/forms/ServiceForm";
import { prisma } from "@/lib/prisma";

export default async function EditServicePage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) notFound();

  const [order, vehicles, mechanics, parts] = await Promise.all([
    prisma.serviceOrder.findUnique({
      where: { id },
      include: {
        items: true,
        parts: true,
      },
    }),
    prisma.vehicle.findMany({ include: { customer: true }, orderBy: { id: "desc" } }),
    prisma.mechanic.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.part.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!order) notFound();

  const vOpts = vehicles.map(v => ({ id: v.id, label: `${v.plate} · ${v.customer.name}` }));
  const mOpts = mechanics.map(m => ({ id: m.id, label: m.name }));
  const pOpts = parts.map(p => ({ id: p.id, label: `${p.sku} · ${p.name}`, price: p.price }));

  const defaults = {
    vehicleId: order.vehicleId,
    mechanicId: order.mechanicId,
    date: order.date ? order.date.toISOString().slice(0, 10) : undefined,
    odometer: order.odometer ?? undefined,
    notes: order.notes ?? null,
    items: order.items.map(item => ({ jobName: item.name, price: item.price })),
    parts: order.parts.map(part => ({ partId: part.partId, qty: part.qty, unitPrice: part.unitPrice })),
  };

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Edit Servis</h1>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <ServiceForm
          action="edit"
          serviceId={order.id}
          vehicles={vOpts}
          mechanics={mOpts}
          parts={pOpts}
          defaults={defaults}
        />
      </div>
    </section>
  );
}
