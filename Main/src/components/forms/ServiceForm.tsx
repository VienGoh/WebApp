"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export type Opt = { id: number; label: string; price?: number };

type Initial = {
  vehicleId?: number;
  mechanicId?: number;
  date?: string; // "YYYY-MM-DD"
  odometer?: number;
  notes?: string;
  items?: { name: string; price: number }[];
  parts?: { partId: number; qty: number; unitPrice: number }[];
};

export default function ServiceForm({
  vehicles,
  mechanics,
  parts,
  mode = "create",
  serviceId,
  initialValues,
}: {
  vehicles: Opt[];
  mechanics: Opt[];
  parts: Opt[];
  mode?: "create" | "edit";
  serviceId?: number;
  initialValues?: Initial;
}) {
  const router = useRouter();

  // controlled state
  const [vehicleId, setVehicleId] = useState<number | "">("");
  const [mechanicId, setMechanicId] = useState<number | "">("");
  const [mechanicName, setMechanicName] = useState("");
  const [date, setDate] = useState("");
  const [odometer, setOdometer] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<{ name: string; price: number }[]>([]);
  const [usedParts, setUsedParts] = useState<
    { partId: number; qty: number; unitPrice: number }[]
  >([]);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | undefined>();

  useEffect(() => {
    if (!initialValues) {
      setVehicleId("");
      setMechanicId("");
      setMechanicName("");
      setDate("");
      setOdometer("");
      setNotes("");
      setItems([]);
      setUsedParts([]);
      return;
    }
    setVehicleId(initialValues.vehicleId ?? "");
    setMechanicId(initialValues.mechanicId ?? "");
    setMechanicName("");
    setDate(initialValues.date ?? "");
    setOdometer(initialValues.odometer != null ? String(initialValues.odometer) : "");
    setNotes(initialValues.notes ?? "");
    setItems(initialValues.items ?? []);
    setUsedParts(initialValues.parts ?? []);
  }, [initialValues]);

  const addItem = () => setItems((prev) => [...prev, { name: "", price: 0 }]);
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const addPart = () => {
    const def = parts[0];
    setUsedParts((prev) => [
      ...prev,
      { partId: def?.id ?? 0, qty: 1, unitPrice: def?.price ?? 0 },
    ]);
  };
  const removePart = (idx: number) =>
    setUsedParts((prev) => prev.filter((_, i) => i !== idx));

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(undefined);
    setLoading(true);

    const payload: any = {
      vehicleId: vehicleId === "" ? undefined : Number(vehicleId),
      mechanicId: mechanicId === "" ? undefined : Number(mechanicId),
      mechanicName: mechanicName || undefined,
      date: date || undefined,
      odometer: odometer !== "" ? Number(odometer) : undefined,
      notes: notes || undefined,
      items: items.map((x) => ({ name: x.name, price: Number(x.price) || 0 })),
      parts: usedParts.map((p) => ({
        partId: Number(p.partId),
        qty: Number(p.qty) || 0,
        unitPrice: Number(p.unitPrice) || 0,
      })),
    };

    const url = mode === "edit" ? `/api/services/${serviceId}` : "/api/services";
    const method = mode === "edit" ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);
    if (!res.ok) {
      setMsg("Gagal menyimpan");
      return;
    }

    // Redirect pasti kembali ke list
    router.replace("/services?saved=1");
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
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">-- Pilih --</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.label}</option>
            ))}
          </select>
        </div>

        <div className="grid gap-1.5">
          <label className="text-sm text-slate-600">Mekanik (opsional)</label>
          <div className="grid gap-2 md:grid-cols-2">
            <select
              name="mechanicId"
              className="border border-slate-200"
              value={mechanicId}
              onChange={(e) => setMechanicId(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">-- Pilih --</option>
              {mechanics.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
            <input
              name="mechanicName"
              placeholder="atau ketik nama baru"
              className="border border-slate-200"
              value={mechanicName}
              onChange={(e) => setMechanicName(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="grid gap-1.5">
          <label className="text-sm text-slate-600">Tanggal</label>
          <input
            type="date"
            name="date"
            className="border border-slate-200"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <label className="text-sm text-slate-600">Odometer</label>
          <input
            type="number"
            name="odometer"
            className="border border-slate-200"
            value={odometer}
            onChange={(e) => setOdometer(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <label className="text-sm text-slate-600">Catatan</label>
          <input
            name="notes"
            className="border border-slate-200"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
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
              <input
                placeholder="Nama pekerjaan"
                className="border border-slate-200"
                value={it.name}
                onChange={(e) => { const x=[...items]; x[idx].name=e.target.value; setItems(x); }}
              />
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Harga"
                  className="border border-slate-200"
                  value={it.price}
                  onChange={(e) => { const x=[...items]; x[idx].price=Number(e.target.value); setItems(x); }}
                />
                <button type="button" onClick={() => removeItem(idx)} className="rounded-md border px-2 text-sm hover:bg-red-50">Hapus</button>
              </div>
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
                className="border border-slate-200"
                value={p.partId}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  const master = parts.find((x) => x.id === id);
                  const x = [...usedParts];
                  x[idx].partId = id;
                  if (master?.price != null) x[idx].unitPrice = master.price!;
                  setUsedParts(x);
                }}
              >
                {parts.map((part) => (
                  <option key={part.id} value={part.id}>{part.label}</option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                className="border border-slate-200"
                value={p.qty}
                onChange={(e) => { const x=[...usedParts]; x[idx].qty=Number(e.target.value); setUsedParts(x); }}
              />
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <input
                  type="number"
                  step="0.01"
                  className="border border-slate-200"
                  value={p.unitPrice}
                  onChange={(e) => { const x=[...usedParts]; x[idx].unitPrice=Number(e.target.value); setUsedParts(x); }}
                />
                <button type="button" onClick={() => removePart(idx)} className="rounded-md border px-2 text-sm hover:bg-red-50">Hapus</button>
              </div>
            </div>
          ))}
          {!usedParts.length && <p className="text-sm text-slate-500">Belum ada sparepart.</p>}
        </div>
      </div>

      {msg && <p className="text-sm text-slate-600">{msg}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-blue-50 hover:border-blue-300 transition disabled:opacity-60"
      >
        {loading ? "Menyimpan…" : mode === "edit" ? "Simpan Perubahan" : "Simpan Servis"}
      </button>
    </form>
  );
}
