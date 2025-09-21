export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const Body = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  phone: z.string().trim().optional().nullable(),
  email: z.string().trim().email("Email tidak valid").optional().nullable(),
});

function norm(v?: string | null) {
  const s = (v ?? "").trim();
  return s ? s : null;
}

export async function GET() {
  const rows = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, phone: true, email: true, createdAt: true },
  });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const json = await req.json();
  const body = Body.parse(json);

  const created = await prisma.customer.create({
    data: {
      name: body.name,
      phone: norm(body.phone),
      email: norm(body.email),
    },
    select: { id: true, name: true, phone: true, email: true, createdAt: true },
  });

  return NextResponse.json(created, { status: 201 });
}
