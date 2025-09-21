export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET() {
  const data = await prisma.part.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(data);
}

const Body = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  price: z.coerce.number().nonnegative(),
});

export async function POST(req: Request) {
  try {
    const body = Body.parse(await req.json());
    const created = await prisma.part.create({ data: body });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }
}
