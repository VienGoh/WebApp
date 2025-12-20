// app/parts/create/page.tsx
import PartForm from "@/components/forms/PartForm";
// app/parts/create/page.tsx

export default function CreatePartPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Tambah Sparepart Baru</h1>
          <p className="text-gray-600 mt-2">
            Isi formulir di bawah untuk menambahkan sparepart baru ke sistem
          </p>
        </div>
        
        <PartForm mode="create" />
      </div>
    </div>
  );
}