"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type CustomerFormProps = {
  action: "create" | "edit";
  id?: number; // wajib kalau edit
  defaults?: { name?: string; phone?: string | null; email?: string | null };
};

export default function CustomerForm({ action, id, defaults }: CustomerFormProps) {
  const router = useRouter();
  const [name, setName]   = useState(defaults?.name ?? "");
  const [phone, setPhone] = useState(defaults?.phone ?? "");
  const [email, setEmail] = useState(defaults?.email ?? "");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr(null);

    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
      };

      const url = action === "create" ? "/api/customers" : `/api/customers/${id}`;
      const method = action === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Gagal menyimpan");

      router.push("/customers");
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 max-w-lg">
      <div>
        <label className="block text-sm text-slate-600">Nama</label>
        <input
          className="w-full rounded-md border border-slate-200 px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block text-sm text-slate-600">Telepon</label>
        <input
          className="w-full rounded-md border border-slate-200 px-3 py-2"
          value={phone ?? ""}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+62..."
        />
      </div>

      <div>
        <label className="block text-sm text-slate-600">Email</label>
        <input
          type="email"
          className="w-full rounded-md border border-slate-200 px-3 py-2"
          value={email ?? ""}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nama@contoh.id"
        />
      </div>

      {err && <p className="text-sm text-red-600">{err}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md border border-slate-200 bg-white px-4 py-2 hover:bg-blue-50"
        >
          {loading ? "Menyimpan..." : "Simpan"}
        </button>
      </div>
    </form>
  );
}
