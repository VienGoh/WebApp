export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const Id = z.coerce.number().int().positive();
const Item = z.object({ jobName: z.string().min(1), price: z.coerce.number().nonnegative() });
const Part = z.object({ partId: z.coerce.number().int().positive(), qty: z.coerce.number().int().positive(), unitPrice: z.coerce.number().nonnegative() });
const Body = z.object({
  vehicleId: z.coerce.number().int().positive(),
  mechanicId: z.coerce.number().int().positive().optional(),
  mechanicName: z.string().optional(),
  date: z.string().optional(),
  odometer: z.coerce.number().int().optional(),
  notes: z.string().optional().nullable(),
  items: z.array(Item).default([]),
  parts: z.array(Part).default([]),
});

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

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Id.parse(params.id);
    const body = Body.parse(await req.json());

    let mechanicId = body.mechanicId;
    const mechanicName = body.mechanicName?.trim();
    if (!mechanicId && mechanicName) {
      const mechanic = await prisma.mechanic.upsert({
        where: { name: mechanicName },
        update: {},
        create: { name: mechanicName },
      });
      mechanicId = mechanic.id;
    }

    await prisma.$transaction(async tx => {
      await Promise.all([
        tx.serviceItem.deleteMany({ where: { serviceOrderId: id } }),
        tx.servicePart.deleteMany({ where: { serviceOrderId: id } }),
      ]);

      await tx.serviceOrder.update({
        where: { id },
        data: {
          vehicleId: body.vehicleId,
          mechanicId: mechanicId ?? null,
          date: body.date ? new Date(body.date) : undefined,
          odometer: body.odometer,
          ...(body.notes !== undefined ? { notes: body.notes } : {}),
          items: { create: body.items },
          parts: { create: body.parts },
        },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }
}
