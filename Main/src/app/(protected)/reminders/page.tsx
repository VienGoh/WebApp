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
  const origin = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const { due, soon } = await load(origin);

  const Table = ({ title, rows, tone }: { title: string; rows: any[]; tone: "red" | "yellow" }) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm overflow-x-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          tone === "red" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
        }`}>
          {rows.length} kendaraan
        </span>
      </div>
      
      {rows.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-slate-300 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
          </div>
          <p className="text-sm text-slate-500">Tidak ada kendaraan yang {title.toLowerCase()}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Plat</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Pelanggan</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Terakhir Servis</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-slate-700">Hari Sejak</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-slate-700">Interval</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr 
                  key={i} 
                  className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 ${
                    tone === "red" ? "bg-red-50" : "bg-yellow-50"
                  }`}
                >
                  <td className="py-3 px-4">
                    <span className="font-medium text-slate-900">{r.plate}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-slate-700">{r.customer}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-slate-700">
                      {r.lastServiceDate ? new Date(r.lastServiceDate).toLocaleDateString("id-ID") : "-"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      r.daysSince && r.daysSince > 0 
                        ? tone === "red" 
                          ? "bg-red-100 text-red-800" 
                          : "bg-yellow-100 text-yellow-800"
                        : "bg-slate-100 text-slate-800"
                    }`}>
                      {r.daysSince ?? "-"} hari
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {r.intervalDays} hari
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pengingat Servis Berkala</h1>
          <p className="text-slate-600 mt-1">Monitor kendaraan yang sudah atau segera jatuh tempo servis</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link
            href="/api/reminders/csv"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </Link>
          <Link
            href="/api/reminders/send-email"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Kirim Email
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Table title="Sudah Jatuh Tempo" rows={due} tone="red" />
        <Table title="Segera Jatuh Tempo" rows={soon} tone="yellow" />
      </div>
      
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-900">Informasi</h3>
            <p className="text-sm text-slate-600 mt-1">
              • <span className="font-medium">Segera Jatuh Tempo</span>: Servis dalam 7 hari ke depan
              <br/>
              • <span className="font-medium">Sudah Jatuh Tempo</span>: Servis sudah lewat dari jadwal
              <br/>
              • Klik "Kirim Email" untuk mengirim notifikasi ke pelanggan
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}