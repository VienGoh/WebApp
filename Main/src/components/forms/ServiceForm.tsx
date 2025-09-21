"use client";
import { useState } from "react";
export type Opt = { id: number; label: string; price?: number };

export default function ServiceForm({ vehicles, mechanics, parts }: { vehicles: Opt[]; mechanics: Opt[]; parts: Opt[] }) {
  const [items, setItems] = useState<{ jobName: string; price: number }[]>([]);
  const [usedParts, setUsedParts] = useState<{ partId: number; qty: number; unitPrice: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | undefined>();

  const addItem = () => setItems([...items, { jobName: "", price: 0 }]);
  const addPart = () =>
    setUsedParts([...usedParts, { partId: parts[0]?.id ?? 0, qty: 1, unitPrice: parts[0]?.price ?? 0 }]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setMsg(undefined); setLoading(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      vehicleId: Number(fd.get("vehicleId")),
      mechanicId: fd.get("mechanicId") ? Number(fd.get("mechanicId")) : undefined,
      mechanicName: (fd.get("mechanicName") as string) || undefined,
      date: (fd.get("date") as string) || undefined,
      odometer: fd.get("odometer") ? Number(fd.get("odometer")) : undefined,
      notes: (fd.get("notes") as string) || undefined,
      items,
      parts: usedParts,
    };
    const res = await fetch("/api/services", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setLoading(false);
    if (!res.ok) { setMsg("Gagal menyimpan"); return; }
    (e.target as HTMLFormElement).reset(); setItems([]); setUsedParts([]); setMsg("Tersimpan");
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="grid gap-1.5">
          <label className="text-sm text-slate-600">Kendaraan</label>
          <select name="vehicleId" required className="border border-slate-200">
            <option value="">-- Pilih --</option>
            {vehicles.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
          </select>
        </div>
        <div className="grid gap-1.5">
          <label className="text-sm text-slate-600">Mekanik (opsional)</label>
          <div className="grid gap-2 md:grid-cols-2">
            <select name="mechanicId" className="border border-slate-200">
              <option value="">-- Pilih --</option>
              {mechanics.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
            <input name="mechanicName" placeholder="atau ketik nama baru" className="border border-slate-200" />
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="grid gap-1.5"><label className="text-sm text-slate-600">Tanggal</label><input type="date" name="date" className="border border-slate-200" /></div>
        <div className="grid gap-1.5"><label className="text-sm text-slate-600">Odometer</label><input type="number" name="odometer" className="border border-slate-200" /></div>
        <div className="grid gap-1.5"><label className="text-sm text-slate-600">Catatan</label><input name="notes" className="border border-slate-200" /></div>
      </div>

      <div className="rounded-2xl border border-slate-200 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-medium">Pekerjaan</h3>
          <button type="button" onClick={addItem} className="rounded-md border border-slate-200 bg-white px-3 py-1 text-sm hover:bg-blue-50">+ Tambah</button>
        </div>
        <div className="grid gap-2">
          {items.map((it, idx) => (
            <div key={idx} className="grid gap-2 md:grid-cols-2">
              <input placeholder="Nama pekerjaan" value={it.jobName} onChange={e => { const x=[...items]; x[idx].jobName=e.target.value; setItems(x); }} className="border border-slate-200" />
              <input type="number" step="0.01" placeholder="Harga" value={it.price} onChange={e => { const x=[...items]; x[idx].price=Number(e.target.value); setItems(x); }} className="border border-slate-200" />
            </div>
          ))}
          {!items.length && <p className="text-sm text-slate-500">Belum ada pekerjaan.</p>}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-medium">Sparepart</h3>
          <button type="button" onClick={addPart} className="rounded-md border border-slate-200 bg-white px-3 py-1 text-sm hover:bg-blue-50">+ Tambah</button>
        </div>
        <div className="grid gap-2">
          {usedParts.map((p, idx) => (
            <div key={idx} className="grid gap-2 md:grid-cols-3">
              <select
                value={p.partId}
                onChange={e => { const id=Number(e.target.value); const master=parts.find(x=>x.id===id); const x=[...usedParts]; x[idx].partId=id; if(master?.price!=null) x[idx].unitPrice=master.price!; setUsedParts(x); }}
                className="border border-slate-200"
              >
                {parts.map(part => <option key={part.id} value={part.id}>{part.label}</option>)}
              </select>
              <input type="number" min={1} value={p.qty} onChange={e => { const x=[...usedParts]; x[idx].qty=Number(e.target.value); setUsedParts(x); }} className="border border-slate-200" />
              <input type="number" step="0.01" value={p.unitPrice} onChange={e => { const x=[...usedParts]; x[idx].unitPrice=Number(e.target.value); setUsedParts(x); }} className="border border-slate-200" />
            </div>
          ))}
          {!usedParts.length && <p className="text-sm text-slate-500">Belum ada sparepart.</p>}
        </div>
      </div>

      {msg && <p className="text-sm text-slate-600">{msg}</p>}
      <button disabled={loading} className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-blue-50 hover:border-blue-300 transition disabled:opacity-60">
        {loading ? "Menyimpan…" : "Simpan Servis"}
      </button>
    </form>
  );
}
