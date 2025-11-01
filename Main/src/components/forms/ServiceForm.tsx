"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
export type Opt = { id: number; label: string; price?: number };

type Defaults = {
  vehicleId?: number;
  mechanicId?: number | null;
  date?: string;
  odometer?: number | null;
  notes?: string | null;
  items?: { jobName: string; price: number }[];
  parts?: { partId: number; qty: number; unitPrice: number }[];
};

type ServiceFormProps = {
  vehicles: Opt[];
  mechanics: Opt[];
  parts: Opt[];
  action?: "create" | "edit";
  serviceId?: number;
  defaults?: Defaults;
};

export default function ServiceForm({
  vehicles,
  mechanics,
  parts,
  action = "create",
  serviceId,
  defaults,
}: ServiceFormProps) {
  const router = useRouter();
  const [items, setItems] = useState<{ jobName: string; price: number }[]>(defaults?.items ?? []);
  const [usedParts, setUsedParts] = useState<{ partId: number; qty: number; unitPrice: number }[]>(defaults?.parts ?? []);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | undefined>();
  const [err, setErr] = useState<string | undefined>();

  const addItem = () => setItems([...items, { jobName: "", price: 0 }]);
  const addPart = () =>
    setUsedParts([...usedParts, { partId: parts[0]?.id ?? 0, qty: 1, unitPrice: parts[0]?.price ?? 0 }]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(undefined);
    setErr(undefined);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const rawMechanicName = (fd.get("mechanicName") as string) ?? "";
    const rawNotes = (fd.get("notes") as string) ?? "";
    const payload = {
      vehicleId: Number(fd.get("vehicleId")),
      mechanicId: fd.get("mechanicId") ? Number(fd.get("mechanicId")) : undefined,
      mechanicName: rawMechanicName.trim() ? rawMechanicName.trim() : undefined,
      date: (fd.get("date") as string) || undefined,
      odometer: fd.get("odometer") ? Number(fd.get("odometer")) : undefined,
      notes: rawNotes.trim() ? rawNotes.trim() : null,
      items,
      parts: usedParts,
    };
    const url = action === "edit" && serviceId ? `/api/services/${serviceId}` : "/api/services";
    const method = action === "edit" ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setLoading(false);
    if (!res.ok) {
      try {
        const data = await res.json();
        setErr(data?.error || "Gagal menyimpan");
      } catch {
        setErr("Gagal menyimpan");
      }
      return;
    }

    if (action === "edit") {
      router.push("/services");
      router.refresh();
      return;
    }

    (e.target as HTMLFormElement).reset();
    setItems([]);
    setUsedParts([]);
    setMsg("Tersimpan");
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="grid gap-1.5">
          <label className="text-sm text-slate-600">Kendaraan</label>
          <select
            name="vehicleId"
            required
            className="border border-slate-200"
            defaultValue={defaults?.vehicleId != null ? String(defaults.vehicleId) : ""}
          >
            <option value="">-- Pilih --</option>
            {vehicles.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
          </select>
        </div>
        <div className="grid gap-1.5">
          <label className="text-sm text-slate-600">Mekanik (opsional)</label>
          <div className="grid gap-2 md:grid-cols-2">
            <select
              name="mechanicId"
              className="border border-slate-200"
              defaultValue={defaults?.mechanicId != null ? String(defaults.mechanicId) : ""}
            >
              <option value="">-- Pilih --</option>
              {mechanics.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
            <input name="mechanicName" placeholder="atau ketik nama baru" className="border border-slate-200" />
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="grid gap-1.5">
          <label className="text-sm text-slate-600">Tanggal</label>
          <input type="date" name="date" className="border border-slate-200" defaultValue={defaults?.date ?? ""} />
        </div>
        <div className="grid gap-1.5">
          <label className="text-sm text-slate-600">Odometer</label>
          <input type="number" name="odometer" className="border border-slate-200" defaultValue={defaults?.odometer ?? ""} />
        </div>
        <div className="grid gap-1.5">
          <label className="text-sm text-slate-600">Catatan</label>
          <input name="notes" className="border border-slate-200" defaultValue={defaults?.notes ?? ""} />
        </div>
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

      {err && <p className="text-sm text-red-600">{err}</p>}
      {msg && <p className="text-sm text-slate-600">{msg}</p>}
      <button disabled={loading} className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-blue-50 hover:border-blue-300 transition disabled:opacity-60">
        {loading ? "Menyimpan…" : action === "edit" ? "Update Servis" : "Simpan Servis"}
      </button>
    </form>
  );
}
