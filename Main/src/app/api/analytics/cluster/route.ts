export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// ---------- K-MEANS LOADER + FALLBACK ----------

type KMeansFn = (data: number[][], k: number) => {
  clusters: number[];
  centroids: number[][];
};

// Fallback: implementasi k-means sederhana (random init, max 100 iter)
const simpleKMeans: KMeansFn = (data, k) => {
  const n = data.length;
  const d = data[0]?.length ?? 0;
  if (n === 0 || d === 0) return { clusters: [], centroids: [] };

  // pilih centroid awal secara acak (tanpa duplikat)
  const used = new Set<number>();
  const centroids: number[][] = [];
  while (centroids.length < k) {
    const idx = Math.floor(Math.random() * n);
    if (!used.has(idx)) {
      centroids.push([...data[idx]]);
      used.add(idx);
    }
  }

  const clusters = new Array<number>(n).fill(-1);

  const dist2 = (a: number[], b: number[]) => {
    let s = 0;
    for (let i = 0; i < a.length; i++) {
      const d = a[i] - b[i];
      s += d * d;
    }
    return s;
  };

  for (let iter = 0; iter < 100; iter++) {
    let changed = false;

    // assignment
    for (let i = 0; i < n; i++) {
      let best = 0;
      let bestDist = Infinity;
      for (let c = 0; c < k; c++) {
        const dd = dist2(data[i], centroids[c]);
        if (dd < bestDist) {
          bestDist = dd;
          best = c;
        }
      }
      if (clusters[i] !== best) {
        clusters[i] = best;
        changed = true;
      }
    }

    // update centroid
    const sums = Array.from({ length: k }, () => Array(d).fill(0));
    const counts = Array(k).fill(0);
    for (let i = 0; i < n; i++) {
      const c = clusters[i];
      counts[c]++;
      for (let j = 0; j < d; j++) sums[c][j] += data[i][j];
    }
    for (let c = 0; c < k; c++) {
      if (counts[c] === 0) {
        // re-init centroid kosong
        const idx = Math.floor(Math.random() * n);
        centroids[c] = [...data[idx]];
      } else {
        for (let j = 0; j < d; j++) centroids[c][j] = sums[c][j] / counts[c];
      }
    }

    if (!changed) break;
  }

  return { clusters, centroids };
};

// Loader yang mencoba semua pola export (ESM/CJS); jika gagal -> fallback
async function getKMeans(): Promise<KMeansFn> {
  try {
    const mod: any = await import("ml-kmeans");
    const fn =
      (typeof mod === "function" && mod) ||
      (typeof mod?.default === "function" && mod.default) ||
      (typeof mod?.kmeans === "function" && mod.kmeans) ||
      (typeof mod?.default?.kmeans === "function" && mod.default.kmeans);
    if (fn) return fn as KMeansFn;
  } catch {
    // ignore
  }
  try {
    const { createRequire } = await import("module");
    const req = createRequire(import.meta.url);
    const mod: any = req("ml-kmeans");
    const fn =
      (typeof mod === "function" && mod) ||
      (typeof mod?.default === "function" && mod.default) ||
      (typeof mod?.kmeans === "function" && mod.kmeans) ||
      (typeof mod?.default?.kmeans === "function" && mod.default.kmeans);
    if (fn) return fn as KMeansFn;
  } catch {
    // ignore
  }
  // terakhir: fallback internal
  return simpleKMeans;
}

// ---------- UTIL & HANDLER ----------

function daysBetween(a: Date, b: Date) {
  return Math.abs(+a - +b) / 86_400_000;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedK = Number(searchParams.get("k") ?? 3);

    const kmeans = await getKMeans(); // ← selalu mengembalikan fungsi (paket atau fallback)

    const vehicles = await prisma.vehicle.findMany({
      include: {
        services: {
          include: { items: true, parts: true },
          orderBy: { date: "asc" },
        },
      },
    });

    const vectors: number[][] = [];
    const ids: number[] = [];

    for (const v of vehicles) {
      const visits = v.services.length;

      const costs = v.services.map(
        (s) =>
          s.items.reduce((a, i) => a + i.price, 0) +
          s.parts.reduce((a, p) => a + p.qty * p.unitPrice, 0)
      );
      const avgCost = costs.length ? costs.reduce((a, b) => a + b, 0) / costs.length : 0;

      const gaps: number[] = [];
      for (let i = 1; i < v.services.length; i++) {
        gaps.push(daysBetween(v.services[i].date, v.services[i - 1].date));
      }
      const avgGap = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;

      vectors.push([visits, avgCost, avgGap]);
      ids.push(v.id);
    }

    if (vectors.length === 0) {
      return NextResponse.json({ k: 0, centroids: [], result: [] });
    }

    const k = Math.max(1, Math.min(Number.isFinite(requestedK) ? Math.floor(requestedK) : 3, vectors.length));

    const { clusters, centroids } = kmeans(vectors, k);
    const result = ids.map((id, i) => ({ vehicleId: id, cluster: clusters[i] }));

    return NextResponse.json({ k, centroids, result });
  } catch (e) {
    console.error("Cluster error:", e);
    const msg = e instanceof Error ? e.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
