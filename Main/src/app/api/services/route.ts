export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Schema definitions
const ItemSchema = z.object({ 
  name: z.string().min(1), 
  price: z.coerce.number().nonnegative() 
});

const PartSchema = z.object({ 
  partId: z.coerce.number().int().positive(), 
  qty: z.coerce.number().int().positive(), 
  unitPrice: z.coerce.number().nonnegative() 
});

const CreateServiceOrderSchema = z.object({
  vehicleId: z.coerce.number().int().positive(),
  mechanicId: z.coerce.number().int().positive().optional(),
  mechanicName: z.string().optional(),
  date: z.string().optional(),
  odometer: z.coerce.number().int().optional(),
  notes: z.string().optional(),
  items: z.array(ItemSchema).default([]),
  parts: z.array(PartSchema).default([]),
});

// Helper untuk konsolidasi parts
function consolidateParts(parts: { partId: number; qty: number; unitPrice: number }[]) {
  const map = new Map<number, { qty: number; unitPrice: number }>();
  
  for (const p of parts) {
    const existing = map.get(p.partId);
    if (!existing) {
      map.set(p.partId, { qty: p.qty, unitPrice: p.unitPrice });
    } else {
      map.set(p.partId, { 
        qty: existing.qty + p.qty, 
        unitPrice: p.unitPrice // Menggunakan unitPrice terakhir
      });
    }
  }
  
  return Array.from(map, ([partId, v]) => ({ 
    partId, 
    qty: v.qty, 
    unitPrice: v.unitPrice 
  }));
}

// GET handler
export async function GET(request: NextRequest) {
  try {
    // Jika perlu query parameters
    const searchParams = request.nextUrl.searchParams;
    const vehicleId = searchParams.get('vehicleId');
    const mechanicId = searchParams.get('mechanicId');
    
    const where: any = {};
    
    if (vehicleId) {
      where.vehicleId = parseInt(vehicleId);
    }
    
    if (mechanicId) {
      where.mechanicId = parseInt(mechanicId);
    }
    
    const orders = await prisma.serviceOrder.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        vehicle: { 
          include: { 
            customer: true 
          } 
        },
        mechanic: true,
        items: true,
        parts: { 
          include: { 
            part: true 
          } 
        },
      },
    });

    // Calculate totals
    const ordersWithTotal = orders.map((order: { items: any[]; parts: any[]; }) => ({
      ...order,
      total: (
        order.items.reduce((sum: any, item: { price: any; }) => sum + item.price, 0) +
        order.parts.reduce((sum: number, part: { qty: number; unitPrice: number; }) => sum + (part.qty * part.unitPrice), 0)
      ),
    }));

    return NextResponse.json(ordersWithTotal);
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch service orders" },
      { status: 500 }
    );
  }
}

// POST handler
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = CreateServiceOrderSchema.parse(body);

    let mechanicId = validatedData.mechanicId;
    
    // Handle mechanic creation if only name is provided
    if (!mechanicId && validatedData.mechanicName) {
      const mechanic = await prisma.mechanic.upsert({
        where: { name: validatedData.mechanicName },
        update: {},
        create: { name: validatedData.mechanicName },
      });
      mechanicId = mechanic.id;
    }

    // Create service order
    const serviceOrder = await prisma.serviceOrder.create({
      data: {
        vehicleId: validatedData.vehicleId,
        mechanicId,
        date: validatedData.date ? new Date(validatedData.date) : new Date(),
        odometer: validatedData.odometer,
        notes: validatedData.notes,
        items: { 
          create: validatedData.items 
        },
        parts: { 
          create: consolidateParts(validatedData.parts) 
        },
      },
      include: {
        vehicle: {
          include: {
            customer: true
          }
        },
        mechanic: true,
        items: true,
        parts: {
          include: {
            part: true
          }
        }
      }
    });

    // Calculate total for the response
    const total = (
      serviceOrder.items.reduce((sum: any, item: { price: any; }) => sum + item.price, 0) +
      serviceOrder.parts.reduce((sum: number, part: { qty: number; unitPrice: number; }) => sum + (part.qty * part.unitPrice), 0)
    );

    return NextResponse.json(
      { 
        ...serviceOrder, 
        total 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST Error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: error.errors 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}