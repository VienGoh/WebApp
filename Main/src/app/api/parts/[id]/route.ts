export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const Id = z.coerce.number().int().positive();
const Body = z.object({
  sku: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  price: z.coerce.number().nonnegative().optional(),
});

// 🔧 PERBAIKAN: Tambahkan `Promise` pada tipe params
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ← params adalah Promise
) {
  try {
    const { id } = await params; // ← AWAIT params terlebih dahulu
    const parsedId = Id.parse(id);
    
    const row = await prisma.part.findUnique({ where: { id: parsedId } });
    if (!row) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }
    
    return NextResponse.json(row);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ← params adalah Promise
) {
  try {
    const { id } = await params; // ← AWAIT params terlebih dahulu
    const parsedId = Id.parse(id);
    
    const data = Body.parse(await req.json());
    const updated = await prisma.part.update({
      where: { id: parsedId },
      data,
    });
    
    return NextResponse.json(updated);
  } catch (e: any) {
    console.error("PUT Error:", e);
    
    // Handle Prisma errors
    if (e.code === "P2025") {
      return NextResponse.json({ error: "Part not found" }, { status: 404 });
    }
    
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: e.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ← params adalah Promise
) {
  try {
    const { id } = await params; // ← AWAIT params terlebih dahulu
    const parsedId = Id.parse(id);
    
    // Cek apakah part ada sebelum menghapus
    const partExists = await prisma.part.findUnique({
      where: { id: parsedId },
    });
    
    if (!partExists) {
      return NextResponse.json({ error: "Part not found" }, { status: 404 });
    }
    
    // Cek apakah part digunakan di service apa pun
    const usage = await prisma.servicePart.findFirst({
      where: { partId: parsedId },
    });
    
    if (usage) {
      return NextResponse.json(
        { 
          error: "Cannot delete",
          message: "Part is being used in service orders"
        },
        { status: 400 }
      );
    }
    
    await prisma.part.delete({ where: { id: parsedId } });
    
    return NextResponse.json({ 
      success: true,
      message: "Part deleted successfully" 
    });
  } catch (e: any) {
    console.error("DELETE Error:", e);
    
    if (e.code === "P2025") {
      return NextResponse.json({ error: "Part not found" }, { status: 404 });
    }
    
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }
}

// 🔧 OPTIONAL: Tambahkan PATCH method untuk kompatibilitas
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return PUT(req, { params });
}