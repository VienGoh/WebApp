export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const Id = z.coerce.number().int().positive();

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const id = Id.parse(params.id);
  const o = await prisma.serviceOrder.findUnique({
    where: { id },
    include: {
      vehicle: { include: { customer: true } },
      mechanic: true,
      items: true,
      parts: { include: { part: true } },
    },
  });
  if (!o) return NextResponse.json({ error: "Not Found" }, { status: 404 });

  const total =
    o.items.reduce((a, i) => a + i.price, 0) +
    o.parts.reduce((a, p) => a + p.qty * p.unitPrice, 0);

  return NextResponse.json({ ...o, total });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const id = Id.parse(params.id);
    await prisma.serviceOrder.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }
}
