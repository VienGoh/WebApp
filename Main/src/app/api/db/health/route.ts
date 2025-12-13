// app/api/db/health/route.ts
import { checkDatabaseConnection, getDatabaseInfo } from '@/lib/db-utils'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const [connection, info] = await Promise.all([
      checkDatabaseConnection(),
      getDatabaseInfo()
    ])
    
    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      database: info,
      connection: connection
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}