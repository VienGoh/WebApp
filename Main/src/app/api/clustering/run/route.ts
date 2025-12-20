// app/api/clustering/run/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Simple K-Means implementation
function kMeansClustering(data: number[][], k: number, maxIterations: number = 100) {
  // Initialize centroids using K-Means++
  let centroids = initializeCentroids(data, k);
  let clusters: number[] = new Array(data.length).fill(-1);
  let iterations = 0;
  let changed = true;
  
  while (changed && iterations < maxIterations) {
    changed = false;
    
    // Assign points to nearest centroid
    for (let i = 0; i < data.length; i++) {
      const point = data[i];
      let minDist = Infinity;
      let newCluster = -1;
      
      for (let j = 0; j < centroids.length; j++) {
        const dist = euclideanDistance(point, centroids[j]);
        if (dist < minDist) {
          minDist = dist;
          newCluster = j;
        }
      }
      
      if (clusters[i] !== newCluster) {
        clusters[i] = newCluster;
        changed = true;
      }
    }
    
    // Recalculate centroids
    const newCentroids = new Array(k).fill(null).map(() => 
      new Array(data[0].length).fill(0)
    );
    const counts = new Array(k).fill(0);
    
    for (let i = 0; i < data.length; i++) {
      const cluster = clusters[i];
      counts[cluster]++;
      for (let j = 0; j < data[i].length; j++) {
        newCentroids[cluster][j] += data[i][j];
      }
    }
    
    for (let i = 0; i < k; i++) {
      if (counts[i] > 0) {
        for (let j = 0; j < newCentroids[i].length; j++) {
          newCentroids[i][j] /= counts[i];
        }
      }
      centroids[i] = newCentroids[i];
    }
    
    iterations++;
  }
  
  // Calculate SSE
  let sse = 0;
  for (let i = 0; i < data.length; i++) {
    const cluster = clusters[i];
    sse += Math.pow(euclideanDistance(data[i], centroids[cluster]), 2);
  }
  
  return { clusters, centroids, sse, iterations };
}

function initializeCentroids(data: number[][], k: number): number[][] {
  const centroids: number[][] = [];
  const firstIndex = Math.floor(Math.random() * data.length);
  centroids.push([...data[firstIndex]]);
  
  for (let i = 1; i < k; i++) {
    const distances = data.map(point => {
      const minDist = centroids.reduce((min, centroid) => {
        const dist = euclideanDistance(point, centroid);
        return Math.min(min, dist);
      }, Infinity);
      return Math.pow(minDist, 2);
    });
    
    const sum = distances.reduce((a, b) => a + b, 0);
    let rand = Math.random() * sum;
    let index = 0;
    
    while (rand > distances[index] && index < data.length - 1) {
      rand -= distances[index];
      index++;
    }
    
    centroids.push([...data[index]]);
  }
  
  return centroids;
}

function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += Math.pow(a[i] - b[i], 2);
  }
  return Math.sqrt(sum);
}

function normalizeData(data: number[][]): number[][] {
  if (data.length === 0) return data;
  
  const normalized = [];
  const nFeatures = data[0].length;
  
  for (let j = 0; j < nFeatures; j++) {
    const column = data.map(row => row[j]);
    const min = Math.min(...column);
    const max = Math.max(...column);
    const range = max - min;
    
    if (range === 0) {
      for (let i = 0; i < data.length; i++) {
        if (!normalized[i]) normalized[i] = [];
        normalized[i][j] = 0.5;
      }
    } else {
      for (let i = 0; i < data.length; i++) {
        if (!normalized[i]) normalized[i] = [];
        normalized[i][j] = (data[i][j] - min) / range;
      }
    }
  }
  
  return normalized;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { k, features, vehicleIds } = body;
    
    // Validate input
    if (!k || !features || !vehicleIds) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }
    
    // Fetch vehicle data
    const vehicles = await prisma.vehicle.findMany({
      where: { id: { in: vehicleIds } },
      include: {
        services: {
          include: {
            items: true,
            parts: {
              include: { part: true }
            }
          }
        }
      }
    });
    
    // Prepare data matrix
    const dataMatrix = vehicles.map(vehicle => {
      const serviceCount = vehicle.services.length;
      const totalSpent = vehicle.services.reduce((sum, service) => {
        const itemsTotal = service.items.reduce((s, item) => s + item.price, 0);
        const partsTotal = service.parts.reduce((s, part) => s + (part.qty * part.unitPrice), 0);
        return sum + itemsTotal + partsTotal;
      }, 0);
      const avgServiceCost = serviceCount > 0 ? totalSpent / serviceCount : 0;
      
      // Calculate days since last service
      const lastService = vehicle.services[0]?.date;
      const daysSinceLastService = lastService 
        ? Math.floor((new Date().getTime() - new Date(lastService).getTime()) / (1000 * 60 * 60 * 24))
        : 365;
      
      // Vehicle age (if year is available)
      const currentYear = new Date().getFullYear();
      const vehicleAge = vehicle.year ? currentYear - vehicle.year : 5;
      
      // Map features to values
      const featureMap: Record<string, number> = {
        serviceCount,
        totalSpent,
        avgServiceCost,
        daysSinceLastService,
        vehicleAge,
      };
      
      return features.map(feature => featureMap[feature] || 0);
    });
    
    // Normalize data
    const normalizedData = normalizeData(dataMatrix);
    
    // Run K-Means clustering
    const result = kMeansClustering(normalizedData, k);
    
    // Format response
    const response = {
      k,
      sse: result.sse,
      clusters: Array.from({ length: k }, (_, clusterIdx) => {
        const vehiclesInCluster = vehicles.filter((_, idx) => result.clusters[idx] === clusterIdx);
        
        return {
          id: clusterIdx,
          centroid: result.centroids[clusterIdx] 
            ? { 
                c1: result.centroids[clusterIdx][0] || 0,
                c2: result.centroids[clusterIdx][1] || 0,
                c3: result.centroids[clusterIdx][2] || 0,
              }
            : undefined,
          vehicles: vehiclesInCluster.map(v => ({
            id: v.id,
            plate: v.plate,
            customerName: "Customer", // You might want to include customer name
            serviceCount: v.services.length,
          })),
          stats: {
            count: vehiclesInCluster.length,
            avgServices: vehiclesInCluster.length > 0 
              ? vehiclesInCluster.reduce((sum, v) => sum + v.services.length, 0) / vehiclesInCluster.length
              : 0,
          }
        };
      }),
      iterations: result.iterations,
    };
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error("Clustering API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}