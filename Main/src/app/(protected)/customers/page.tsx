import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, phone: true, email: true },
  });

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Customers</h1>
        <Link
          href="/customers/new"
          className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-blue-50"
        >
          Tambah
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left">Nama</th>
              <th className="text-left">Telepon</th>
              <th className="text-left">Email</th>
              <th className="text-left">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.phone ?? "-"}</td>
                <td>{c.email ?? "-"}</td>
                <td>
                  <Link
                    href={`/customers/${c.id}`}
                    className="rounded-md border border-slate-200 bg-white px-2 py-0.5 hover:bg-blue-50"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={4} className="text-slate-500">Belum ada data.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
