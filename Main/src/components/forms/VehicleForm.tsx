"use client";
import { useState, useTransition } from "react";
export type Opt = { id: number; label: string };

export default function VehicleForm({ customers }: { customers: Opt[] }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const res = await fetch("/api/vehicles", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              customerId: Number(fd.get("customerId")),
              plate: String(fd.get("plate")),
              brand: String(fd.get("brand")),
              model: fd.get("model") || undefined,
              year: fd.get("year") ? Number(fd.get("year")) : undefined,
            }),
          });
          if (!res.ok) return setErr("Gagal menyimpan");
          setErr(null); (e.target as HTMLFormElement).reset(); location.reload();
        });
      }}
      className="grid gap-3"
    >
      <div className="grid gap-1.5">
        <label className="text-sm text-slate-600">Pelanggan</label>
        <select name="customerId" required className="border border-slate-200">
          <option value="">-- Pilih --</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </div>

      <div className="grid gap-1.5 md:grid-cols-2">
        <div className="grid gap-1.5">
          <label className="text-sm text-slate-600">No. Polisi</label>
          <input name="plate" required className="border border-slate-200" />
        </div>
        <div className="grid gap-1.5">
          <label className="text-sm text-slate-600">Brand</label>
          <input name="brand" required className="border border-slate-200" />
        </div>
      </div>

      <div className="grid gap-1.5 md:grid-cols-2">
        <div className="grid gap-1.5">
          <label className="text-sm text-slate-600">Model</label>
          <input name="model" className="border border-slate-200" />
        </div>
        <div className="grid gap-1.5">
          <label className="text-sm text-slate-600">Tahun</label>
          <input name="year" type="number" className="border border-slate-200" />
        </div>
      </div>

      {err && <p className="text-sm text-red-600">{err}</p>}
      <button disabled={pending} className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-blue-50 hover:border-blue-300 transition">
        {pending ? "Menyimpan…" : "Tambah Kendaraan"}
      </button>
    </form>
  );
}
