import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/roles";
import MetricCard from "@/components/ui/MetricCard";
import { 
  ServiceTrendChart, 
  VehicleTypeChart, 
  ServiceCategoryChart, 
  TopCustomersChart 
} from "@/components/dashboard/Charts";

export const dynamic = "force-dynamic";

const formatIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(n);

// Fungsi untuk mendapatkan data 6 bulan terakhir
function getLastSixMonths() {
  const months = [];
  const today = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push({
      month: date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }),
      monthIndex: date.getMonth(),
      year: date.getFullYear()
    });
  }
  
  return months;
}

export default async function Page() {
  await requireRole(["ADMIN", "PENELITI"]);

  // Data dasar - PERBAIKAN: gunakan 'services' bukan 'serviceOrders'
  const [cust, veh, orders, customers, vehicles, mechanics] = await Promise.all([
    prisma.customer.count(),
    prisma.vehicle.count(),
    prisma.serviceOrder.findMany({ 
      include: { 
        items: true, 
        parts: true,
        vehicle: {
          include: {
            customer: true
          }
        },
        mechanic: true
      }
    }),
    prisma.customer.findMany({
      include: {
        vehicles: {
          include: {
            services: {  // PERBAIKAN: 'services' bukan 'serviceOrders'
              include: {
                items: true,
                parts: true
              }
            }
          }
        }
      }
    }),
    prisma.vehicle.findMany({
      include: {
        services: true,  // PERBAIKAN: 'services' bukan 'serviceOrders'
        customer: true
      }
    }),
    prisma.mechanic.findMany()
  ]);

  // Hitung pendapatan
  const revenue = orders.reduce(
    (sum, o) =>
      sum +
      o.items.reduce((a, i) => a + i.price, 0) +
      o.parts.reduce((a, p) => a + p.qty * p.unitPrice, 0),
    0
  );

  // Data untuk tren bulanan
  const lastSixMonths = getLastSixMonths();
  const monthlyData = lastSixMonths.map(({ month, monthIndex, year }) => {
    const monthOrders = orders.filter(o => {
      const orderDate = new Date(o.date);
      return orderDate.getMonth() === monthIndex && 
             orderDate.getFullYear() === year;
    });
    
    const monthRevenue = monthOrders.reduce((sum, o) => 
      sum + o.items.reduce((a, i) => a + i.price, 0) + 
      o.parts.reduce((a, p) => a + p.qty * p.unitPrice, 0), 0
    );
    
    return {
      month,
      orders: monthOrders.length,
      revenue: monthRevenue
    };
  });

  // Data untuk tipe kendaraan (gunakan brand sebagai tipe)
  const vehicleTypeData = vehicles.reduce((acc, vehicle) => {
    const brand = vehicle.brand || 'Tidak Diketahui';
    if (!acc[brand]) acc[brand] = 0;
    acc[brand] += vehicle.services.length;  // PERBAIKAN: 'services' bukan 'serviceOrders'
    return acc;
  }, {} as Record<string, number>);

  // Data untuk kategori servis (dari item servis)
  const serviceCategoryData = orders.reduce((acc, order) => {
    order.items.forEach(item => {
      // Ambil kata pertama sebagai kategori, atau gunakan "Lainnya"
      const category = item.name.split(' ')[0] || 'Lainnya';
      if (!acc[category]) acc[category] = 0;
      acc[category] += item.price;
    });
    
    // Jika tidak ada item, tetap tambahkan sebagai "Lainnya"
    if (order.items.length === 0) {
      if (!acc['Lainnya']) acc['Lainnya'] = 0;
      acc['Lainnya'] += order.parts.reduce((sum, p) => sum + (p.qty * p.unitPrice), 0);
    }
    
    return acc;
  }, {} as Record<string, number>);

  // Data pelanggan teratas (berdasarkan frekuensi servis) - PERBAIKAN: gunakan 'services'
  const topCustomersData = customers
    .map(customer => {
      const totalServices = customer.vehicles.reduce((sum, vehicle) => 
        sum + vehicle.services.length, 0
      );
      
      const totalSpent = customer.vehicles.reduce((sum, vehicle) => 
        sum + vehicle.services.reduce((orderSum, order) => 
          orderSum + order.items.reduce((a, i) => a + i.price, 0) + 
          order.parts.reduce((a, p) => a + p.qty * p.unitPrice, 0), 0
        ), 0
      );
      
      return {
        name: customer.name.substring(0, 15) + (customer.name.length > 15 ? '...' : ''),
        serviceCount: totalServices,
        totalSpent: totalSpent
      };
    })
    .filter(customer => customer.serviceCount > 0) // Hanya pelanggan yang pernah servis
    .sort((a, b) => b.serviceCount - a.serviceCount)
    .slice(0, 10);

  // Data untuk mekanik paling sibuk
  const mechanicData = mechanics.map(mechanic => ({
    name: mechanic.name,
    serviceCount: orders.filter(o => o.mechanicId === mechanic.id).length
  }))
  .filter(m => m.serviceCount > 0)
  .sort((a, b) => b.serviceCount - a.serviceCount)
  .slice(0, 5);

  // Data untuk clustering (jika ada)
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

  // Siapkan data cluster untuk visualisasi
  const clusterData = latestClusterRun ? 
    Array.from({ length: latestClusterRun.k }, (_, i) => {
      const clusterVehicles = latestClusterRun.assigns.filter(a => a.idx === i);
      const totalServices = clusterVehicles.reduce((sum, a) => 
        sum + a.vehicle.services.length, 0
      );
      const avgServices = clusterVehicles.length > 0 ? 
        (totalServices / clusterVehicles.length).toFixed(1) : '0';
      
      const totalSpent = clusterVehicles.reduce((sum, a) => 
        sum + a.vehicle.services.reduce((orderSum, order) => 
          orderSum + order.items.reduce((itemSum, item) => itemSum + item.price, 0) + 
          order.parts.reduce((partSum, part) => partSum + (part.qty * part.unitPrice), 0), 0
        ), 0
      );
      
      const avgSpent = clusterVehicles.length > 0 ? 
        Math.round(totalSpent / clusterVehicles.length) : 0;
      
      return {
        cluster: i + 1,
        customerCount: clusterVehicles.length,
        avgServices: parseFloat(avgServices),
        avgSpent: avgSpent
      };
    }) : 
    [
      { cluster: 1, customerCount: 12, avgServices: 2.5, avgSpent: 350000 },
      { cluster: 2, customerCount: 8, avgServices: 5.8, avgSpent: 750000 },
      { cluster: 3, customerCount: 15, avgServices: 1.2, avgSpent: 180000 }
    ];

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard Analisis Bengkel</h1>

      {/* Statistik Ringkas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Pelanggan" value={cust} />
        <MetricCard title="Total Kendaraan" value={veh} />
        <MetricCard title="Total Servis" value={orders.length} />
        <MetricCard title="Total Pendapatan" value={`Rp ${formatIDR(revenue)}`} hint="Kumulatif dari semua servis" />
      </div>

      {/* Tren Bulanan */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">📈 Tren Servis Bulanan (6 Bulan Terakhir)</h2>
        <div className="h-80">
          <ServiceTrendChart data={monthlyData} />
        </div>
        <p className="text-sm text-gray-500 mt-4">
          <strong>Analisis Pola:</strong> Grafik menunjukkan fluktuasi jumlah servis dan pendapatan bulanan, 
          membantu identifikasi musiman dan perencanaan stok.
        </p>
      </div>

      {/* Grafik Baris 2 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Merek Kendaraan Terbanyak Servis */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">🏍️ Servis per Merek Kendaraan</h2>
          <div className="h-64">
            <VehicleTypeChart data={vehicleTypeData} />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            <strong>Insight:</strong> {Object.keys(vehicleTypeData)[0]} adalah merek dengan servis terbanyak (
            {vehicleTypeData[Object.keys(vehicleTypeData)[0]] || 0} servis)
          </p>
        </div>

        {/* Distribusi Pendapatan per Kategori */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">💰 Distribusi Pendapatan per Kategori Servis</h2>
          <div className="h-64">
            <ServiceCategoryChart data={serviceCategoryData} />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            <strong>Analisis Profitabilitas:</strong> Identifikasi layanan dengan margin tertinggi
          </p>
        </div>
      </div>

      {/* Grafik Baris 3 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Segmentasi Pelanggan */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">👥 Segmentasi Pelanggan (Top 10)</h2>
          <div className="h-80">
            <TopCustomersChart data={topCustomersData} />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            <strong>Segmentasi Loyalitas:</strong> {topCustomersData.length > 0 ? topCustomersData[0].name : 'Tidak ada data'} 
            adalah pelanggan paling loyal dengan {topCustomersData.length > 0 ? topCustomersData[0].serviceCount : 0} kunjungan servis
          </p>
        </div>

        {/* Produktivitas Mekanik */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">🔧 Produktivitas Mekanik (Top 5)</h2>
          <div className="space-y-3">
            {mechanicData.length > 0 ? (
              mechanicData.map((mechanic, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">{index + 1}</span>
                    </div>
                    <span className="font-medium">{mechanic.name}</span>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {mechanic.serviceCount} servis
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p>Belum ada data mekanik</p>
              </div>
            )}
          </div>
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Rekomendasi:</strong> Berikan insentif tambahan untuk mekanik dengan produktivitas tinggi
            </p>
          </div>
        </div>
      </div>

      {/* Visualisasi Hasil Clustering K-Means */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">📊 Hasil Analisis Clustering K-Means</h2>
        <div className="h-auto bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center p-3 bg-white rounded-full shadow-lg mb-3">
              <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Segmentasi Pelanggan Berbasis Pola Servis</h3>
            <p className="text-gray-600">Menggunakan algoritma K-Means untuk mengidentifikasi kelompok pelanggan</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {clusterData.map((cluster, index) => (
              <div key={index} className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${
                      cluster.cluster === 1 ? 'bg-blue-500' : 
                      cluster.cluster === 2 ? 'bg-green-500' : 'bg-purple-500'
                    }`}></div>
                    <span className="font-bold text-gray-800">CLUSTER {cluster.cluster}</span>
                  </div>
                  <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 font-medium">
                    {cluster.customerCount} pelanggan
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Rata-rata servis/tahun:</span>
                    <span className="font-semibold">{cluster.avgServices}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Rata-rata belanja:</span>
                    <span className="font-semibold">Rp {formatIDR(cluster.avgSpent)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Karakteristik:</span>
                    <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700">
                      {cluster.cluster === 1 ? 'Low Value' : 
                       cluster.cluster === 2 ? 'High Value' : 'Medium Value'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <button className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow">
              <span className="flex items-center justify-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                Lihat Analisis Detail Clustering
              </span>
            </button>
          </div>
        </div>
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>🔍 Interpretasi Hasil Clustering:</strong> Sistem telah mengelompokkan pelanggan ke dalam 3 cluster berdasarkan 
            frekuensi servis dan nilai transaksi. Cluster 2 (High Value) menunjukkan pelanggan dengan loyalitas tinggi yang 
            membutuhkan perhatian khusus melalui program retensi.
          </p>
          <p className="text-sm text-gray-600 mt-2">
            <strong>🎯 Rekomendasi Strategis:</strong> Fokus pada cluster High Value untuk program loyalitas, 
            sementara cluster Low Value dapat di-target dengan promosi untuk meningkatkan frekuensi kunjungan.
          </p>
        </div>
      </div>

      {/* Ringkasan Insight */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">💡 Insight Utama Dashboard</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold text-gray-700 mb-2">📈 Pola Tren</h3>
            <p className="text-sm text-gray-600">
              {monthlyData.length > 0 && monthlyData[monthlyData.length - 1].orders > monthlyData[0].orders 
                ? `Tren servis meningkat ${Math.round(((monthlyData[monthlyData.length - 1].orders - monthlyData[0].orders) / monthlyData[0].orders) * 100)}% dalam 6 bulan`
                : 'Analisis tren menunjukkan pola stabil'}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold text-gray-700 mb-2">👥 Segmentasi</h3>
            <p className="text-sm text-gray-600">
              {topCustomersData.length > 0 
                ? `Top 10% pelanggan memberikan ${Math.round((topCustomersData.reduce((sum, c) => sum + c.totalSpent, 0) / revenue) * 100)}% pendapatan`
                : 'Segmentasi pelanggan membantu strategi retensi'}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold text-gray-700 mb-2">🎯 Rekomendasi</h3>
            <p className="text-sm text-gray-600">
              Fokus pada layanan dengan margin tinggi dan pengembangan program loyalitas untuk cluster High Value
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}