import { prisma } from "@/lib/prisma";

function avg(nums: number[]) { return nums.length ? nums.reduce((a,b)=>a+b,0)/nums.length : 0; }
export const dynamic = "force-dynamic";

export default async function Page() {
  const sessions = await prisma.testSession.findMany({ include: { eucs: true } });
  const total = sessions.length;
  const successRate = total ? (sessions.filter(s=>s.success).length / total) * 100 : 0;
  const avgTime = avg(sessions.map(s=>s.completionTimeSec));
  const avgError = avg(sessions.map(s=>s.errorCount));
  const avgSUS = avg(sessions.map(s=>s.susScore ?? 0));
  const eucs = sessions.map(s=>s.eucs).filter(Boolean) as NonNullable<typeof sessions[number]["eucs"]>[];
  const avgContent = avg(eucs.map(e=>e.content));
  const avgAccuracy = avg(eucs.map(e=>e.accuracy));
  const avgFormat = avg(eucs.map(e=>e.format));
  const avgEase = avg(eucs.map(e=>e.easeOfUse));
  const avgTimeEUCS = avg(eucs.map(e=>e.timeliness));

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Laporan Ringkas</h1>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-600">Success Rate</div>
          <div className="text-2xl font-semibold">{successRate.toFixed(1)}%</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-600">Rata Waktu (detik)</div>
          <div className="text-2xl font-semibold">{avgTime.toFixed(1)}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-600">Rata Error</div>
          <div className="text-2xl font-semibold">{avgError.toFixed(1)}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-600">Rata SUS</div>
          <div className="text-2xl font-semibold">{avgSUS.toFixed(1)}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm overflow-x-auto">
        <h2 className="mb-2 text-lg font-semibold">UECS (1–5)</h2>
        <table>
          <thead>
            <tr>
              <th>Content</th><th>Accuracy</th><th>Format</th><th>Ease of Use</th><th>Timeliness</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{avgContent.toFixed(2)}</td>
              <td>{avgAccuracy.toFixed(2)}</td>
              <td>{avgFormat.toFixed(2)}</td>
              <td>{avgEase.toFixed(2)}</td>
              <td>{avgTimeEUCS.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
