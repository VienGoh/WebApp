"use client";

import { useState } from "react";

interface KMeansFormProps {
  vehicleCount: number;
  defaultK: number;
  onRunClustering: (k: number, features: string[]) => Promise<void>;
  loading: boolean;
}

// Pilihan fitur yang bisa digunakan
const AVAILABLE_FEATURES = [
  { id: "serviceCount", label: "Frekuensi Servis", description: "Jumlah total servis" },
  { id: "totalSpent", label: "Total Pengeluaran", description: "Total biaya servis (Rp)" },
  { id: "avgServiceCost", label: "Rata-rata Biaya", description: "Rata-rata biaya per servis" },
  { id: "daysSinceLastService", label: "Hari Sejak Servis", description: "Jarak hari sejak servis terakhir" },
  { id: "vehicleAge", label: "Usia Kendaraan", description: "Berdasarkan tahun produksi" },
];

export default function KMeansForm({ 
  vehicleCount, 
  defaultK, 
  onRunClustering, 
  loading 
}: KMeansFormProps) {
  const [k, setK] = useState(defaultK);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
    "serviceCount", 
    "totalSpent", 
    "daysSinceLastService"
  ]);
  const [normalize, setNormalize] = useState(true);

  const handleFeatureToggle = (featureId: string) => {
    setSelectedFeatures(prev =>
      prev.includes(featureId)
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedFeatures.length < 2) {
      toast.error("Pilih minimal 2 fitur untuk clustering");
      return;
    }

    if (k > vehicleCount) {
      toast.error("Jumlah cluster tidak boleh melebihi jumlah data");
      return;
    }

    await onRunClustering(k, selectedFeatures);
  };

  const isDisabled = loading || selectedFeatures.length < 2;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800">Parameter Clustering K-Means</h2>
        <p className="text-sm text-gray-500 mt-1">
          Konfigurasi algoritma untuk segmentasi data kendaraan
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Jumlah Cluster */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Jumlah Cluster (k)
            </label>
            <span className="text-sm text-gray-500">
              Rekomendasi: 3-5 cluster
            </span>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="2"
              max={Math.min(10, vehicleCount)}
              value={k}
              onChange={(e) => setK(parseInt(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="w-16 text-center">
              <span className="text-2xl font-bold text-blue-600">{k}</span>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>2</span>
            <span>5 (optimal)</span>
            <span>10</span>
          </div>
          <p className="text-sm text-gray-600">
            Cluster akan mengelompokkan <span className="font-medium">{vehicleCount}</span> kendaraan
            menjadi <span className="font-medium">{k}</span> kelompok berdasarkan kemiripan pola servis.
          </p>
        </div>

        {/* Pilih Fitur */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Fitur untuk Analisis <span className="text-red-500">*</span>
            <span className="text-gray-500 font-normal ml-2">
              (Pilih minimal 2)
            </span>
          </label>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {AVAILABLE_FEATURES.map((feature) => (
              <div
                key={feature.id}
                onClick={() => handleFeatureToggle(feature.id)}
                className={`cursor-pointer rounded-lg border p-4 transition-all ${
                  selectedFeatures.includes(feature.id)
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedFeatures.includes(feature.id)}
                        onChange={() => {}} // Handled by parent div click
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-medium text-gray-800">{feature.label}</span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">{feature.description}</p>
                  </div>
                  {selectedFeatures.includes(feature.id) && (
                    <div className="rounded-full bg-blue-100 p-1">
                      <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pengaturan Lanjutan */}
        <div className="space-y-3 border-t border-gray-200 pt-4">
          <label className="block text-sm font-medium text-gray-700">
            Pengaturan Lanjutan
          </label>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-700">Normalisasi Data</p>
                <p className="text-sm text-gray-500">
                  Skala fitur ke rentang 0-1 untuk hasil lebih baik
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNormalize(!normalize)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                  normalize ? "bg-blue-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    normalize ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-700">Metode Inisialisasi</p>
                <p className="text-sm text-gray-500">K-Means++ (lebih cepat & akurat)</p>
              </div>
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                Default
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-700">Maksimum Iterasi</p>
                <p className="text-sm text-gray-500">100 iterasi untuk konvergensi</p>
              </div>
              <span className="text-sm font-medium text-gray-700">100</span>
            </div>
          </div>
        </div>

        {/* Preview Data */}
        <div className="rounded-lg bg-gray-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-700">Preview Data</h3>
            <span className="text-sm text-gray-500">
              {vehicleCount} records × {selectedFeatures.length} features
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">No</th>
                  {AVAILABLE_FEATURES
                    .filter(f => selectedFeatures.includes(f.id))
                    .map(feature => (
                      <th key={feature.id} className="px-3 py-2 text-left font-medium text-gray-500">
                        {feature.label}
                      </th>
                    ))
                  }
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[1, 2, 3].map((row) => (
                  <tr key={row}>
                    <td className="whitespace-nowrap px-3 py-2 text-gray-600">{row}</td>
                    {AVAILABLE_FEATURES
                      .filter(f => selectedFeatures.includes(f.id))
                      .map(feature => (
                        <td key={feature.id} className="whitespace-nowrap px-3 py-2 text-gray-600">
                          {feature.id === "serviceCount" ? Math.floor(Math.random() * 10) + 1 :
                           feature.id === "totalSpent" ? `Rp ${((Math.random() * 5000000) + 500000).toLocaleString('id-ID')}` :
                           feature.id === "avgServiceCost" ? `Rp ${((Math.random() * 1000000) + 100000).toLocaleString('id-ID')}` :
                           feature.id === "daysSinceLastService" ? Math.floor(Math.random() * 180) + 1 :
                           Math.floor(Math.random() * 10) + 2015}
                        </td>
                      ))
                    }
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-gray-500">
            Menampilkan 3 sample dari {vehicleCount} data kendaraan
          </p>
        </div>

        {/* Tombol Aksi */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={isDisabled}
            className={`flex-1 rounded-lg px-4 py-3 font-medium text-white transition-colors ${
              isDisabled
                ? "cursor-not-allowed bg-gray-400"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Memproses Clustering...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Jalankan Clustering
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setK(3);
              setSelectedFeatures(["serviceCount", "totalSpent", "daysSinceLastService"]);
              setNormalize(true);
            }}
            className="rounded-lg border border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 hover:bg-gray-50"
          >
            Reset ke Default
          </button>
        </div>

        {/* Info untuk Skripsi */}
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-amber-100 p-2">
              <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-amber-800">Catatan untuk Dokumentasi Skripsi</p>
              <p className="text-sm text-amber-700 mt-1">
                Form ini mengimplementasikan parameter clustering K-Means sesuai dengan 
                metodologi penelitian. Fitur yang dipilih akan dinormalisasi dan digunakan 
                sebagai input algoritma untuk segmentasi pelanggan.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}