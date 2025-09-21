"use client";
import { useState } from "react";

export default function DeleteButton({ url, label = "Hapus" }: { url: string; label?: string }) {
  const [pending, setPending] = useState(false);
  return (
    <button
      disabled={pending}
      onClick={async () => {
        try { setPending(true); await fetch(url, { method: "DELETE" }); location.reload(); }
        finally { setPending(false); }
      }}
      className={[
        "rounded-md border px-3 py-1.5 text-sm transition",
        "border-red-200 bg-red-50 text-red-700",
        "hover:bg-red-100 hover:border-red-300 disabled:opacity-60",
      ].join(" ")}
    >
      {pending ? "Menghapus…" : label}
    </button>
  );
}
