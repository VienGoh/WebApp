"use client";
import { useState, useTransition } from "react";

export default function PartForm() {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const res = await fetch("/api/parts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sku: String(fd.get("sku")),
              name: String(fd.get("name")),
              price: Number(fd.get("price")),
            }),
          });
          if (!res.ok) return setErr("Gagal menyimpan");
          setErr(null); (e.target as HTMLFormElement).reset(); location.reload();
        });
      }}
      className="grid gap-3"
    >
      <div className="grid gap-1.5">
        <label className="text-sm text-slate-600">SKU</label>
        <input name="sku" required className="border border-slate-200" />
      </div>
      <div className="grid gap-1.5">
        <label className="text-sm text-slate-600">Nama</label>
        <input name="name" required className="border border-slate-200" />
      </div>
      <div className="grid gap-1.5">
        <label className="text-sm text-slate-600">Harga</label>
        <input name="price" type="number" step="0.01" required className="border border-slate-200" />
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <button disabled={pending} className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-blue-50 hover:border-blue-300 transition">
        {pending ? "Menyimpan…" : "Tambah Sparepart"}
      </button>
    </form>
  );
}
