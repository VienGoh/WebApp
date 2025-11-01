export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const Item = z.object({ name: z.string().trim().min(1), price: z.coerce.number().min(0) });
const Part = z.object({ partId: z.coerce.number().int().positive(), qty: z.coerce.number().int().positive(), unitPrice: z.coerce.number().min(0) });

const PatchBody = z.object({
  vehicleId: z.coerce.number().int().positive().optional(),
  mechanicId: z.coerce.number().int().positive().optional(),
  mechanicName: z.string().transform(s => s?.trim() || "").optional(),
  date: z.string().trim().optional().transform(s => (s ? new Date(s) : undefined)),
  odometer: z.coerce.number().int().optional(),
  notes: z.string().optional(),
  items: z.array(Item).optional(),
  parts: z.array(Part).optional(),
});

type RouteCtx = { params: { id: string } };

function normalizeParts(parts: { partId:number; qty:number; unitPrice:number }[]) {
  const map = new Map<number, { qty:number; unitPrice:number }>();
  for (const p of parts) {
    const ex = map.get(p.partId);
    if (!ex) map.set(p.partId, { qty: p.qty, unitPrice: p.unitPrice });
    else map.set(p.partId, { qty: ex.qty + p.qty, unitPrice: p.unitPrice });
  }
  return Array.from(map, ([partId, v]) => ({ partId, qty: v.qty, unitPrice: v.unitPrice }));
}

export async function GET(_req: Request, { params }: RouteCtx) {
  const id = Number(params.id);
  if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const o = await prisma.serviceOrder.findUnique({
    where: { id },
    include: {
      vehicle: { include: { customer: true } },
      mechanic: true,
      items: true,
      parts: { include: { part: true } },
    },
  });
  if (!o) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const total =
    o.items.reduce((a, i) => a + i.price, 0) +
    o.parts.reduce((a, p) => a + p.qty * p.unitPrice, 0);

  return NextResponse.json({ ...o, total }, { status: 200 });
}

export async function PATCH(req: Request, { params }: RouteCtx) {
  try {
    const id = Number(params.id);
    if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const parsed = PatchBody.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Bad Request", detail: parsed.error.flatten() }, { status: 400 });
    }
    const body = parsed.data;

    const exists = await prisma.serviceOrder.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let mechanicId = body.mechanicId;
    const mechName = (body.mechanicName ?? "").trim();
    if (!mechanicId && mechName) {
      const m = await prisma.mechanic.upsert({
        where: { name: mechName },
        update: {},
        create: { name: mechName },
      });
      mechanicId = m.id;
    }

    const nested: any = {};
    if (body.items) {
      nested.items = { deleteMany: {}, create: body.items.map(i => ({ name: i.name, price: i.price })) };
    }
    if (body.parts) {
      nested.parts = {
        deleteMany: {},
        create: normalizeParts(body.parts).map(p => ({ partId: p.partId, qty: p.qty, unitPrice: p.unitPrice })),
      };
    }

    const updated = await prisma.serviceOrder.update({
      where: { id },
      data: {
        ...(body.vehicleId ? { vehicleId: body.vehicleId } : {}),
        ...(mechanicId !== undefined ? { mechanicId } : {}),
        ...(body.date ? { date: body.date } : {}),
        ...(body.odometer !== undefined ? { odometer: body.odometer } : {}),
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
        ...nested,
      },
      include: {
        vehicle: { include: { customer: true } },
        mechanic: true,
        items: true,
        parts: { include: { part: true } },
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: RouteCtx) {
  const id = Number(params.id);
  if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  await prisma.serviceItem.deleteMany({ where: { serviceOrderId: id } });
  await prisma.servicePart.deleteMany({ where: { serviceOrderId: id } });

  try {
    await prisma.serviceOrder.delete({ where: { id } });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}
