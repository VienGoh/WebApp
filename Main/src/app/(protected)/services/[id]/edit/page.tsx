// app/services/[id]/edit/page.tsx
import { prisma } from "@/lib/prisma";
import ServiceForm from "@/components/forms/ServiceForm";
import Link from "next/link";

type Props = { params: { id: string } };

export default async function EditServicePage({ params }: Props) {
  const id = Number(params.id);

  const [order, vehicles, mechanics, parts] = await Promise.all([
    prisma.serviceOrder.findUnique({
      where: { id },
      include: {
        vehicle: { include: { customer: true } },
        mechanic: true,
        items: true,
        parts: true,
      },
    }),
    prisma.vehicle.findMany({ include: { customer: true }, orderBy: { id: "desc" } }),
    prisma.mechanic.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.part.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!order) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">Edit Servis</h1>
        <div className="rounded-2xl border bg-white p-4">
          <p>Data tidak ditemukan.</p>
          <div className="mt-3">
            <Link href="/services" className="rounded-md border px-3 py-1.5 text-sm hover:bg-blue-50">
              ← Kembali ke daftar
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const vOpts = vehicles.map(v => ({ id: v.id, label: `${v.plate} · ${v.customer.name}` }));
  const mOpts = mechanics.map(m => ({ id: m.id, label: m.name }));
  const pOpts = parts.map(p => ({ id: p.id, label: `${p.sku ?? "-"} · ${p.name}`, price: p.price }));

  const initial = {
    vehicleId: order.vehicleId,
    mechanicId: order.mechanicId ?? undefined,
    date: order.date ? new Date(order.date).toISOString().slice(0, 10) : "",
    odometer: order.odometer ?? undefined,
    notes: order.notes ?? "",
    items: order.items.map(i => ({ name: i.name, price: i.price })),
    parts: order.parts.map(p => ({ partId: p.partId, qty: p.qty, unitPrice: p.unitPrice })),
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edit Servis #{order.id}</h1>
        <Link href="/services" className="rounded-md border px-3 py-1.5 text-sm hover:bg-blue-50">← Kembali</Link>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <ServiceForm
          mode="edit"
          serviceId={order.id}
          vehicles={vOpts}
          mechanics={mOpts}
          parts={pOpts}
          initialValues={initial}
        />
      </div>
    </section>
  );
}
