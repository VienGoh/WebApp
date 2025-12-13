// lib/db-utils.ts
import prisma from './prisma'

export async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { 
      connected: true, 
      message: 'Database connected successfully' 
    }
  } catch (error: any) {
    return { 
      connected: false, 
      message: `Database connection failed: ${error.message}` 
    }
  }
}

export async function getDatabaseInfo() {
  const dbUrl = process.env.DATABASE_URL || ''
  return {
    isTurso: dbUrl.includes('turso.io'),
    isLocal: dbUrl.startsWith('file:'),
    hasToken: !!process.env.TURSO_AUTH_TOKEN,
    nodeEnv: process.env.NODE_ENV
  }
}