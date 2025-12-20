"use client";
import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";

// Tipe data untuk part - SESUAI SCHEMA PRISMA
export type Part = {
  id?: number;
  sku: string | null;  // Sesuai schema: String? (nullable)
  name: string;
  price: number;
  createdAt?: Date;
  // Tambahkan field lain sesuai schema
};

type PartFormProps = {
  mode?: "create" | "edit";
  initialData?: Part | null;
  partId?: number;
  onSuccess?: () => void;
};

export default function PartForm({
  mode = "create",
  initialData = null,
  partId,
  onSuccess,
}: PartFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state - handle sku sebagai string (form input)
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    price: 0,
  });

  // Initialize form dengan initialData (konversi null ke "")
  useEffect(() => {
    if (initialData) {
      setFormData({
        sku: initialData.sku || "", // Konversi null ke empty string
        name: initialData.name || "",
        price: initialData.price || 0,
      });
    } else {
      // Reset form untuk mode create
      setFormData({
        sku: "",
        name: "",
        price: 0,
      });
    }
  }, [initialData]);

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "price" ? parseFloat(value) || 0 : value,
    }));
    
    // Clear errors when user types
    if (error) setError(null);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validasi sesuai schema Prisma
    if (!formData.name.trim()) {
      setError("Nama tidak boleh kosong");
      return;
    }
    if (formData.price < 0) {
      setError("Harga tidak boleh negatif");
      return;
    }

    startTransition(async () => {
      try {
        // Prepare payload sesuai schema
        const payload = {
          sku: formData.sku.trim() || null, // Konversi empty string ke null
          name: formData.name.trim(),
          price: formData.price,
        };

        const url = mode === "edit" && partId 
          ? `/api/parts/${partId}` 
          : "/api/parts";

   // Di PartForm.tsx, pastikan method PATCH:
const method = mode === "edit" ? "PATCH" : "POST";

const response = await fetch(url, {
  method, // PATCH untuk edit
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || data.message || "Gagal menyimpan data");
        }

        // Success handling
        setSuccess(
          mode === "edit" 
            ? "Data sparepart berhasil diperbarui!" 
            : "Sparepart berhasil ditambahkan!"
        );

        // Reset form jika create
        if (mode === "create") {
          setFormData({
            sku: "",
            name: "",
            price: 0,
          });
        }

        // Callback jika ada
        if (onSuccess) {
          setTimeout(() => onSuccess(), 1500);
        }

        // Refresh data halaman
        setTimeout(() => router.refresh(), 1000);

        // Auto-hide success message
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      } catch (err: any) {
        console.error("Form submission error:", err);
        setError(err.message || "Terjadi kesalahan saat menyimpan");
      }
    });
  };

  // Fungsi untuk reset form ke nilai awal
  const handleReset = () => {
    setFormData({
      sku: initialData?.sku || "",
      name: initialData?.name || "",
      price: initialData?.price || 0,
    });
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          {mode === "edit" ? "Edit Sparepart" : "Tambah Sparepart Baru"}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {mode === "edit" 
            ? "Perbarui informasi sparepart yang ada" 
            : "Tambahkan sparepart baru ke dalam sistem"}
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4 animate-fadeIn">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-green-800 font-medium">{success}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 animate-fadeIn">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* SKU Field - Optional */}
          <div className="space-y-2">
            <label htmlFor="sku" className="block text-sm font-medium text-gray-700">
              Kode SKU <span className="text-gray-400 text-xs">(Opsional)</span>
            </label>
            <input
              id="sku"
              name="sku"
              type="text"
              value={formData.sku}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="CONTOH-SKU-001 (kosongkan jika tidak ada)"
            />
            <p className="text-xs text-gray-500">
              Kode unik untuk identifikasi sparepart. Bisa dikosongkan.
            </p>
          </div>

          {/* Name Field - Required */}
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Nama Sparepart <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="Kampas Rem Belakang"
            />
            <p className="text-xs text-gray-500">
              Nama deskriptif untuk sparepart
            </p>
          </div>
        </div>

        {/* Price Field - Required */}
        <div className="space-y-2">
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">
            Harga (Rp) <span className="text-red-500">*</span>
          </label>
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500">Rp</span>
            </div>
            <input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              required
              value={formData.price}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 pl-12 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="0.00"
            />
          </div>
          <p className="text-xs text-gray-500">
            Masukkan harga dalam Rupiah (contoh: 125000.50)
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-6 border-t border-gray-200">
          {mode === "edit" && (
            <button
              type="button"
              onClick={handleReset}
              className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50"
              disabled={isPending}
            >
              Reset Perubahan
            </button>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="flex-1 px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {mode === "edit" ? "Menyimpan..." : "Menambahkan..."}
              </span>
            ) : mode === "edit" ? (
              "Simpan Perubahan"
            ) : (
              "Tambah Sparepart"
            )}
          </button>
        </div>
      </form>

      {/* Form Help Text */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium">Catatan:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>SKU bersifat opsional dan harus unik jika diisi</li>
              <li>Nama sparepart wajib diisi</li>
              <li>Harga harus berupa angka positif</li>
              {mode === "edit" && <li>Perubahan akan langsung tersimpan di database</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}