// app/parts/edit/[id]/page.tsx
import PartForm, { Part } from "@/components/forms/PartForm";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function EditPartPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const partId = parseInt(id);

  // Handle invalid ID
  if (isNaN(partId)) {
    notFound();
  }

  // Fetch part data
  const part = await prisma.part.findUnique({
    where: { id: partId },
  });

  if (!part) {
    notFound();
  }

  // Transform data
  const partData: Part = {
    id: part.id,
    sku: part.sku,
    name: part.name,
    price: part.price,
    createdAt: part.createdAt,
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Sparepart</h1>
              <p className="text-gray-600 mt-2">
                Perbarui informasi sparepart #{part.id} - {part.name}
              </p>
            </div>
            <a
              href="/parts"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              ← Kembali ke Daftar
            </a>
          </div>
        </div>
        
        <PartForm
          mode="edit"
          partId={partId}
          initialData={partData}
          onSuccess={() => {
            // Bisa tambahkan toast notification di sini
            console.log("Sparepart berhasil diperbarui");
          }}
        />
      </div>
    </div>
  );
}