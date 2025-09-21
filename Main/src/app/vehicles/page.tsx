import { prisma } from "@/lib/prisma";
import VehicleForm from "@/components/forms/VehicleForm";
import DeleteButton from "@/components/DeleteButton";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [customers, rows] = await Promise.all([
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.vehicle.findMany({ include: { customer: true }, orderBy: { createdAt: "desc" } }),
  ]);
  const opts = customers.map(c => ({ id: c.id, label: `${c.name}${c.phone ? " · " + c.phone : ""}` }));

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Kendaraan</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Tambah Kendaraan</h2>
          <VehicleForm customers={opts} />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm overflow-x-auto">
          <h2 className="mb-3 text-lg font-semibold">Daftar Kendaraan</h2>
          <table>
            <thead><tr><th>Plat</th><th>Brand/Model</th><th>Pelanggan</th><th className="text-center">Aksi</th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td>{r.plate}</td>
                  <td>{r.brand} {r.model ?? ""}</td>
                  <td>{r.customer.name}</td>
                  <td className="text-center"><DeleteButton url={`/api/vehicles/${r.id}`} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
