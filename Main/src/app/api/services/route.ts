export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET() {
  const orders = await prisma.serviceOrder.findMany({
    orderBy: { date: "desc" },
    include: {
      vehicle: { include: { customer: true } },
      mechanic: true,
      items: true,
      parts: { include: { part: true } },
    },
  });

  const withTotal = orders.map(o => ({
    ...o,
    total:
      o.items.reduce((a, i) => a + i.price, 0) +
      o.parts.reduce((a, p) => a + p.qty * p.unitPrice, 0),
  }));
  return NextResponse.json(withTotal);
}

const Item = z.object({ jobName: z.string().min(1), price: z.coerce.number().nonnegative() });
const Part = z.object({ partId: z.coerce.number().int().positive(), qty: z.coerce.number().int().positive(), unitPrice: z.coerce.number().nonnegative() });

const Body = z.object({
  vehicleId: z.coerce.number().int().positive(),
  mechanicId: z.coerce.number().int().positive().optional(),
  mechanicName: z.string().optional(), // alternatif kalau mekanik baru
  date: z.string().optional(),
  odometer: z.coerce.number().int().optional(),
  notes: z.string().optional(),
  items: z.array(Item).default([]),
  parts: z.array(Part).default([]),
});

export async function POST(req: Request) {
  try {
    const body = Body.parse(await req.json());

    // kalau tidak ada mechanicId tapi ada mechanicName → upsert mekanik
    let mechanicId = body.mechanicId;
    if (!mechanicId && body.mechanicName) {
      const m = await prisma.mechanic.upsert({
        where: { name: body.mechanicName },
        update: {},
        create: { name: body.mechanicName },
      });
      mechanicId = m.id;
    }

    const created = await prisma.serviceOrder.create({
      data: {
        vehicleId: body.vehicleId,
        mechanicId,
        date: body.date ? new Date(body.date) : undefined,
        odometer: body.odometer,
        notes: body.notes,
        items: { create: body.items },
        parts: { create: body.parts },
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }
}
