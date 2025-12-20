// src/app/parts/edit/[id]/page.tsx
import PartForm, { Part } from "@/components/forms/PartForm";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EditPartPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Await params untuk Next.js 15
  const { id } = await params;
  const partId = parseInt(id);

  // Validasi ID
  if (isNaN(partId)) {
    notFound();
  }

  // Fetch data dari database
  const part = await prisma.part.findUnique({
    where: { id: partId },
  });

  if (!part) {
    notFound();
  }

  // Transform data ke tipe Part
  const partData: Part = {
    id: part.id,
    sku: part.sku,
    name: part.name,
    price: part.price,
    createdAt: part.createdAt,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Header dengan breadcrumb */}
        <div className="mb-8">
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <Link href="/parts" className="hover:text-gray-700">
              Sparepart
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-700 font-medium">Edit #{part.id}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Sparepart</h1>
              <p className="text-gray-600 mt-2">
                Perbarui informasi untuk <span className="font-medium">{part.name}</span>
              </p>
            </div>
            <Link
              href="/parts"
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              ← Kembali
            </Link>
          </div>
        </div>

        {/* Form Edit */}
        <PartForm
          mode="edit"
          partId={partId}
          initialData={partData}
          onSuccess={() => {
            // Optional: Tambahkan toast notification
            console.log("Berhasil mengupdate sparepart");
          }}
        />
      </div>
    </div>
  );
}