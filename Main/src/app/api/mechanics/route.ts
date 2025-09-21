export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET() {
  const data = await prisma.mechanic.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(data);
}

const Body = z.object({ name: z.string().min(1), active: z.boolean().optional() });

export async function POST(req: Request) {
  try {
    const body = Body.parse(await req.json());
    const created = await prisma.mechanic.create({ data: { name: body.name, active: body.active ?? true } });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }
}
