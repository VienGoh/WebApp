"use client";

import { useState, useEffect, useCallback } from "react";
import CustomerForm, { CustomerFilters } from "@/components/forms/CustomerForm";
import CustomerTable from "@/components/tables/CustomerTable";
import { debounce } from "lodash";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CustomerFilters>({});
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Fetch customers dengan filter
  const fetchCustomers = useCallback(async (filterParams?: CustomerFilters) => {
    setLoading(true);
    try {
      // Build query string dari filters
      const params = new URLSearchParams();
      if (filterParams) {
        Object.entries(filterParams).forEach(([key, value]) => {
          if (value !== undefined && value !== "" && value !== false) {
            params.append(key, value.toString());
          }
        });
      }

      const url = `/api/customers${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(url);
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce filter changes untuk performance
  const debouncedFilterChange = useCallback(
    debounce((newFilters: CustomerFilters) => {
      fetchCustomers(newFilters);
    }, 500),
    [fetchCustomers]
  );

  useEffect(() => {
    fetchCustomers(filters);
  }, []);

  const handleFilterChange = (newFilters: CustomerFilters) => {
    setFilters(newFilters);
    debouncedFilterChange(newFilters);
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    fetchCustomers(filters); // Refresh data
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          <p className="text-slate-600 mt-1">Kelola data pelanggan Anda</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          {showCreateForm ? "Batal" : "Tambah Customer"}
        </button>
      </div>

      {/* Filter Component */}
      <CustomerForm 
        enableFilter={true}
        onFilterChange={handleFilterChange}
        initialFilters={filters}
      />

      {/* Create Form (jika dibuka) */}
      {showCreateForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Tambah Customer Baru</h2>
          <CustomerForm 
            action="create"
            onSuccess={handleCreateSuccess}
          />
        </div>
      )}

      {/* Customer Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-slate-600">Memuat data customers...</p>
          </div>
        ) : (
          <CustomerTable 
            customers={customers}
            onEdit={(customer) => {
              // Handle edit
              router.push(`/customers/${customer.id}/edit`);
            }}
            onDelete={async (customerId) => {
              if (confirm("Apakah Anda yakin ingin menghapus customer ini?")) {
                await fetch(`/api/customers/${customerId}`, {
                  method: "DELETE"
                });
                fetchCustomers(filters); // Refresh data
              }
            }}
          />
        )}
      </div>
    </div>
  );
}