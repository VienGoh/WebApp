import { prisma } from "@/lib/prisma";
import ClusterClient from "@/components/ClusterClient";

export const dynamic = "force-dynamic";

export default async function Page() {
  const vehicles = await prisma.vehicle.findMany({
    include: { customer: true },
    orderBy: { id: "desc" },
  });

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Analitik · Clustering</h1>
      <p className="text-sm text-slate-600">
        K-Means menggunakan fitur: jumlah kunjungan, rata-rata biaya, dan jarak hari antar servis.
      </p>
      <ClusterClient vehicles={vehicles} />
    </section>
  );
}
