import { prisma } from "@/lib/prisma";
import PartForm from "@/components/forms/PartForm";
import DeleteButton from "@/components/DeleteButton";

export const dynamic = "force-dynamic";

export default async function Page() {
  const rows = await prisma.part.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Sparepart</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Tambah Sparepart</h2>
          <PartForm />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm overflow-x-auto">
          <h2 className="mb-3 text-lg font-semibold">Daftar Sparepart</h2>
          <table>
            <thead><tr><th>SKU</th><th>Nama</th><th className="text-right">Harga</th><th className="text-center">Aksi</th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td>{r.sku}</td>
                  <td>{r.name}</td>
                  <td className="text-right">{r.price.toLocaleString("id-ID")}</td>
                  <td className="text-center"><DeleteButton url={`/api/parts/${r.id}`} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
