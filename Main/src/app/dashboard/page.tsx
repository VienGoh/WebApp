import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export default async function Page() {
  const [cust, veh, orders] = await Promise.all([
    prisma.customer.count(),
    prisma.vehicle.count(),
    prisma.serviceOrder.findMany({ include: { items: true, parts: true } }),
  ]);

  const revenue = orders.reduce(
    (sum, o) => sum + o.items.reduce((a, i) => a + i.price, 0) + o.parts.reduce((a, p) => a + p.qty * p.unitPrice, 0),
    0
  );

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-600">Pelanggan</div>
          <div className="text-2xl font-semibold">{cust}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-600">Kendaraan</div>
          <div className="text-2xl font-semibold">{veh}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-600">Order Servis</div>
          <div className="text-2xl font-semibold">{orders.length}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-600">Pendapatan (∑)</div>
          <div className="text-2xl font-semibold">{revenue.toLocaleString("id-ID")}</div>
        </div>
      </div>

      <p className="text-sm text-slate-500">
        Clustering tersedia di <code>/api/analytics/cluster?k=3</code>. Bila perlu, nanti kita tampilkan grafik per klaster.
      </p>
    </section>
  );
}
