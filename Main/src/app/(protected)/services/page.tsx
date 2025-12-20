import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/roles";
import Link from "next/link";
import SearchBar from "@/components/ui/SearchBar";
import ServicesTable from "@/components/services/servicesTables";

export const dynamic = "force-dynamic";

// Format tanggal ke Indonesia
const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// Format mata uang
const formatIDR = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

interface ServicesPageProps {
  searchParams: {
    page?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    sort?: string;
  };
}

export default async function ServicesPage({ searchParams }: ServicesPageProps) {
  await requireRole(["ADMIN", "PENELITI"]);

  const page = parseInt(searchParams.page || "1");
  const limit = 10;
  const skip = (page - 1) * limit;

  // Build filter
  const where: any = {};
  
  // Search filter
  if (searchParams.search) {
    where.OR = [
      {
        vehicle: {
          plate: {
            contains: searchParams.search,
            mode: "insensitive",
          },
        },
      },
      {
        vehicle: {
          customer: {
            name: {
              contains: searchParams.search,
              mode: "insensitive",
            },
          },
        },
      },
      {
        mechanic: {
          name: {
            contains: searchParams.search,
            mode: "insensitive",
          },
        },
      },
    ];
  }

  // Date filter
  if (searchParams.startDate || searchParams.endDate) {
    where.date = {};
    if (searchParams.startDate) {
      where.date.gte = new Date(searchParams.startDate);
    }
    if (searchParams.endDate) {
      where.date.lte = new Date(searchParams.endDate);
    }
  }

  // Sort order
  const orderBy = searchParams.sort === "oldest" 
    ? { date: "asc" } 
    : { date: "desc" };

  // Fetch data dengan pagination
  const [services, totalServices] = await Promise.all([
    prisma.serviceOrder.findMany({
      where,
      include: {
        vehicle: {
          include: {
            customer: true,
          },
        },
        mechanic: true,
        items: true,
        parts: {
          include: {
            part: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.serviceOrder.count({ where }),
  ]);

  // Calculate total pages
  const totalPages = Math.ceil(totalServices / limit);

  // Format data untuk table
  const formattedServices = services.map((service) => {
    // Hitung total biaya
    const itemsTotal = service.items.reduce((sum, item) => sum + item.price, 0);
    const partsTotal = service.parts.reduce(
      (sum, part) => sum + part.qty * part.unitPrice,
      0
    );
    const total = itemsTotal + partsTotal;

    return {
      id: service.id,
      date: formatDate(service.date),
      vehicle: `${service.vehicle.plate} (${service.vehicle.brand})`,
      customer: service.vehicle.customer.name,
      mechanic: service.mechanic?.name || "-",
      itemsCount: service.items.length,
      partsCount: service.parts.length,
      total: formatIDR(total),
      status: "Selesai", // Atau bisa dari field status di database
    };
  });

  // Statistics
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const [monthlyServices, monthlyRevenue] = await Promise.all([
    prisma.serviceOrder.count({
      where: {
        date: {
          gte: startOfMonth,
        },
      },
    }),
    prisma.serviceOrder.findMany({
      where: {
        date: {
          gte: startOfMonth,
        },
      },
      include: {
        items: true,
        parts: true,
      },
    }).then(services => {
      return services.reduce((sum, service) => {
        const itemsTotal = service.items.reduce((s, item) => s + item.price, 0);
        const partsTotal = service.parts.reduce((s, part) => s + part.qty * part.unitPrice, 0);
        return sum + itemsTotal + partsTotal;
      }, 0);
    }),
  ]);

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Servis</h1>
          <p className="text-gray-600 text-sm mt-1">
            Kelola data servis kendaraan pelanggan
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/services/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Servis Baru
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Servis</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalServices}</p>
            </div>
            <div className="rounded-lg bg-blue-100 p-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Semua waktu</p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Servis Bulan Ini</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{monthlyServices}</p>
            </div>
            <div className="rounded-lg bg-green-100 p-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pendapatan Bulan Ini</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatIDR(monthlyRevenue).replace('Rp', 'Rp ')}
              </p>
            </div>
            <div className="rounded-lg bg-purple-100 p-3">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Bulan berjalan</p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rata-rata/Servis</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {monthlyServices > 0 
                  ? formatIDR(monthlyRevenue / monthlyServices).replace('Rp', 'Rp ')
                  : formatIDR(0)
                }
              </p>
            </div>
            <div className="rounded-lg bg-amber-100 p-3">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Per transaksi</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Daftar Servis</h2>
            <p className="text-sm text-gray-500 mt-1">
              Menampilkan {formattedServices.length} dari {totalServices} servis
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-2">
              <Link
                href="/services?sort=latest"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  searchParams.sort !== "oldest" 
                    ? "bg-blue-600 text-white" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Terbaru
              </Link>
              <Link
                href="/services?sort=oldest"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  searchParams.sort === "oldest" 
                    ? "bg-blue-600 text-white" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Terlama
              </Link>
            </div>
            
            <SearchBar 
              placeholder="Cari plat/kendaraan/pelanggan..." 
              defaultValue={searchParams.search}
            />
          </div>
        </div>

        {/* Date Filter */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Filter Tanggal</h3>
          <form className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Dari Tanggal</label>
              <input
                type="date"
                name="startDate"
                defaultValue={searchParams.startDate}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Sampai Tanggal</label>
              <input
                type="date"
                name="endDate"
                defaultValue={searchParams.endDate}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="h-10 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Terapkan
              </button>
              <Link
                href="/services"
                className="h-10 px-4 border border-gray-300 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 inline-flex items-center"
              >
                Reset
              </Link>
            </div>
          </form>
        </div>

        {/* Services Table */}
        {formattedServices.length > 0 ? (
          <ServicesTable services={formattedServices} />
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada data servis</h3>
            <p className="text-gray-500 max-w-sm mx-auto mb-6">
              {searchParams.search || searchParams.startDate || searchParams.endDate
                ? "Tidak ada servis yang sesuai dengan filter pencarian."
                : "Belum ada data servis yang dicatat."}
            </p>
            {searchParams.search || searchParams.startDate || searchParams.endDate ? (
              <Link
                href="/services"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Reset Filter
              </Link>
            ) : (
              <Link
                href="/services/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Tambah Servis Pertama
              </Link>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 pt-6 mt-6">
            <div className="text-sm text-gray-700">
              Halaman <span className="font-medium">{page}</span> dari{" "}
              <span className="font-medium">{totalPages}</span>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/services?page=${page - 1}${searchParams.search ? `&search=${searchParams.search}` : ""}${searchParams.startDate ? `&startDate=${searchParams.startDate}` : ""}${searchParams.endDate ? `&endDate=${searchParams.endDate}` : ""}${searchParams.sort ? `&sort=${searchParams.sort}` : ""}`}
                className={`px-3 py-2 rounded-lg border text-sm font-medium ${
                  page <= 1
                    ? "border-gray-200 text-gray-400 cursor-not-allowed"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
                aria-disabled={page <= 1}
              >
                Sebelumnya
              </Link>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Link
                      key={pageNum}
                      href={`/services?page=${pageNum}${searchParams.search ? `&search=${searchParams.search}` : ""}${searchParams.startDate ? `&startDate=${searchParams.startDate}` : ""}${searchParams.endDate ? `&endDate=${searchParams.endDate}` : ""}${searchParams.sort ? `&sort=${searchParams.sort}` : ""}`}
                      className={`px-3 py-2 rounded-lg text-sm font-medium ${
                        page === pageNum
                          ? "bg-blue-600 text-white"
                          : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </Link>
                  );
                })}
              </div>
              <Link
                href={`/services?page=${page + 1}${searchParams.search ? `&search=${searchParams.search}` : ""}${searchParams.startDate ? `&startDate=${searchParams.startDate}` : ""}${searchParams.endDate ? `&endDate=${searchParams.endDate}` : ""}${searchParams.sort ? `&sort=${searchParams.sort}` : ""}`}
                className={`px-3 py-2 rounded-lg border text-sm font-medium ${
                  page >= totalPages
                    ? "border-gray-200 text-gray-400 cursor-not-allowed"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
                aria-disabled={page >= totalPages}
              >
                Selanjutnya
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}