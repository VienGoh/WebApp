import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/roles";
import MetricCard from "@/components/ui/MetricCard";

export const dynamic = "force-dynamic";

const formatIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(n);

export default async function Page() {
  await requireRole(["ADMIN", "PENELITI"]);

  const [cust, veh, orders] = await Promise.all([
    prisma.customer.count(),
    prisma.vehicle.count(),
    prisma.serviceOrder.findMany({ include: { items: true, parts: true } }),
  ]);

  const revenue = orders.reduce(
    (sum, o) =>
      sum +
      o.items.reduce((a, i) => a + i.price, 0) +
      o.parts.reduce((a, p) => a + p.qty * p.unitPrice, 0),
    0
  );

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Pelanggan" value={cust} />
        <MetricCard title="Kendaraan" value={veh} />
        <MetricCard title="Order Servis" value={orders.length} />
        <MetricCard title="Pendapatan (Σ)" value={formatIDR(revenue)} hint="Total item + parts" />
      </div>
    </section>
  );
}
