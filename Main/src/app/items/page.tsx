import { prisma } from "@/lib/prisma";
import NewItemForm from "@/components/NewItemForm";
import DeleteButton from "@/components/DeleteButton";

export const dynamic = "force-dynamic";

export default async function ItemsPage() {
  const items = await prisma.item.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Items</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Tambah Item</h2>
          <NewItemForm />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm overflow-x-auto">
          <h2 className="mb-3 text-lg font-semibold">Daftar Item</h2>
          <table>
            <thead>
              <tr><th>SKU</th><th>Nama</th><th className="text-right">Harga</th><th className="text-center">Aksi</th></tr>
            </thead>
            <tbody>
              {items.map(it => (
                <tr key={it.id}>
                  <td>{it.sku}</td>
                  <td>{it.name}</td>
                  <td className="text-right">{it.price.toLocaleString("id-ID")}</td>
                  <td className="text-center">
                    <DeleteButton url={`/api/items/${it.id}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
