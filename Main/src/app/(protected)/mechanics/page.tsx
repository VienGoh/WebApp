import { prisma } from "@/lib/prisma";
import MechanicForm from "@/components/forms/MechanicForm";
import DeleteButton from "@/components/DeleteButton";

export const dynamic = "force-dynamic";

export default async function Page() {
  const rows = await prisma.mechanic.findMany({ orderBy: { name: "asc" } });

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Mekanik</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Tambah Mekanik</h2>
          <MechanicForm />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm overflow-x-auto">
          <h2 className="mb-3 text-lg font-semibold">Daftar Mekanik</h2>
          <table>
            <thead><tr><th>Nama</th><th>Aktif</th><th className="text-center">Aksi</th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.active ? "Ya" : "Tidak"}</td>
                  <td className="text-center"><DeleteButton url={`/api/mechanics/${r.id}`} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
