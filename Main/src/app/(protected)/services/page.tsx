import Link from "next/link";
import { prisma } from "@/lib/prisma";

function rupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(n);
}

export default async function ServicesPage({ searchParams }: { searchParams?: { saved?: string } }) {
  const justSaved = searchParams?.saved === "1";

  const orders = await prisma.serviceOrder.findMany({
    orderBy: [
      { date: "desc" }, // urut terbaru dulu
      { id: "desc" },   // penentu kedua
    ],
    include: {
      vehicle: { include: { customer: true } },
      mechanic: true,
      items: true,
      parts: true,
    },
  });

  const rows = orders.map((o) => {
    const totalItems = o.items.reduce((a, i) => a + i.price, 0);
    const totalParts = o.parts.reduce((a, p) => a + p.qty * p.unitPrice, 0);
    const total = totalItems + totalParts;
    return { ...o, total, totalItems, totalParts };
  });

  return (
    <section className="space-y-4">
      {justSaved && (
        <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          ✅ Data servis berhasil disimpan.
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Daftar Servis</h1>
        <Link href="/services/new" className="rounded-md border px-3 py-1.5 text-sm hover:bg-blue-50">
          + Input Baru
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border">
        <table className="min-w-[1000px] w-full">
          <thead className="bg-slate-50 text-left text-sm">
            <tr>
              <th className="p-3">ID</th>
              <th className="p-3">Tanggal</th>
              <th className="p-3">Kendaraan</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Mekanik</th>
              <th className="p-3">Deskripsi</th>
              <th className="p-3">Total</th>
              <th className="p-3">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {rows.map((o) => (
              <tr key={o.id} className="border-t">
                <td className="p-3 text-slate-600">#{o.id}</td>
                <td className="p-3">{o.date ? new Date(o.date).toLocaleDateString("id-ID") : "-"}</td>
                <td className="p-3">{o.vehicle?.plate ?? "-"}</td>
                <td className="p-3">{o.vehicle?.customer?.name ?? "-"}</td>
                <td className="p-3">{o.mechanic?.name ?? "-"}</td>
                <td className="p-3">
                  {/* deskripsi singkat: notes atau ringkasan items */}
                  {o.notes?.trim()
                    ? o.notes
                    : (o.items[0]?.name ? `${o.items[0]?.name}${o.items.length > 1 ? ` (+${o.items.length - 1} pekerjaan)` : ""}` : "-")}
                </td>
                <td className="p-3 font-medium">Rp {rupiah(o.total)}</td>
                <td className="p-3">
                  <Link href={`/services/${o.id}/edit`} className="rounded-md border px-2 py-1 hover:bg-blue-50">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="p-3 text-slate-500" colSpan={8}>Belum ada data.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
