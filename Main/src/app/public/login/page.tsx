"use client";
import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const qp = useSearchParams();
  const callbackUrl = qp.get("callbackUrl") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null); setLoading(true);
    const res = await signIn("credentials", { redirect: false, email, password, callbackUrl });
    setLoading(false);
    if (res?.error) setErr("Email atau password salah.");
    else router.push(callbackUrl);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white rounded-2xl shadow p-6 space-y-4">
        <h1 className="text-xl font-semibold">Masuk</h1>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <label className="block">
          <span className="text-sm">Email</span>
          <input className="mt-1 w-full rounded-xl border p-2" type="email" required
                 value={email} onChange={(e)=>setEmail(e.target.value)} />
        </label>
        <label className="block">
          <span className="text-sm">Password</span>
          <input className="mt-1 w-full rounded-xl border p-2" type="password" required
                 value={password} onChange={(e)=>setPassword(e.target.value)} />
        </label>
        <button className="w-full rounded-xl bg-slate-900 text-white py-2 disabled:opacity-60" disabled={loading}>
          {loading ? "Masuk..." : "Masuk"}
        </button>
      </form>
    </div>
  );
}
