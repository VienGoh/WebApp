"use client";

import { useState, useTransition } from "react";
import { z } from "zod";

const schema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  price: z.preprocess(v => Number(v), z.number().nonnegative()),
});

export default function NewItemForm() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const obj = Object.fromEntries(fd.entries());
    const parse = schema.safeParse(obj);
    if (!parse.success) return setError("Validasi gagal.");

    start(async () => {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parse.data),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        return setError(j?.error ?? "Gagal menyimpan.");
      }
      setError(null);
      (e.target as HTMLFormElement).reset();
      location.reload();
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <div className="grid gap-1.5">
        <label className="text-sm text-slate-600">SKU</label>
        <input name="sku" placeholder="SKU-001" required className="border border-slate-200" />
      </div>
      <div className="grid gap-1.5">
        <label className="text-sm text-slate-600">Nama</label>
        <input name="name" placeholder="Nama item" required className="border border-slate-200" />
      </div>
      <div className="grid gap-1.5">
        <label className="text-sm text-slate-600">Harga</label>
        <input name="price" type="number" step="0.01" placeholder="15000" required className="border border-slate-200" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={pending}
        className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-blue-50 hover:border-blue-300 transition disabled:opacity-60">
        {pending ? "Menyimpan…" : "Tambah Item"}
      </button>
    </form>
  );
}
