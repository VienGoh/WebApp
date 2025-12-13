"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner"; // Optional: untuk notifikasi yang lebih baik

export type Opt = { id: number; label: string; price?: number };

type Initial = {
  vehicleId?: number;
  mechanicId?: number;
  date?: string; // "YYYY-MM-DD"
  odometer?: number;
  notes?: string;
  items?: { name: string; price: number }[];
  parts?: { partId: number; qty: number; unitPrice: number }[];
};

export default function ServiceForm({
  vehicles,
  mechanics,
  parts,
  mode = "create",
  serviceId,
  initialValues,
}: {
  vehicles: Opt[];
  mechanics: Opt[];
  parts: Opt[];
  mode?: "create" | "edit";
  serviceId?: number;
  initialValues?: Initial;
}) {
  const router = useRouter();

  // Form state
  const [vehicleId, setVehicleId] = useState<number | "">("");
  const [mechanicId, setMechanicId] = useState<number | "">("");
  const [mechanicName, setMechanicName] = useState("");
  const [date, setDate] = useState("");
  const [odometer, setOdometer] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<{ name: string; price: number }[]>([]);
  const [usedParts, setUsedParts] = useState<
    { partId: number; qty: number; unitPrice: number }[]
  >([]);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form with initial values
  useEffect(() => {
    if (!initialValues) {
      resetForm();
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    
    setVehicleId(initialValues.vehicleId ?? "");
    setMechanicId(initialValues.mechanicId ?? "");
    setMechanicName("");
    setDate(initialValues.date || today);
    setOdometer(initialValues.odometer != null ? String(initialValues.odometer) : "");
    setNotes(initialValues.notes ?? "");
    setItems(initialValues.items?.map(item => ({
      name: item.name || "",
      price: item.price || 0
    })) || []);
    setUsedParts(initialValues.parts?.map(part => ({
      partId: part.partId || 0,
      qty: part.qty || 0,
      unitPrice: part.unitPrice || 0
    })) || []);
  }, [initialValues]);

  // Reset form function
  const resetForm = useCallback(() => {
    const today = new Date().toISOString().split("T")[0];
    setVehicleId("");
    setMechanicId("");
    setMechanicName("");
    setDate(today);
    setOdometer("");
    setNotes("");
    setItems([]);
    setUsedParts([]);
    setErrors({});
  }, []);

  // Item management
  const addItem = () => setItems((prev) => [...prev, { name: "", price: 0 }]);
  const updateItem = (index: number, field: keyof typeof items[0], value: string | number) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };
  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Part management
  const addPart = () => {
    const defaultPart = parts[0];
    setUsedParts((prev) => [
      ...prev,
      { 
        partId: defaultPart?.id || 0, 
        qty: 1, 
        unitPrice: defaultPart?.price || 0 
      },
    ]);
  };

  const updatePart = (index: number, field: keyof typeof usedParts[0], value: number) => {
    setUsedParts(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removePart = (index: number) => {
    setUsedParts(prev => prev.filter((_, i) => i !== index));
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!vehicleId) {
      newErrors.vehicleId = "Pilih kendaraan";
    }

    // Validate items
    items.forEach((item, index) => {
      if (!item.name.trim()) {
        newErrors[`itemName_${index}`] = "Nama pekerjaan diperlukan";
      }
      if (item.price < 0) {
        newErrors[`itemPrice_${index}`] = "Harga tidak valid";
      }
    });

    // Validate parts
    usedParts.forEach((part, index) => {
      if (!part.partId) {
        newErrors[`part_${index}`] = "Pilih sparepart";
      }
      if (part.qty <= 0) {
        newErrors[`partQty_${index}`] = "Jumlah harus lebih dari 0";
      }
      if (part.unitPrice < 0) {
        newErrors[`partPrice_${index}`] = "Harga tidak valid";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Calculate totals for display
  const calculateTotal = () => {
    const itemsTotal = items.reduce((sum, item) => sum + (item.price || 0), 0);
    const partsTotal = usedParts.reduce((sum, part) => sum + (part.qty * part.unitPrice), 0);
    return itemsTotal + partsTotal;
  };

  // Submit handler
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    if (!validateForm()) {
      // Optional: Scroll to first error
      const firstError = document.querySelector('[data-error="true"]');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setLoading(true);
    setErrors({});

    const payload = {
      vehicleId: Number(vehicleId),
      mechanicId: mechanicId ? Number(mechanicId) : undefined,
      mechanicName: mechanicName.trim() || undefined,
      date: date || new Date().toISOString().split('T')[0],
      odometer: odometer ? Number(odometer) : undefined,
      notes: notes.trim() || undefined,
      items: items
        .filter(item => item.name.trim() && item.price >= 0)
        .map(item => ({
          name: item.name.trim(),
          price: Number(item.price) || 0,
        })),
      parts: usedParts
        .filter(part => part.partId && part.qty > 0 && part.unitPrice >= 0)
        .map(part => ({
          partId: Number(part.partId),
          qty: Number(part.qty) || 1,
          unitPrice: Number(part.unitPrice) || 0,
        })),
    };

    try {
      const url = mode === "edit" && serviceId 
        ? `/api/services/${serviceId}` 
        : "/api/services";
      
      const method = mode === "edit" ? "PATCH" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal menyimpan");
      }

      // Success
      toast.success(mode === "edit" ? "Perubahan disimpan!" : "Servis berhasil disimpan!");
      
      // Redirect dengan delay kecil untuk UX
      setTimeout(() => {
        router.push("/services?saved=1");
        router.refresh();
      }, 1000);

    } catch (error: any) {
      console.error("Submit error:", error);
      
      // Show error message
      toast.error(error.message || "Terjadi kesalahan");
      
      // Set form error
      setErrors({ form: error.message || "Gagal menyimpan data" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Total Preview */}
      <div className="rounded-lg bg-blue-50 p-4">
        <div className="flex justify-between items-center">
          <span className="font-medium text-blue-800">Total Estimasi:</span>
          <span className="text-xl font-bold text-blue-900">
            Rp {calculateTotal().toLocaleString("id-ID")}
          </span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Message */}
        {errors.form && (
          <div className="rounded-lg bg-red-50 p-4 border border-red-200">
            <p className="text-red-700 text-sm">{errors.form}</p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {/* Vehicle Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Kendaraan <span className="text-red-500">*</span>
            </label>
            <select
              required
              className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:border-blue-500 ${errors.vehicleId ? 'border-red-500' : 'border-gray-300'}`}
              value={vehicleId}
              onChange={(e) => {
                setVehicleId(e.target.value ? Number(e.target.value) : "");
                if (errors.vehicleId) setErrors(prev => ({ ...prev, vehicleId: "" }));
              }}
              data-error={!!errors.vehicleId}
            >
              <option value="">-- Pilih Kendaraan --</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
            {errors.vehicleId && (
              <p className="text-sm text-red-600">{errors.vehicleId}</p>
            )}
          </div>

          {/* Mechanic Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Mekanik
            </label>
            <div className="grid gap-2 md:grid-cols-2">
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:border-blue-500"
                value={mechanicId}
                onChange={(e) => setMechanicId(e.target.value ? Number(e.target.value) : "")}
              >
                <option value="">-- Pilih Mekanik --</option>
                {mechanics.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Nama mekanik baru"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:border-blue-500"
                value={mechanicName}
                onChange={(e) => setMechanicName(e.target.value)}
              />
            </div>
            <p className="text-xs text-gray-500">Pilih dari daftar atau ketik nama baru</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Date */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Tanggal Servis
            </label>
            <input
              type="date"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:border-blue-500"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Odometer */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Odometer (km)
            </label>
            <input
              type="number"
              min="0"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:border-blue-500"
              value={odometer}
              onChange={(e) => setOdometer(e.target.value)}
              placeholder="Contoh: 15000"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Catatan Tambahan
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:border-blue-500"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan khusus..."
            />
          </div>
        </div>

        {/* Services Section */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Pekerjaan</h3>
              <p className="text-sm text-gray-500">Daftar pekerjaan yang dilakukan</p>
            </div>
            <button
              type="button"
              onClick={addItem}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              + Tambah Pekerjaan
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="grid gap-3 md:grid-cols-2">
                <div>
                  <input
                    type="text"
                    placeholder="Nama pekerjaan"
                    className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:border-blue-500 ${errors[`itemName_${index}`] ? 'border-red-500' : 'border-gray-300'}`}
                    value={item.name}
                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                    data-error={!!errors[`itemName_${index}`]}
                  />
                  {errors[`itemName_${index}`] && (
                    <p className="mt-1 text-sm text-red-600">{errors[`itemName_${index}`]}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Harga"
                      className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:border-blue-500 ${errors[`itemPrice_${index}`] ? 'border-red-500' : 'border-gray-300'}`}
                      value={item.price}
                      onChange={(e) => updateItem(index, 'price', Number(e.target.value))}
                      data-error={!!errors[`itemPrice_${index}`]}
                    />
                    {errors[`itemPrice_${index}`] && (
                      <p className="mt-1 text-sm text-red-600">{errors[`itemPrice_${index}`]}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
            
            {items.length === 0 && (
              <div className="rounded-lg bg-gray-50 p-4 text-center">
                <p className="text-gray-500">Belum ada pekerjaan. Tambahkan pekerjaan pertama.</p>
              </div>
            )}
          </div>
        </div>

        {/* Parts Section */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Sparepart</h3>
              <p className="text-sm text-gray-500">Daftar sparepart yang digunakan</p>
            </div>
            <button
              type="button"
              onClick={addPart}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              + Tambah Sparepart
            </button>
          </div>

          <div className="space-y-3">
            {usedParts.map((part, index) => {
              const selectedPart = parts.find(p => p.id === part.partId);
              const subtotal = part.qty * part.unitPrice;
              
              return (
                <div key={index} className="grid gap-3 md:grid-cols-4">
                  <div>
                    <select
                      className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:border-blue-500 ${errors[`part_${index}`] ? 'border-red-500' : 'border-gray-300'}`}
                      value={part.partId}
                      onChange={(e) => {
                        const id = Number(e.target.value);
                        const master = parts.find(p => p.id === id);
                        updatePart(index, 'partId', id);
                        if (master?.price != null) {
                          updatePart(index, 'unitPrice', master.price);
                        }
                        if (errors[`part_${index}`]) {
                          setErrors(prev => ({ ...prev, [`part_${index}`]: "" }));
                        }
                      }}
                      data-error={!!errors[`part_${index}`]}
                    >
                      <option value={0}>-- Pilih Sparepart --</option>
                      {parts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label} {p.price ? `(Rp ${p.price.toLocaleString()})` : ''}
                        </option>
                      ))}
                    </select>
                    {errors[`part_${index}`] && (
                      <p className="mt-1 text-sm text-red-600">{errors[`part_${index}`]}</p>
                    )}
                  </div>

                  <div>
                    <input
                      type="number"
                      min="1"
                      className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:border-blue-500 ${errors[`partQty_${index}`] ? 'border-red-500' : 'border-gray-300'}`}
                      value={part.qty}
                      onChange={(e) => updatePart(index, 'qty', Number(e.target.value))}
                      data-error={!!errors[`partQty_${index}`]}
                    />
                    {errors[`partQty_${index}`] && (
                      <p className="mt-1 text-sm text-red-600">{errors[`partQty_${index}`]}</p>
                    )}
                  </div>

                  <div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:border-blue-500 ${errors[`partPrice_${index}`] ? 'border-red-500' : 'border-gray-300'}`}
                      value={part.unitPrice}
                      onChange={(e) => updatePart(index, 'unitPrice', Number(e.target.value))}
                      data-error={!!errors[`partPrice_${index}`]}
                    />
                    {errors[`partPrice_${index}`] && (
                      <p className="mt-1 text-sm text-red-600">{errors[`partPrice_${index}`]}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 text-right">
                      <p className="text-sm font-medium text-gray-700">
                        Rp {subtotal.toLocaleString("id-ID")}
                      </p>
                      <p className="text-xs text-gray-500">Subtotal</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePart(index)}
                      className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              );
            })}
            
            {usedParts.length === 0 && (
              <div className="rounded-lg bg-gray-50 p-4 text-center">
                <p className="text-gray-500">Belum ada sparepart. Tambahkan sparepart pertama.</p>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 hover:bg-gray-50"
            disabled={loading}
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading || !vehicleId}
            className="flex-1 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Menyimpan...
              </span>
            ) : mode === "edit" ? (
              "Simpan Perubahan"
            ) : (
              "Simpan Servis"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}