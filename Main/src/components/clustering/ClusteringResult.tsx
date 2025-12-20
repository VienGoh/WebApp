"use client";

import { useState } from "react";
import { toast } from "sonner";

interface ClusterResult {
  id: number;
  centroid?: {
    c1: number;
    c2: number;
    c3: number;
  };
  vehicles: Array<{
    id: number;
    plate: string;
    customerName: string;
    serviceCount: number;
  }>;
  stats: {
    count: number;
    avgServices: number;
  };
}

interface ClusterResultsProps {
  results: {
    k: number;
    sse: number;
    clusters: ClusterResult[];
  };
  onSaveResults: () => Promise<void>;
}

export default function ClusterResults({ results, onSaveResults }: ClusterResultsProps) {
  const [expandedCluster, setExpandedCluster] = useState<number | null>(0);
  const [saving, setSaving] = useState(false);

  // Warna untuk setiap cluster
  const clusterColors = [
    { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300" },
    { bg: "bg-green-100", text: "text-green-800", border: "border-green-300" },
    { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-300" },
    { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-300" },
    { bg: "bg-pink-100", text: "text-pink-800", border: "border-pink-300" },
  ];

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveResults();
    } catch (error) {
      toast.error("Gagal menyimpan hasil");
    } finally {
      setSaving(false);
    }
  };

  const getClusterLabel = (clusterId: number) => {
    const labels = [
      "Pelanggan Loyal (High Value)",
      "Pelanggan Potensial (Medium Value)",
      "Pelanggan Baru (Low Value)",
      "Pelanggan Jarang (At Risk)",
      "Pelanggan Spesifik",
    ];
    return labels[clusterId] || `Cluster ${clusterId}`;
  };

  const getClusterDescription = (clusterId: number) => {
    const descriptions = [
      "Frekuensi servis tinggi, pengeluaran besar, loyalitas baik",
      "Frekuensi servis sedang, potensi menjadi loyal",
      "Frekuensi servis rendah, masih perlu engagement",
      "Jarang servis, perlu strategi retensi khusus",
      "Pola servis unik, butuh analisis lebih lanjut",
    ];
    return descriptions[clusterId] || "Cluster dengan karakteristik tertentu";
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-4 border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-gray-600">Jumlah Cluster</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{results.k}</p>
        </div>
        <div className="rounded-xl bg-white p-4 border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-gray-600">Total Kendaraan</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {results.clusters.reduce((sum, c) => sum + c.stats.count, 0)}
          </p>
        </div>
        <div className="rounded-xl bg-white p-4 border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-gray-600">SSE Score</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {results.sse.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">(Sum of Squared Errors)</p>
        </div>
        <div className="rounded-xl bg-white p-4 border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-gray-600">Status</p>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <p className="text-lg font-bold text-gray-900">Berhasil</p>
          </div>
        </div>
      </div>

      {/* Cluster Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {results.clusters.map((cluster, index) => {
          const color = clusterColors[index % clusterColors.length];
          
          return (
            <div
              key={cluster.id}
              className={`rounded-xl border ${color.border} ${color.bg} p-5`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${color.text.replace('text-', 'bg-')}`}></div>
                    <h3 className={`text-lg font-bold ${color.text}`}>
                      {getClusterLabel(cluster.id)}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{getClusterDescription(cluster.id)}</p>
                </div>
                <span className={`rounded-full ${color.text.replace('text-', 'bg-')} px-3 py-1 text-xs font-bold text-white`}>
                  {cluster.stats.count} kendaraan
                </span>
              </div>

              {/* Cluster Stats */}
              <div className="space-y-3 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Rata-rata Servis</p>
                  <p className="text-xl font-bold text-gray-900">
                    {cluster.stats.avgServices.toFixed(1)} kali
                  </p>
                </div>
                {cluster.centroid && (
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-center">
                      <p className="font-medium text-gray-600">C1</p>
                      <p className="font-bold">{cluster.centroid.c1.toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-gray-600">C2</p>
                      <p className="font-bold">{cluster.centroid.c2.toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-gray-600">C3</p>
                      <p className="font-bold">{cluster.centroid.c3?.toFixed(2) || "-"}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Toggle untuk melihat anggota */}
              <button
                onClick={() => setExpandedCluster(expandedCluster === cluster.id ? null : cluster.id)}
                className="w-full rounded-lg bg-white border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {expandedCluster === cluster.id ? "Sembunyikan" : "Lihat"} Anggota Cluster
              </button>

              {/* Anggota Cluster (expandable) */}
              {expandedCluster === cluster.id && (
                <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                  {cluster.vehicles.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      className="flex items-center justify-between rounded-lg bg-white p-3 border"
                    >
                      <div>
                        <p className="font-medium text-gray-800">{vehicle.plate}</p>
                        <p className="text-sm text-gray-500">{vehicle.customerName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-700">
                          {vehicle.serviceCount} servis
                        </p>
                        <p className="text-xs text-gray-500">Total</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Detailed Table */}
      <div className="rounded-xl bg-white border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Detail Hasil Clustering</h3>
          <p className="text-sm text-gray-500">Daftar lengkap kendaraan dan cluster assignment</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Cluster
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Plat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Pemilik
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Jumlah Servis
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Karakteristik
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {results.clusters.flatMap((cluster, clusterIndex) =>
                cluster.vehicles.map((vehicle) => {
                  const color = clusterColors[clusterIndex % clusterColors.length];
                  
                  return (
                    <tr key={`${cluster.id}-${vehicle.id}`} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${color.text} ${color.bg}`}>
                          C{cluster.id}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                        {vehicle.plate}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {vehicle.customerName}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-12 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${color.text.replace('text-', 'bg-')}`}
                              style={{ width: `${Math.min(100, (vehicle.serviceCount / 10) * 100)}%` }}
                            ></div>
                          </div>
                          <span>{vehicle.serviceCount}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {getClusterDescription(cluster.id)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex-1 rounded-lg px-4 py-3 font-medium text-white transition-colors ${
            saving ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Menyimpan...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Simpan Hasil Clustering
            </span>
          )}
        </button>
        <button
          onClick={() => window.print()}
          className="rounded-lg border border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 hover:bg-gray-50"
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Cetak untuk Dokumentasi
          </span>
        </button>
      </div>

      {/* Interpretasi untuk Skripsi */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-5">
        <h3 className="font-bold text-blue-800 mb-3">📝 Interpretasi Hasil untuk Bab Analisis Skripsi</h3>
        <div className="space-y-4">
          <div>
            <p className="font-medium text-blue-700">Kesimpulan Segmentasi:</p>
            <ul className="list-disc pl-5 space-y-1 text-blue-600">
              <li>Cluster C0: Pelanggan loyal dengan frekuensi servis tinggi - prioritas retensi</li>
              <li>Cluster C1: Pelanggan potensial dengan pola sedang - target upselling</li>
              <li>Cluster C2: Pelanggan baru/risiko churn - butuh program engagement</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-blue-700">Rekomendasi Bisnis:</p>
            <ul className="list-disc pl-5 space-y-1 text-blue-600">
              <li>Program loyalitas khusus untuk Cluster C0</li>
              <li>Paket servis terjangkau untuk Cluster C2</li>
              <li>Notifikasi personalisasi berdasarkan karakteristik cluster</li>
            </ul>
          </div>
          <div className="text-sm text-blue-500">
            <p><strong>SSE Score:</strong> {results.sse.toFixed(2)} (semakin kecil semakin baik)</p>
            <p><strong>Distribusi Cluster:</strong> {results.clusters.map(c => `${c.stats.count} data`).join(', ')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}