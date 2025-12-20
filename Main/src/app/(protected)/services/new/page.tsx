// app/services/new/page.tsx
import { prisma } from "@/lib/prisma";
import ServiceForm from "@/components/forms/ServiceForm";
import Link from "next/link";

export default async function NewServicePage() {
  const [vehicles, mechanics, parts] = await Promise.all([
    prisma.vehicle.findMany({ 
      include: { customer: true }, 
      orderBy: { id: "desc" } 
    }),
    prisma.mechanic.findMany({ 
      where: { active: true }, 
      orderBy: { name: "asc" } 
    }),
    prisma.part.findMany({ 
      orderBy: { name: "asc" } 
    }),
  ]);

  const vOpts = vehicles.map(v => ({ 
    id: v.id, 
    label: `${v.plate} · ${v.customer.name}` 
  }));
  
  const mOpts = mechanics.map(m => ({ 
    id: m.id, 
    label: m.name 
  }));
  
  const pOpts = parts.map(p => ({ 
    id: p.id, 
    label: `${p.sku ?? "-"} · ${p.name}`, 
    price: p.price 
  }));

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tambah Servis Baru</h1>
          <p className="text-sm text-gray-500 mt-1">Input data servis kendaraan pelanggan</p>
        </div>
        <Link 
          href="/services" 
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          ← Kembali ke Daftar
        </Link>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <ServiceForm
          mode="create"
          vehicles={vOpts}
          mechanics={mOpts}
          parts={pOpts}
        />
      </div>
    </section>
  );
}