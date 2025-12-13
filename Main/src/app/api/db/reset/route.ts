    // app/api/db/reset/route.ts - HATI-HATI!
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  // ❗ HANYA untuk development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Reset hanya untuk development' },
      { status: 403 }
    )
  }
  
  try {
    // Reset database (hati-hati!)
    // Sesuaikan dengan model Anda
    await prisma.user.deleteMany()
    // ... delete lainnya
    
    return NextResponse.json({
      message: 'Database reset (development only)',
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}