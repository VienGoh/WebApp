export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET() {
  const data = await prisma.vehicle.findMany({
    include: { customer: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(data);
}

const Body = z.object({
  customerId: z.coerce.number().int().positive(),
  plate: z.string().min(1),
  brand: z.string().min(1),
  model: z.string().optional(),
  year: z.coerce.number().int().optional(),
});

export async function POST(req: Request) {
  try {
    const body = Body.parse(await req.json());
    const created = await prisma.vehicle.create({ data: body });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }
}
