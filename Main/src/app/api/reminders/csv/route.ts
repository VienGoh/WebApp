export const runtime = "nodejs";

import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const days = url.searchParams.get("days") ?? "180";
  const within = url.searchParams.get("within") ?? "30";

  const res = await fetch(`${url.origin}/api/reminders/due?days=${days}&within=${within}`, { cache: "no-store" });
  const json = await res.json() as { due: any[]; soon: any[] };

  const rows = [
    ...json.due.map(r => ({ ...r, tag: "DUE" })),
    ...json.soon.map(r => ({ ...r, tag: "SOON" })),
  ];

  const header = ["Tag","Plat","Pelanggan","TerakhirServis","HariSejak","IntervalHari","Status"];
  const body = rows.map(r => [
    r.tag, r.plate, r.customer,
    r.lastServiceDate ? new Date(r.lastServiceDate).toISOString().slice(0,10) : "",
    r.daysSince ?? "", r.intervalDays, r.status,
  ].join(",")).join("\n");

  const csv = [header.join(","), body].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="reminders.csv"`,
    },
  });
}
