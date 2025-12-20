import { prisma } from "@/lib/prisma";
import CustomerForm from "@/components/forms/CustomerForm";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function EditCustomerPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const id = Number(params.id);
  
  // Validate ID
  if (!Number.isFinite(id) || id <= 0) {
    notFound();
  }

  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      select: { 
        id: true, 
        name: true, 
        phone: true, 
        email: true,
        createdAt: true,
        updatedAt: true 
      },
    });

    if (!customer) {
      notFound();
    }

    return (
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Link
                href="/customers"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                ← Kembali ke Daftar
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-2">
              Edit Customer
            </h1>
            <p className="text-slate-600 mt-1">
              Update informasi customer: {customer.name}
            </p>
          </div>
          
          <div className="text-sm text-slate-500 text-right">
            <div>ID: {customer.id}</div>
            <div className="text-xs">
              Terakhir update: {customer.updatedAt.toLocaleDateString("id-ID")}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <CustomerForm 
            action="edit" 
            id={customer.id} 
            defaults={customer} 
          />
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-slate-700 mb-2">Informasi</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Dibuat:</span>
                <span className="font-medium">
                  {customer.createdAt.toLocaleDateString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Diupdate:</span>
                <span className="font-medium">
                  {customer.updatedAt.toLocaleDateString("id-ID")}
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-slate-700 mb-2">Kontak</h3>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="text-slate-600">
                  {customer.phone || "Belum diisi"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-slate-600">
                  {customer.email || "Belum diisi"}
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-700 mb-2">Tips</h3>
            <ul className="text-xs text-blue-600 space-y-1">
              <li>• Pastikan data kontak valid</li>
              <li>• Email digunakan untuk notifikasi</li>
              <li>• Perubahan akan langsung tersimpan</li>
            </ul>
          </div>
        </div>
      </section>
    );
  } catch (error) {
    console.error("Error loading customer:", error);
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg font-medium mb-2">
            Gagal memuat data customer
          </div>
          <p className="text-slate-600 mb-4">
            Terjadi kesalahan saat memuat data customer.
          </p>
          <Link
            href="/customers"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
          >
            Kembali ke Daftar Customer
          </Link>
        </div>
      </div>
    );
  }
}