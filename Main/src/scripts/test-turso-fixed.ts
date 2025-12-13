// src/scripts/test-turso-fixed.ts
console.log('🧪 Testing Turso Database Connection\n')

const dbUrl = process.env.DATABASE_URL || ''
const token = process.env.TURSO_AUTH_TOKEN || ''

console.log('📊 Environment:')
console.log(`   NODE_ENV: ${process.env.NODE_ENV}`)
console.log(`   DATABASE_URL: ${dbUrl}`)
console.log(`   TURSO_AUTH_TOKEN: ${token ? '✅ Present' : '❌ Missing'}`)
console.log(`   Is Turso URL: ${dbUrl.includes('turso.io') ? '✅ Yes' : '❌ No'}`)

if (!dbUrl.includes('turso.io')) {
  console.log('\n⚠️  Not a Turso database URL')
  process.exit(0)
}

if (!token) {
  console.error('\n❌ ERROR: TURSO_AUTH_TOKEN is required')
  process.exit(1)
}

// Test dengan @libsql/client langsung
async function testDirectConnection() {
  try {
    console.log('\n🔄 Connecting to Turso directly...')
    
    const { createClient } = await import('@libsql/client')
    
    const client = createClient({
      url: dbUrl.replace(/"/g, ''), // Remove quotes
      authToken: token.replace(/"/g, '')
    })
    
    console.log('✅ LibSQL client created')
    
    // Test query
    const result = await client.execute('SELECT 1 as test, sqlite_version() as version')
    console.log('✅ Query executed successfully')
    console.log(`   SQLite version: ${result.rows[0].version}`)
    
    // List tables
    const tables = await client.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `)
    
    console.log(`\n📋 Found ${tables.rows.length} tables:`)
    tables.rows.forEach((row: any, i: number) => {
      console.log(`   ${i + 1}. ${row.name}`)
    })
    
    await client.close()
    console.log('\n🎉 SUCCESS: Turso is working correctly!')
    
  } catch (error: any) {
    console.error('\n❌ Connection failed:', error.message)
    
    // Debug info
    console.log('\n🔧 Debug info:')
    console.log(`   URL length: ${dbUrl.length}`)
    console.log(`   Token length: ${token.length}`)
    console.log(`   URL starts with: ${dbUrl.substring(0, 20)}...`)
    
    process.exit(1)
  }
}

testDirectConnection()