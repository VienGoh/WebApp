"use client";

import { useState } from "react";

interface VehicleData {
  id: number;
  plate: string;
  serviceCount: number;
  totalSpent: number;
  avgServiceCost: number;
  daysSinceLastService: number;
}

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

interface ClusterVisualizationProps {
  results: {
    k: number;
    sse: number;
    clusters: ClusterResult[];
  };
  vehicleData: VehicleData[];
}

export default function ClusterVisualization({ results, vehicleData }: ClusterVisualizationProps) {
  const [xAxis, setXAxis] = useState<string>("serviceCount");
  const [yAxis, setYAxis] = useState<string>("totalSpent");
  const [showCentroids, setShowCentroids] = useState(true);
  const [showLabels, setShowLabels] = useState(false);

  // Warna untuk setiap cluster
  const clusterColors = [
    "#3b82f6", // blue
    "#10b981", // green
    "#8b5cf6", // purple
    "#f59e0b", // amber
    "#ec4899", // pink
  ];

  // Label sumbu
  const axisLabels = {
    serviceCount: "Frekuensi Servis",
    totalSpent: "Total Pengeluaran (Rp)",
    avgServiceCost: "Rata-rata Biaya (Rp)",
    daysSinceLastService: "Hari Sejak Servis",
  };

  // Format nilai untuk tooltip
  const formatValue = (value: number, axis: string) => {
    if (axis === "totalSpent" || axis === "avgServiceCost") {
      return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
    }
    return Math.round(value);
  };

  // Hitung skala untuk visualisasi
  const getScale = (axis: string) => {
    const values = vehicleData.map(v => v[axis as keyof VehicleData] as number);
    const max = Math.max(...values);
    const min = Math.min(...values);
    return { min, max, range: max - min };
  };

  const xScale = getScale(xAxis);
  const yScale = getScale(yAxis);

  // Map vehicle ke cluster
  const vehicleClusterMap = new Map<number, number>();
  results.clusters.forEach((cluster, clusterIndex) => {
    cluster.vehicles.forEach(vehicle => {
      vehicleClusterMap.set(vehicle.id, clusterIndex);
    });
  });

  // Data untuk scatter plot
  const plotData = vehicleData.map(vehicle => {
    const clusterIndex = vehicleClusterMap.get(vehicle.id) ?? 0;
    const xValue = vehicle[xAxis as keyof VehicleData] as number;
    const yValue = vehicle[yAxis as keyof VehicleData] as number;
    
    // Normalisasi ke 0-100 untuk posisi
    const xPos = ((xValue - xScale.min) / xScale.range) * 90 + 5;
    const yPos = 100 - (((yValue - yScale.min) / yScale.range) * 90 + 5);
    
    return {
      id: vehicle.id,
      plate: vehicle.plate,
      clusterIndex,
      xValue,
      yValue,
      xPos,
      yPos,
      color: clusterColors[clusterIndex],
    };
  });

  // Data centroid
  const centroidData = results.clusters.map((cluster, index) => {
    if (!cluster.centroid) return null;
    
    // Mapping centroid ke fitur (simplifikasi)
    const centroidValue = {
      serviceCount: cluster.centroid.c1 * xScale.range + xScale.min,
      totalSpent: cluster.centroid.c2 * yScale.range + yScale.min,
      avgServiceCost: cluster.centroid.c1 * xScale.range + xScale.min,
      daysSinceLastService: cluster.centroid.c2 * yScale.range + yScale.min,
    };
    
    const xPos = ((centroidValue[xAxis as keyof typeof centroidValue] - xScale.min) / xScale.range) * 90 + 5;
    const yPos = 100 - (((centroidValue[yAxis as keyof typeof centroidValue] - yScale.min) / yScale.range) * 90 + 5);
    
    return {
      index,
      xPos,
      yPos,
      color: clusterColors[index],
      label: `C${index}`,
    };
  }).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Kontrol Visualisasi */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sumbu X
            </label>
            <select
              value={xAxis}
              onChange={(e) => setXAxis(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(axisLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sumbu Y
            </label>
            <select
              value={yAxis}
              onChange={(e) => setYAxis(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(axisLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showCentroids"
                checked={showCentroids}
                onChange={(e) => setShowCentroids(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="showCentroids" className="ml-2 text-sm text-gray-700">
                Tampilkan Centroid
              </label>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showLabels"
                checked={showLabels}
                onChange={(e) => setLabels(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="showLabels" className="ml-2 text-sm text-gray-700">
                Tampilkan Label
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Scatter Plot Visualization */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Visualisasi Scatter Plot</h3>
            <p className="text-sm text-gray-500">
              {axisLabels[xAxis]} vs {axisLabels[yAxis]}
            </p>
          </div>
          <div className="text-sm text-gray-500">
            {plotData.length} data points
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-6">
          {results.clusters.map((cluster, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: clusterColors[index] }}
              ></div>
              <span className="text-sm font-medium text-gray-700">
                C{cluster.id}: {getClusterLabel(cluster.id)}
              </span>
              <span className="text-sm text-gray-500">({cluster.stats.count})</span>
            </div>
          ))}
        </div>

        {/* Scatter Plot Container */}
        <div className="relative h-[500px] w-full border border-gray-300 rounded-lg bg-gray-50">
          {/* Y Axis Label */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 -rotate-90 text-sm font-medium text-gray-700">
            {axisLabels[yAxis]}
          </div>
          
          {/* X Axis Label */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-8 text-sm font-medium text-gray-700">
            {axisLabels[xAxis]}
          </div>

          {/* Grid Lines */}
          <div className="absolute inset-0">
            {[0, 25, 50, 75, 100].map((pos) => (
              <div key={`v-${pos}`} className="absolute h-full w-px bg-gray-200" style={{ left: `${pos}%` }}></div>
            ))}
            {[0, 25, 50, 75, 100].map((pos) => (
              <div key={`h-${pos}`} className="absolute w-full h-px bg-gray-200" style={{ top: `${pos}%` }}></div>
            ))}
          </div>

          {/* Data Points */}
          {plotData.map((point) => (
            <div
              key={point.id}
              className="absolute cursor-pointer group"
              style={{
                left: `${point.xPos}%`,
                top: `${point.yPos}%`,
                transform: 'translate(-50%, -50%)',
              }}
              title={`${point.plate}: ${formatValue(point.xValue, xAxis)} × ${formatValue(point.yValue, yAxis)}`}
            >
              <div
                className="h-4 w-4 rounded-full border-2 border-white shadow transition-transform group-hover:scale-125"
                style={{ backgroundColor: point.color }}
              ></div>
              {showLabels && (
                <div className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  {point.plate}
                </div>
              )}
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="rounded-lg bg-gray-900 text-white px-3 py-2 text-xs whitespace-nowrap shadow-lg">
                  <div className="font-bold">{point.plate}</div>
                  <div className="mt-1">
                    <div>{axisLabels[xAxis]}: {formatValue(point.xValue, xAxis)}</div>
                    <div>{axisLabels[yAxis]}: {formatValue(point.yValue, yAxis)}</div>
                  </div>
                  <div className="mt-1 text-gray-300">
                    Cluster: C{point.clusterIndex}
                  </div>
                </div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          ))}

          {/* Centroids */}
          {showCentroids && centroidData.map((centroid) => (
            centroid && (
              <div
                key={centroid.index}
                className="absolute"
                style={{
                  left: `${centroid.xPos}%`,
                  top: `${centroid.yPos}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="relative">
                  <div
                    className="h-8 w-8 rounded-full border-4 border-white shadow-lg animate-pulse"
                    style={{ backgroundColor: centroid.color }}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{centroid.label}</span>
                  </div>
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-bold bg-white px-2 py-1 rounded border shadow-sm">
                    Centroid C{centroid.index}
                  </div>
                </div>
              </div>
            )
          ))}
        </div>

        {/* Axis Info */}
        <div className="grid grid-cols-2 gap-4 mt-6 text-sm">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="font-medium text-gray-700">{axisLabels[xAxis]}</p>
            <p className="text-gray-600">
              Min: {formatValue(xScale.min, xAxis)} | Max: {formatValue(xScale.max, xAxis)}
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="font-medium text-gray-700">{axisLabels[yAxis]}</p>
            <p className="text-gray-600">
              Min: {formatValue(yScale.min, yAxis)} | Max: {formatValue(yScale.max, yAxis)}
            </p>
          </div>
        </div>
      </div>

      {/* Bar Chart Visualization */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Distribusi per Cluster</h3>
        <div className="space-y-6">
          {/* Average Services per Cluster */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="font-medium text-gray-700">Rata-rata Frekuensi Servis per Cluster</p>
              <p className="text-sm text-gray-500">Jumlah servis</p>
            </div>
            <div className="flex items-end gap-2 h-40">
              {results.clusters.map((cluster, index) => {
                const maxValue = Math.max(...results.clusters.map(c => c.stats.avgServices));
                const height = (cluster.stats.avgServices / maxValue) * 100;
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full rounded-t-lg transition-all hover:opacity-90"
                      style={{
                        height: `${height}%`,
                        backgroundColor: clusterColors[index],
                      }}
                    ></div>
                    <div className="mt-2 text-center">
                      <p className="text-sm font-medium text-gray-700">C{cluster.id}</p>
                      <p className="text-xs text-gray-500">{cluster.stats.avgServices.toFixed(1)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Member Count per Cluster */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="font-medium text-gray-700">Jumlah Anggota per Cluster</p>
              <p className="text-sm text-gray-500">Kendaraan</p>
            </div>
            <div className="space-y-3">
              {results.clusters.map((cluster, index) => {
                const total = results.clusters.reduce((sum, c) => sum + c.stats.count, 0);
                const percentage = (cluster.stats.count / total) * 100;
                
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: clusterColors[index] }}
                        ></div>
                        <span className="font-medium">Cluster C{cluster.id}</span>
                      </div>
                      <span className="text-gray-700">{cluster.stats.count} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: clusterColors[index],
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Insight untuk Skripsi */}
      <div className="rounded-lg bg-purple-50 border border-purple-200 p-5">
        <h3 className="font-bold text-purple-800 mb-3">📊 Insight Visualisasi untuk Bab Hasil Skripsi</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="font-medium text-purple-700 mb-2">Analisis Scatter Plot:</p>
            <ul className="list-disc pl-5 space-y-1 text-purple-600">
              <li>Cluster C0: Konsentrasi di kanan atas (servis sering & mahal)</li>
              <li>Cluster C2: Konsentrasi di kiri bawah (jarang servis & murah)</li>
              <li>Cluster C1: Tersebar di tengah (potensial untuk upsell)</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-purple-700 mb-2">Interpretasi Bisnis:</p>
            <ul className="list-disc pl-5 space-y-1 text-purple-600">
              <li>Centroid menunjukkan pusat karakteristik cluster</li>
              <li>Jarak antar cluster menunjukkan perbedaan signifikan</li>
              <li>Outlier mungkin memerlukan penanganan khusus</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-purple-300">
          <p className="text-sm text-purple-500">
            <strong>Catatan untuk dokumentasi:</strong> Visualisasi ini menunjukkan efektivitas 
            algoritma K-Means dalam mengelompokkan data berdasarkan pola yang teridentifikasi.
            Cluster yang terpisah dengan baik menunjukkan segmentasi yang bermakna.
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper function
function getClusterLabel(clusterId: number): string {
  const labels = [
    "High Value",
    "Medium Value",
    "Low Value",
    "At Risk",
    "Special",
  ];
  return labels[clusterId] || `Cluster ${clusterId}`;
}

function setLabels(checked: boolean) {
  // Implementation
}