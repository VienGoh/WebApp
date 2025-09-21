export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const Id = z.object({ id: z.coerce.number().int().positive() });
const Body = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().trim().optional().nullable(),
  email: z.string().trim().email("Email tidak valid").optional().nullable(),
});

function norm(v?: string | null) {
  const s = (v ?? "").trim();
  return s ? s : null;
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { id } = Id.parse(params);
  const data = await prisma.customer.findUnique({
    where: { id },
    select: { id: true, name: true, phone: true, email: true, createdAt: true },
  });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { id } = Id.parse(params);
  const json = await req.json();
  const body = Body.parse(json);

  const updated = await prisma.customer.update({
    where: { id },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.phone !== undefined ? { phone: norm(body.phone) } : {}),
      ...(body.email !== undefined ? { email: norm(body.email) } : {}),
    },
    select: { id: true, name: true, phone: true, email: true, createdAt: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { id } = Id.parse(params);
  await prisma.customer.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
