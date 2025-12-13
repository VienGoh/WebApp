// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const dbUrl = process.env.DATABASE_URL || ''
const isTurso = dbUrl.includes('turso.io')
const token = process.env.TURSO_AUTH_TOKEN || ''

console.log('📊 Database Configuration:')
console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`)
console.log(`   Type: ${isTurso ? 'Turso' : 'Local SQLite'}`)
console.log(`   URL: ${dbUrl.split('?')[0]}`)

// Singleton pattern
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let prisma: PrismaClient

if (isTurso && token) {
  // 🔥 KONFIGURASI UNTUK TURSO
  console.log('🔗 Setting up Turso connection...')
  
  try {
    // Dynamic import untuk menghindari build error
    const { PrismaLibSQL } = await import('@prisma/adapter-libsql')
    const { createClient } = await import('@libsql/client/web')
    
    // Buat LibSQL client (gunakan /web untuk edge compatibility)
    const libsql = createClient({
      url: dbUrl,
      authToken: token
    })
    
    // Buat Prisma adapter
    const adapter = new PrismaLibSQL(libsql)
    
    // Buat Prisma client dengan adapter
    prisma = new PrismaClient({
      adapter: adapter,
      log: process.env.NODE_ENV === 'development' 
        ? ['error', 'warn']
        : ['error'],
    })
    
    console.log('✅ Turso adapter initialized')
    
  } catch (error: any) {
    console.error('❌ Failed to initialize Turso adapter:', error.message)
    
    // Fallback: Prisma biasa (mungkin error di production)
    console.log('⚠️  Falling back to standard Prisma client')
    prisma = new PrismaClient({
      log: ['error']
    })
  }
} else if (isTurso && !token) {
  console.error('❌ ERROR: TURSO_AUTH_TOKEN is required for Turso database')
  console.error('   Please set TURSO_AUTH_TOKEN in environment variables')
  
  // Fallback ke local untuk development
  if (process.env.NODE_ENV === 'development') {
    console.log('⚠️  Development fallback: Using local SQLite')
    prisma = new PrismaClient({
      log: ['error', 'warn']
    })
  } else {
    throw new Error('TURSO_AUTH_TOKEN is required for Turso in production')
  }
} else {
  // 🟢 LOCAL SQLITE
  console.log('💾 Using local SQLite database')
  prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn']
      : ['error'],
  })
}

// Simpan di global untuk hot reload (development only)
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma