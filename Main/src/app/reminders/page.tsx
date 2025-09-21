import Link from "next/link";

export const dynamic = "force-dynamic";

async function load(origin: string) {
  const res = await fetch(`${origin}/api/reminders/due`, { cache: "no-store" });
  return (await res.json()) as {
    due: Array<{ plate: string; customer: string; lastServiceDate: string | null; daysSince: number | null; intervalDays: number; }>;
    soon: Array<{ plate: string; customer: string; lastServiceDate: string | null; daysSince: number | null; intervalDays: number; }>;
  };
}

export default async function Page() {
  // origin aman dipakai untuk fetch internal
  const origin = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const { due, soon } = await load(origin);

  const Table = ({ title, rows, tone }:{ title: string; rows: any[]; tone: "red"|"yellow"}) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm overflow-x-auto">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">Tidak ada.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Plat</th>
              <th>Pelanggan</th>
              <th>Terakhir Servis</th>
              <th className="text-center">Hari Sejak</th>
              <th className="text-center">Interval</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className={tone === "red" ? "bg-red-50" : "bg-yellow-50"}>
                <td>{r.plate}</td>
                <td>{r.customer}</td>
                <td>{r.lastServiceDate ? new Date(r.lastServiceDate).toLocaleDateString("id-ID") : "-"}</td>
                <td className="text-center">{r.daysSince ?? "-"}</td>
                <td className="text-center">{r.intervalDays} hari</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Pengingat Servis Berkala</h1>

      <div className="flex items-center gap-3">
        <Link
          href="/api/reminders/csv"
          className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-blue-50"
        >
          Export CSV
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Table title="Sudah Jatuh Tempo" rows={due} tone="red" />
        <Table title="Segera Jatuh Tempo" rows={soon} tone="yellow" />
      </div>
    </section>
  );
}
