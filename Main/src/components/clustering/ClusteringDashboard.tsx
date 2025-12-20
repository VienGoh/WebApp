"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import KMeansForm from "./KMeansForms";
import ClusterResults from "./ClusteringResult";
import ClusterVisualization from "./ClusteringVisualization";

interface VehicleData {
  id: number;
  plate: string;
  brand: string;
  model: string;
  year: number;
  customerName: string;
  serviceCount: number;
  totalSpent: number;
  avgServiceCost: number;
  daysSinceLastService: number;
  currentCluster?: number;
}

interface ClusterRun {
  id: number;
  k: number;
  sse: number;
  createdAt: Date;
  assigns?: Array<{
    vehicleId: number;
    idx: number;
    vehicle: {
      plate: string;
      customer: { name: string };
      services: Array<any>;
    };
  }>;
  centroids?: Array<{
    idx: number;
    c1: number;
    c2: number;
    c3: number;
  }>;
}

interface ClusteringDashboardProps {
  vehicleData: VehicleData[];
  latestClusterRun?: ClusterRun | null;
}

export default function ClusteringDashboard({ 
  vehicleData, 
  latestClusterRun 
}: ClusteringDashboardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [selectedK, setSelectedK] = useState(3);
  const [activeTab, setActiveTab] = useState<"form" | "results" | "visualization">("form");

  // Inisialisasi dengan hasil terbaru
  useEffect(() => {
    if (latestClusterRun) {
      setResults({
        k: latestClusterRun.k,
        sse: latestClusterRun.sse,
        clusters: Array.from({ length: latestClusterRun.k }, (_, clusterIdx) => {
          const vehiclesInCluster = latestClusterRun.assigns?.filter(a => a.idx === clusterIdx) || [];
          return {
            id: clusterIdx,
            centroid: latestClusterRun.centroids?.find(c => c.idx === clusterIdx),
            vehicles: vehiclesInCluster.map(a => ({
              id: a.vehicleId,
              plate: a.vehicle.plate,
              customerName: a.vehicle.customer.name,
              serviceCount: a.vehicle.services.length
            })),
            stats: {
              count: vehiclesInCluster.length,
              avgServices: vehiclesInCluster.length > 0 
                ? vehiclesInCluster.reduce((sum, a) => sum + a.vehicle.services.length, 0) / vehiclesInCluster.length
                : 0
            }
          };
        })
      });
      setSelectedK(latestClusterRun.k);
      setActiveTab("results");
    }
  }, [latestClusterRun]);

  const handleRunClustering = async (k: number, features: string[]) => {
    if (vehicleData.length < k) {
      toast.error("Jumlah data kurang dari jumlah cluster");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/clustering/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          k,
          features,
          vehicleIds: vehicleData.map(v => v.id)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal menjalankan clustering");
      }

      setResults(data);
      setSelectedK(k);
      setActiveTab("results");
      toast.success("Clustering berhasil dijalankan!");
      
      // Refresh halaman untuk update data
      setTimeout(() => router.refresh(), 1000);
      
    } catch (error: any) {
      console.error("Clustering error:", error);
      toast.error(error.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveResults = async () => {
    if (!results) return;
    
    try {
      const response = await fetch("/api/clustering/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(results)
      });

      if (response.ok) {
        toast.success("Hasil clustering disimpan!");
        router.refresh();
      }
    } catch (error) {
      toast.error("Gagal menyimpan hasil");
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("form")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "form"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Parameter Clustering
          </button>
          <button
            onClick={() => setActiveTab("results")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "results"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
            disabled={!results}
          >
            Hasil Clustering
          </button>
          <button
            onClick={() => setActiveTab("visualization")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "visualization"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
            disabled={!results}
          >
            Visualisasi
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="mt-4">
        {activeTab === "form" && (
          <KMeansForm
            vehicleCount={vehicleData.length}
            defaultK={selectedK}
            onRunClustering={handleRunClustering}
            loading={loading}
          />
        )}

        {activeTab === "results" && results && (
          <ClusterResults
            results={results}
            onSaveResults={handleSaveResults}
          />
        )}

        {activeTab === "visualization" && results && (
          <ClusterVisualization
            results={results}
            vehicleData={vehicleData}
          />
        )}
      </div>

      {/* Informasi untuk Skripsi */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg border">
        <h3 className="font-medium text-gray-700 mb-2">📊 Informasi untuk Dokumentasi Skripsi</h3>
        <div className="grid gap-4 text-sm text-gray-600 md:grid-cols-2">
          <div>
            <p className="font-medium mb-1">Algoritma yang digunakan:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>K-Means Clustering</li>
              <li>Inisialisasi centroid: K-Means++</li>
              <li>Max iterations: 100</li>
              <li>Distance metric: Euclidean</li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-1">Fitur yang dapat dianalisis:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Frekuensi servis (jumlah kunjungan)</li>
              <li>Total pengeluaran servis</li>
              <li>Rata-rata biaya per servis</li>
              <li>Jarak waktu sejak servis terakhir</li>
              <li>Jenis kendaraan (konversi kategorikal)</li>
            </ul>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          <strong>Catatan untuk bab implementasi:</strong> Halaman ini mengimplementasikan tujuan penelitian 
          poin 4 dan 5 yaitu clustering dan visualisasi data untuk mendukung pengambilan keputusan.
        </p>
      </div>
    </div>
  );
}