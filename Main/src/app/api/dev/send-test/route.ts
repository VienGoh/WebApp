export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  const to  = url.searchParams.get("to");

  if ((process.env.CRON_SECRET ?? "") !== (key ?? "")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!to) return NextResponse.json({ error: "param ?to= wajib" }, { status: 400 });

  const html = `
    <div style="font-family:system-ui;line-height:1.5">
      <h2 style="margin:0 0 8px">Tes Email BengkelApp</h2>
      <p>Halo, ini pesan uji coba.</p>
      <p>Jika kamu menerima ini, konfigurasi email sudah OK ✅</p>
    </div>`;

  await sendEmail({ to, subject: "Tes Email BengkelApp", html });
  return NextResponse.json({ ok: true });
}
