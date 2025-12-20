"use client";

import Link from "next/link";

interface ServiceTableItem {
  id: number;
  date: string;
  vehicle: string;
  customer: string;
  mechanic: string;
  itemsCount: number;
  partsCount: number;
  total: string;
  status: string;
}

interface ServicesTableProps {
  services: ServiceTableItem[];
}

export default function ServicesTable({ services }: ServicesTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Tanggal
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Kendaraan
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Pelanggan
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Mekanik
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Item
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Total
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {services.map((service) => (
            <tr key={service.id} className="hover:bg-gray-50">
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                {service.date}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                {service.vehicle}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                {service.customer}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {service.mechanic}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                    {service.itemsCount} pekerjaan
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                    {service.partsCount} sparepart
                  </span>
                </div>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                {service.total}
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                  {service.status}
                </span>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/services/${service.id}`}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Lihat
                  </Link>
                  <span className="text-gray-300">|</span>
                  <Link
                    href={`/services/${service.id}/edit`}
                    className="text-amber-600 hover:text-amber-900"
                  >
                    Edit
                  </Link>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={() => {
                      if (confirm("Apakah Anda yakin ingin menghapus servis ini?")) {
                        // Handle delete
                        console.log("Delete service", service.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-900"
                  >
                    Hapus
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}