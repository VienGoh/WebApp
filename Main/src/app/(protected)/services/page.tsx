import Link from "next/link";

import { prisma } from "@/lib/prisma";
import ServiceForm from "@/components/forms/ServiceForm";
import DeleteButton from "@/components/DeleteButton";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [vehicles, mechanics, parts, orders] = await Promise.all([
    prisma.vehicle.findMany({ include: { customer: true }, orderBy: { id: "desc" } }),
    prisma.mechanic.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.part.findMany({ orderBy: { name: "asc" } }),
    prisma.serviceOrder.findMany({
      orderBy: { date: "desc" },
      include: {
        vehicle: { include: { customer: true } },
        mechanic: true,
        items: true,
        parts: { include: { part: true } },
      },
    }),
  ]);

  const vOpts = vehicles.map(v => ({ id: v.id, label: `${v.plate} · ${v.customer.name}` }));
  const mOpts = mechanics.map(m => ({ id: m.id, label: m.name }));
  const pOpts = parts.map(p => ({ id: p.id, label: `${p.sku} · ${p.name}`, price: p.price }));

  const rows = orders.map(o => ({
    id: o.id,
    date: o.date,
    vehicle: `${o.vehicle.plate} · ${o.vehicle.customer.name}`,
    mechanic: o.mechanic?.name ?? "-",
    total: o.items.reduce((acc, item) => acc + item.price, 0) +
      o.parts.reduce((acc, part) => acc + part.qty * part.unitPrice, 0),
  }));

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Servis</h1>

      <div className="grid gap-4 xl:grid-cols-[1fr,1.1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Input Servis</h2>
          <ServiceForm vehicles={vOpts} mechanics={mOpts} parts={pOpts} />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm overflow-x-auto">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Riwayat Servis</h2>
            <span className="text-sm text-slate-500">{rows.length} data</span>
          </div>
          <table className="min-w-[600px]">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Kendaraan</th>
                <th>Mekanik</th>
                <th className="text-right">Total</th>
                <th className="text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id}>
                  <td>{new Date(row.date).toLocaleDateString("id-ID")}</td>
                  <td className="whitespace-nowrap">{row.vehicle}</td>
                  <td>{row.mechanic}</td>
                  <td className="text-right">{row.total.toLocaleString("id-ID", { style: "currency", currency: "IDR" })}</td>
                  <td className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        href={`/services/${row.id}`}
                        className="rounded-md border border-slate-200 px-2 py-1 text-sm text-blue-600 hover:border-blue-400 hover:bg-blue-50"
                      >
                        Edit
                      </Link>
                      <DeleteButton url={`/api/services/${row.id}`} />
                    </div>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-sm text-slate-500">
                    Belum ada data servis.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
