// src/scripts/test-turso.ts
console.log('🧪 Testing Turso Database Setup\n')

const dbUrl = process.env.DATABASE_URL || ''
const token = process.env.TURSO_AUTH_TOKEN || ''

console.log('📊 Environment Check:')
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`)
console.log(`   DATABASE_URL: ${dbUrl.split('?')[0]}`)
console.log(`   Is Turso: ${dbUrl.includes('turso.io') ? '✅ Yes' : '❌ No'}`)
console.log(`   Has Token: ${token ? '✅ Yes' : '❌ No'}`)

if (!dbUrl.includes('turso.io')) {
  console.log('\n⚠️  Not testing Turso (using local database)')
  console.log('   Run with .env.turso for Turso testing')
  process.exit(0)
}

if (!token) {
  console.error('\n❌ ERROR: TURSO_AUTH_TOKEN is required')
  console.log('   Set TURSO_AUTH_TOKEN in .env.turso')
  process.exit(1)
}

// Test dengan dynamic import untuk Prisma
async function testWithPrisma() {
  try {
    console.log('\n🔄 Loading Prisma with Turso adapter...')
    
    // Import Prisma client dari file yang sudah diupdate
    const { default: prisma } = await import('@/lib/prisma')
    
    console.log('✅ Prisma loaded successfully')
    
    // Test query
    console.log('\n📡 Executing test query...')
    const result = await prisma.$queryRaw`SELECT 1 as test, sqlite_version() as version`
    
    console.log('✅ Query executed successfully!')
    console.log(`   SQLite version: ${result[0].version}`)
    
    // List tables
    console.log('\n📋 Listing database tables...')
    const tables = await prisma.$queryRaw<Array<{ name: string }>>`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `
    
    console.log(`   Found ${tables.length} tables:`)
    tables.forEach((table, i) => {
      console.log(`   ${i + 1}. ${table.name}`)
    })
    
    await prisma.$disconnect()
    console.log('\n🎉 SUCCESS: Turso database is working correctly!')
    
  } catch (error: any) {
    console.error('\n❌ FAILED:', error.message)
    
    // Detailed error info
    if (error.message.includes('adapter')) {
      console.log('\n🔧 Possible solutions:')
      console.log('   1. Install dependencies: npm install @prisma/adapter-libsql @libsql/client')
      console.log('   2. Regenerate Prisma: npx prisma generate')
      console.log('   3. Check token validity')
    }
    
    process.exit(1)
  }
}

// Jalankan test
testWithPrisma()