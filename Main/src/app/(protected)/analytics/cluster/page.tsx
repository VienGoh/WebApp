import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/roles";
import ClusterClient from "@/components/ClusterClient";

export const dynamic = "force-dynamic";

export default async function Page() {
  await requireRole(["PENELITI"]); // <— penting: admin tidak boleh masuk sini
  const vehicles = await prisma.vehicle.findMany({
    include: { customer: true },
    orderBy: { id: "desc" },
  });

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Analitik · Clustering</h1>
      <ClusterClient vehicles={vehicles} />
    </section>
  );
}
