"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

export type CustomerFormProps = {
  action: "create" | "edit";
  id?: number; // wajib kalau edit
  defaults?: { 
    name?: string; 
    phone?: string | null; 
    email?: string | null;
    address?: string | null;
    company?: string | null;
    notes?: string | null;
  };
  // Props untuk filtering
  enableFilter?: boolean;
  onFilterChange?: (filters: CustomerFilters) => void;
  initialFilters?: CustomerFilters;
};

export type CustomerFilters = {
  name?: string;
  phone?: string;
  email?: string;
  company?: string;
  address?: string;
  dateFrom?: string;
  dateTo?: string;
  hasVehicles?: boolean;
  hasActiveService?: boolean;
};

export default function CustomerForm({ 
  action, 
  id, 
  defaults, 
  enableFilter = false,
  onFilterChange,
  initialFilters 
}: CustomerFormProps) {
  const router = useRouter();
  
  // State untuk form data (create/edit)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    company: "",
    notes: "",
  });

  // State untuk filter
  const [filterData, setFilterData] = useState<CustomerFilters>(initialFilters || {});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Update form data ketika defaults berubah (untuk edit mode)
  useEffect(() => {
    if (defaults && !enableFilter) {
      setFormData({
        name: defaults.name || "",
        phone: defaults.phone || "",
        email: defaults.email || "",
        address: defaults.address || "",
        company: defaults.company || "",
        notes: defaults.notes || "",
      });
    }
  }, [defaults, enableFilter]);

  // Initialize filter data
  useEffect(() => {
    if (enableFilter && initialFilters) {
      setFilterData(initialFilters);
    }
  }, [enableFilter, initialFilters]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError(null);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    let newValue: string | boolean = value;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      newValue = checkbox.checked;
    }

    const newFilters = {
      ...filterData,
      [name]: newValue,
    };

    setFilterData(newFilters);
    
    // Trigger filter change callback dengan debounce
    if (onFilterChange) {
      const timeoutId = setTimeout(() => {
        onFilterChange(newFilters);
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  };

  const clearFilters = () => {
    const clearedFilters: CustomerFilters = {};
    setFilterData(clearedFilters);
    setShowAdvancedFilters(false);
    if (onFilterChange) {
      onFilterChange(clearedFilters);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate required fields for create/edit
      if (!enableFilter && !formData.name.trim()) {
        throw new Error("Nama wajib diisi");
      }

      // Prepare payload for create/edit
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        address: formData.address.trim() || null,
        company: formData.company.trim() || null,
        notes: formData.notes.trim() || null,
      };

      // Validate email format if provided
      if (payload.email && !isValidEmail(payload.email)) {
        throw new Error("Format email tidak valid");
      }

      const url = action === "create" 
        ? "/api/customers" 
        : `/api/customers/${id}`;
      
      const method = action === "create" ? "POST" : "PATCH";

      const response = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || data?.message || `Gagal ${action === "create" ? "membuat" : "mengupdate"} customer`);
      }

      // Show success message
      setSuccess(true);
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push("/customers");
        router.refresh();
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      console.error("Error submitting form:", err);
    } finally {
      setLoading(false);
    }
  }

  function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  const handleCancel = () => {
    router.push("/customers");
  };

  // Jika enableFilter true, tampilkan form filter
  if (enableFilter) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Filter Customers</h3>
          <button
            type="button"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            {showAdvancedFilters ? "Sembunyikan" : "Tampilkan"} Filter Lanjutan
            <svg 
              className={`w-4 h-4 transition-transform ${showAdvancedFilters ? "rotate-180" : ""}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Basic Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nama
              </label>
              <input
                type="text"
                name="name"
                value={filterData.name || ""}
                onChange={handleFilterChange}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Cari nama..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Telepon
              </label>
              <input
                type="text"
                name="phone"
                value={filterData.phone || ""}
                onChange={handleFilterChange}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Cari nomor telepon..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={filterData.email || ""}
                onChange={handleFilterChange}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Cari email..."
              />
            </div>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="border-t border-slate-200 pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Perusahaan
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={filterData.company || ""}
                    onChange={handleFilterChange}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Nama perusahaan..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Alamat
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={filterData.address || ""}
                    onChange={handleFilterChange}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Alamat..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Status
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        name="hasVehicles"
                        checked={filterData.hasVehicles || false}
                        onChange={handleFilterChange}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      Memiliki Kendaraan
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        name="hasActiveService"
                        checked={filterData.hasActiveService || false}
                        onChange={handleFilterChange}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      Servis Aktif
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tanggal Dari
                  </label>
                  <input
                    type="date"
                    name="dateFrom"
                    value={filterData.dateFrom || ""}
                    onChange={handleFilterChange}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tanggal Sampai
                  </label>
                  <input
                    type="date"
                    name="dateTo"
                    value={filterData.dateTo || ""}
                    onChange={handleFilterChange}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Filter Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div className="text-sm text-slate-500">
              {Object.values(filterData).filter(v => v !== undefined && v !== "" && v !== false).length > 0 && (
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                  Filter aktif
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={clearFilters}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
              >
                Reset Filter
              </button>
              
              <button
                type="button"
                onClick={() => onFilterChange?.(filterData)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
              >
                Terapkan Filter
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Tampilkan form create/edit seperti biasa
  return (
    <div className="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Success Message */}
        {success && (
          <div className="rounded-lg bg-green-50 border border-green-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  {action === "create" ? "Customer berhasil dibuat!" : "Customer berhasil diupdate!"}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  Mengalihkan ke halaman customers...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Kolom Kiri */}
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                Nama <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleFormChange}
                disabled={loading || success}
                className="block w-full rounded-lg border border-slate-300 px-4 py-3 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:bg-slate-100 disabled:cursor-not-allowed transition-colors"
                placeholder="Masukkan nama customer"
              />
            </div>

            <div>
              <label htmlFor="company" className="block text-sm font-medium text-slate-700 mb-1">
                Perusahaan
              </label>
              <input
                id="company"
                name="company"
                type="text"
                value={formData.company}
                onChange={handleFormChange}
                disabled={loading || success}
                className="block w-full rounded-lg border border-slate-300 px-4 py-3 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:bg-slate-100 disabled:cursor-not-allowed transition-colors"
                placeholder="Nama perusahaan (jika ada)"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">
                Nomor Telepon
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleFormChange}
                disabled={loading || success}
                className="block w-full rounded-lg border border-slate-300 px-4 py-3 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:bg-slate-100 disabled:cursor-not-allowed transition-colors"
                placeholder="+62 812-3456-7890"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleFormChange}
                disabled={loading || success}
                className="block w-full rounded-lg border border-slate-300 px-4 py-3 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:bg-slate-100 disabled:cursor-not-allowed transition-colors"
                placeholder="customer@example.com"
              />
            </div>
          </div>

          {/* Kolom Kanan */}
          <div className="space-y-4">
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-1">
                Alamat
              </label>
              <textarea
                id="address"
                name="address"
                rows={3}
                value={formData.address}
                onChange={handleFormChange}
                disabled={loading || success}
                className="block w-full rounded-lg border border-slate-300 px-4 py-3 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:bg-slate-100 disabled:cursor-not-allowed transition-colors resize-none"
                placeholder="Alamat lengkap customer"
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-1">
                Catatan
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleFormChange}
                disabled={loading || success}
                className="block w-full rounded-lg border border-slate-300 px-4 py-3 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:bg-slate-100 disabled:cursor-not-allowed transition-colors resize-none"
                placeholder="Catatan tambahan tentang customer"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200">
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Batal
          </button>
          
          <button
            type="submit"
            disabled={loading || success}
            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[120px]"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Menyimpan...
              </>
            ) : success ? (
              <>
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Berhasil!
              </>
            ) : action === "create" ? (
              "Buat Customer"
            ) : (
              "Update Customer"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}