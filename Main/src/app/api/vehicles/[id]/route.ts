export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const Id = z.coerce.number().int().positive();
const Body = z.object({
  customerId: z.coerce.number().int().positive().optional(),
  plate: z.string().min(1).optional(),
  brand: z.string().min(1).optional(),
  model: z.string().optional(),
  year: z.coerce.number().int().optional(),
});

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const id = Id.parse(params.id);
  const row = await prisma.vehicle.findUnique({ where: { id }, include: { customer: true } });
  if (!row) return NextResponse.json({ error: "Not Found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Id.parse(params.id);
    const data = Body.parse(await req.json());
    const updated = await prisma.vehicle.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const id = Id.parse(params.id);
    await prisma.vehicle.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }
}
