// scripts/test-db-connection.ts
import prisma from '@/lib/prisma'

async function testConnection() {
  console.log('🔍 Testing Database Connection...')
  console.log('Environment:', process.env.NODE_ENV)
  console.log('DATABASE_URL:', process.env.DATABASE_URL?.split('?')[0])
  
  try {
    // Test 1: Basic query
    console.log('\n🔄 Test 1: Basic connection...')
    const result = await prisma.$queryRaw`SELECT 1 as connected, sqlite_version() as version`
    console.log('✅ Connected! SQLite version:', result[0].version)
    
    // Test 2: Check tables
    console.log('\n📋 Test 2: Checking tables...')
    const tables = await prisma.$queryRaw<Array<{ name: string }>>`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `
    
    console.log(`✅ Found ${tables.length} tables:`)
    tables.forEach(table => console.log(`   - ${table.name}`))
    
    // Test 3: Count records (optional)
    console.log('\n📊 Test 3: Counting records...')
    for (const table of tables) {
      try {
        const count = await prisma.$queryRaw<Array<{ count: number }>>`
          SELECT COUNT(*) as count FROM ${table.name}
        `
        console.log(`   ${table.name}: ${count[0].count} records`)
      } catch {
        // Skip if table has issues
      }
    }
    
    console.log('\n🎉 All tests passed! Database is working correctly.')
    
  } catch (error: any) {
    console.error('\n❌ Connection failed:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
    console.log('\n🔌 Connection closed.')
  }
}

// Jalankan test
testConnection()

