"use client";
import { useState, useTransition } from "react";

export default function MechanicForm() {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const res = await fetch("/api/mechanics", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: String(fd.get("name")), active: true }),
          });
          if (!res.ok) return setErr("Gagal menyimpan");
          setErr(null); (e.target as HTMLFormElement).reset(); location.reload();
        });
      }}
      className="grid gap-3"
    >
      <div className="grid gap-1.5">
        <label className="text-sm text-slate-600">Nama Mekanik</label>
        <input name="name" required className="border border-slate-200" />
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <button disabled={pending} className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-blue-50 hover:border-blue-300 transition">
        {pending ? "Menyimpan…" : "Tambah Mekanik"}
      </button>
    </form>
  );
}
