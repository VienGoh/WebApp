import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function mustAuth(roles: Array<"ADMIN"|"PENELITI">) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !roles.includes(session.user.role as any)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function GET() {
  const denied = await mustAuth(["ADMIN","PENELITI"]);
  if (denied) return denied as any;
  const list = await prisma.customer.findMany({ orderBy: { id: "desc" } });
  return NextResponse.json(list);
}

export async function POST(req: Request) {
  const denied = await mustAuth(["ADMIN"]); // contoh: create khusus ADMIN
  if (denied) return denied as any;
  const body = await req.json();
  const created = await prisma.customer.create({ data: body });
  return NextResponse.json(created, { status: 201 });
}
