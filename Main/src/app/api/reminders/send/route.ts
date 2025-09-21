export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

const DAY = 86_400_000;
const COOLDOWN_DAYS = Number(process.env.REMINDER_COOLDOWN_DAYS ?? 7);

function daysBetween(a: Date, b: Date) {
  // hasil + = a di masa depan; - = a sudah lewat dibanding b
  return Math.floor((+a - +b) / DAY);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const reqDays = Number(url.searchParams.get("days") ?? 14);
  const range = Number.isFinite(reqDays) ? Math.max(1, reqDays) : 14;

  // Izinkan jika request dari Vercel Cron ATAU manual dengan ?key=<CRON_SECRET>
  const isCron = req.headers.get("x-vercel-cron") === "1";
  const key = url.searchParams.get("key");
  if (!isCron && (process.env.CRON_SECRET ?? "") !== (key ?? "")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Ambil data minimal yang diperlukan
  const vehicles = await prisma.vehicle.findMany({
    select: {
      id: true,
      plate: true,
      brand: true,
      model: true,
      createdAt: true,
      serviceIntervalDays: true,
      // Jika kamu menambahkan kolom ini di Prisma, field akan terisi; kalau tidak ada, aman (undefined)
      // @ts-ignore
      lastReminderEmailAt: true,
      customer: { select: { name: true, email: true } },
      services: { select: { date: true }, orderBy: { date: "desc" }, take: 1 },
    },
  });

  const today = new Date();

  // Hitung jatuh tempo & filter kandidat
  const candidates = vehicles
    .map((v) => {
      const lastDate = v.services[0]?.date ?? v.createdAt;
      const nextDate = new Date(+lastDate + v.serviceIntervalDays * DAY);
      const daysLeft = daysBetween(nextDate, today);
      return { v, lastDate, nextDate, daysLeft };
    })
    .filter((x) => {
      const hasEmail = !!x.v.customer?.email;
      const inWindow = x.daysLeft <= range;
      // cooldown: abaikan jika terakhir kirim < COOLDOWN_DAYS
      // @ts-ignore
      const lastSent: Date | undefined = x.v.lastReminderEmailAt as any;
      const cooledDown = !lastSent || daysBetween(today, lastSent) >= COOLDOWN_DAYS;
      return hasEmail && inWindow && cooledDown;
    });

  const results: Array<{ plate: string; to: string; id?: string; error?: string }> = [];

  for (const { v, nextDate, daysLeft } of candidates) {
    const to = v.customer!.email!;
    const owner = v.customer!.name;
    const dateStr = nextDate.toLocaleDateString("id-ID");
    const subject = `Pengingat Servis • ${v.plate} (${v.brand}${v.model ? " " + v.model : ""})`;
    const html = `
<div style="font-family:system-ui,Segoe UI,Roboto,Arial;line-height:1.6">
  <p>Halo <b>${owner}</b>,</p>
  <p>Ini pengingat servis berkala untuk kendaraan Anda:</p>
  <ul>
    <li>Plat: <b>${v.plate}</b></li>
    <li>Model: ${v.brand}${v.model ? " " + v.model : ""}</li>
    <li>Perkiraan jatuh tempo: <b>${dateStr}</b> (${daysLeft >= 0 ? `dalam ${daysLeft} hari` : `${-daysLeft} hari yang lalu`})</li>
    <li>Interval servis: ${v.serviceIntervalDays} hari</li>
  </ul>
  <p>Silakan melakukan booking atau hubungi bengkel untuk penjadwalan.</p>
  <p>Terima kasih.</p>
</div>`.trim();

    try {
      const res = await sendEmail({ to, subject, html });

      // Opsional: simpan cap waktu kirim (jika kolom ada)
      try {
        // @ts-ignore
        await prisma.vehicle.update({
          where: { id: v.id },
          // @ts-ignore
          data: { lastReminderEmailAt: new Date() },
        });
      } catch {
        // abaikan jika kolom belum ditambahkan di schema
      }

      results.push({ plate: v.plate, to, id: (res as any)?.id });
    } catch (e) {
      results.push({ plate: v.plate, to, error: (e as Error).message });
    }
  }

  return NextResponse.json(
    {
      range,
      checked: vehicles.length,
      candidates: candidates.length,
      sentCount: results.filter((r) => !r.error).length,
      sent: results,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
