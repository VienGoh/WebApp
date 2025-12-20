// app/clustering/page.tsx
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/roles";
import ClusteringDashboard from "@/components/clustering/ClusteringDashboard";

export const dynamic = "force-dynamic";

export default async function ClusteringPage() {
  await requireRole(["PENELITI", "ADMIN"]); // Admin juga bisa melihat hasil

  // Ambil data lengkap untuk clustering
  const vehicles = await prisma.vehicle.findMany({
    include: { 
      customer: true,
      services: {
        include: {
          items: true,
          parts: {
            include: { part: true }
          }
        },
        orderBy: { date: 'desc' }
      }
    },
    orderBy: { id: "desc" },
  });

  // Ambil hasil clustering terbaru dari database
  const latestClusterRun = await prisma.clusterRun.findFirst({
    orderBy: { createdAt: 'desc' },
    include: {
      assigns: {
        include: {
          vehicle: {
            include: {
              customer: true,
              services: true
            }
          }
        }
      },
      centroids: true
    }
  });

  // Format data untuk clustering
  const vehicleData = vehicles.map(vehicle => {
    // Hitung fitur untuk clustering
    const serviceCount = vehicle.services.length;
    const totalSpent = vehicle.services.reduce((sum, service) => {
      const itemsTotal = service.items.reduce((s, item) => s + item.price, 0);
      const partsTotal = service.parts.reduce((s, part) => s + (part.qty * part.unitPrice), 0);
      return sum + itemsTotal + partsTotal;
    }, 0);
    const avgServiceCost = serviceCount > 0 ? totalSpent / serviceCount : 0;
    
    // Hitung hari sejak servis terakhir
    const lastService = vehicle.services[0]?.date;
    const daysSinceLastService = lastService 
      ? Math.floor((new Date().getTime() - new Date(lastService).getTime()) / (1000 * 60 * 60 * 24))
      : 365; // Jika belum pernah servis

    return {
      id: vehicle.id,
      plate: vehicle.plate,
      brand: vehicle.brand,
      model: vehicle.model || '',
      year: vehicle.year || 0,
      customerName: vehicle.customer.name,
      // Features untuk clustering
      serviceCount,
      totalSpent,
      avgServiceCost,
      daysSinceLastService,
      // Hasil clustering sebelumnya
      currentCluster: latestClusterRun?.assigns.find(a => a.vehicleId === vehicle.id)?.idx
    };
  });

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analisis Clustering K-Means</h1>
          <p className="text-gray-600 text-sm mt-1">
            Segmentasi pelanggan berdasarkan pola servis menggunakan algoritma K-Means
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Total Data: <span className="font-medium">{vehicleData.length}</span> kendaraan
        </div>
      </div>

      {/* Dashboard Clustering */}
      <ClusteringDashboard 
        vehicleData={vehicleData}
        latestClusterRun={latestClusterRun}
      />

      {/* Penjelasan untuk Skripsi */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mt-8">
        <h2 className="text-lg font-semibold text-blue-800 mb-3">📋 Keterangan untuk Skripsi</h2>
        <div className="space-y-3 text-sm text-blue-700">
          <p>
            <strong>Fungsi Halaman Clustering:</strong> Mengimplementasikan algoritma K-Means untuk 
            mengelompokkan pelanggan/kendaraan berdasarkan pola servis.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="font-medium mb-1">Parameter Clustering:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Frekuensi servis (serviceCount)</li>
                <li>Total pengeluaran (totalSpent)</li>
                <li>Rata-rata biaya servis (avgServiceCost)</li>
                <li>Jarak waktu sejak servis terakhir (daysSinceLastService)</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-1">Manfaat untuk Bengkel:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Identifikasi pelanggan loyal (high-value)</li>
                <li>Segmentasi untuk program retensi</li>
                <li>Perencanaan stok suku cadang</li>
                <li>Strategi pemasaran berbasis data</li>
              </ul>
            </div>
          </div>
          <p className="pt-2 border-t border-blue-300">
            <strong>Implementasi sesuai tujuan penelitian poin 4:</strong> 
            "Mengimplementasikan metode K-Means clustering untuk mengelompokkan data pelanggan 
            dan kendaraan berdasarkan pola kunjungan servis, jenis kerusakan, serta karakteristik kendaraan."
          </p>
        </div>
      </div>
    </section>
  );
}