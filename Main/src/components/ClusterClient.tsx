"use client";

import { useEffect, useRef, useState } from "react";

type ClusterRow = { vehicleId: number; cluster: number };
type ClusterResp = { k: number; centroids: unknown[]; result: ClusterRow[] };

export default function ClusterClient({
  vehicles,
}: {
  vehicles: { id: number; plate: string; customer: { name: string } }[];
}) {
  const [k, setK] = useState(3);
  const [data, setData] = useState<ClusterResp | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function load(nk: number) {
    // batalkan request sebelumnya (kalau ada)
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/analytics/cluster?k=${nk}`, {
        cache: "no-store",
        signal: ac.signal,
      });

      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        const txt = await res.text();
        throw new Error(`Unexpected response (${res.status}): ${txt.slice(0, 200)}`);
      }

      const json = (await res.json()) as ClusterResp;
      if (!res.ok) throw new Error((json as any).error || `HTTP ${res.status}`);

      setData(json);
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        console.error(e);
        setData(null);
        setErr(e?.message || "Gagal memuat data");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(k);
    return () => abortRef.current?.abort();
  }, []); // initial load

  const map = new Map(vehicles.map((v) => [v.id, v]));

  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-3">
        <label className="text-sm text-slate-600">Jumlah cluster (k)</label>
        <input
          type="number"
          min={1}
          max={10}
          value={k}
          onChange={(e) => setK(Math.max(1, Math.min(10, Number(e.target.value))))}
          className="w-24 border border-slate-200"
        />
        <button
          onClick={() => load(k)}
          disabled={loading}
          className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm transition hover:bg-blue-50 disabled:opacity-60"
        >
          {loading ? "Memproses…" : "Proses"}
        </button>
      </div>

      {err && (
        <p className="text-sm text-red-600">
          {err}
        </p>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm overflow-x-auto">
        <h2 className="mb-3 text-lg font-semibold">Hasil Clustering</h2>
        {!data || !data.result.length ? (
          <p className="text-sm text-slate-500">Belum ada data servis.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Plat</th>
                <th>Pemilik</th>
                <th className="text-center">Cluster</th>
              </tr>
            </thead>
            <tbody>
              {data.result.map((r, i) => {
                const v = map.get(r.vehicleId);
                return (
                  <tr key={`${r.vehicleId}-${i}`}>
                    <td>{v?.plate ?? r.vehicleId}</td>
                    <td>{v?.customer.name ?? "-"}</td>
                    <td className="text-center">
                      <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-sm">
                        C{r.cluster}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
