// app/parts/page.tsx
import { prisma } from "@/lib/prisma";
import PartsList from "@/components/forms/PartsList";
import { Part } from "@/components/forms/PartForm";

export default async function PartsPage() {
  const parts = await prisma.part.findMany({
    orderBy: { createdAt: "desc" },
  });

  const partsData: Part[] = parts.map(part => ({
    id: part.id,
    sku: part.sku,
    name: part.name,
    price: part.price,
    createdAt: part.createdAt,
  }));

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Sparepart Management</h1>
        <p className="text-gray-600">Kelola katalog sparepart bengkel Anda</p>
      </div>
      
      <PartsList parts={partsData} />
    </div>
  );
}