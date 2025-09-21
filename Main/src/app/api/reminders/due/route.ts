export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function daysBetween(a: Date, b: Date) {
  return Math.floor(Math.abs(+a - +b) / 86_400_000);
}

/** GET /api/reminders/due?days=180&within=30
 *  - days   : interval servis (default 180 hari atau Vehicle.serviceIntervalDays bila ada)
 *  - within : ambang "segera jatuh tempo" (default 30 hari)
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const defaultDays = Number(searchParams.get("days") ?? 0) || undefined;
  const within = Number(searchParams.get("within") ?? 30);

  const vehicles = await prisma.vehicle.findMany({
    include: {
      customer: true,
      services: { orderBy: { date: "desc" }, take: 1 },
    },
  });

  const today = new Date();
  const rows = vehicles.map(v => {
    const last = v.services[0]?.date ?? null;
    const interval = defaultDays ?? v.serviceIntervalDays ?? 180;
    const since = last ? daysBetween(today, last) : Infinity;

    let status: "ok" | "soon" | "due" = "ok";
    if (!last || since >= interval) status = "due";
    else if (since >= Math.max(0, interval - within)) status = "soon";

    return {
      vehicleId: v.id,
      plate: v.plate,
      customer: v.customer.name,
      lastServiceDate: last,
      daysSince: isFinite(since) ? since : null,
      intervalDays: interval,
      status,
    };
  });

  const due = rows.filter(r => r.status === "due");
  const soon = rows.filter(r => r.status === "soon");

  return NextResponse.json({ due, soon, count: rows.length });
}
