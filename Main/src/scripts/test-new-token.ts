// src/scripts/test-new-token.ts
import { createClient } from '@libsql/client'

const dbUrl = 'libsql://dev-viengoh.aws-ap-northeast-1.turso.io'
// PASTE TOKEN BARU DI SINI
const newToken = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjU2MDc4NjgsImlkIjoiNTIyZTMwZjUtYmRlNC00NmE5LWE5NDQtMWEzMDU5NGQ4NGE1IiwicmlkIjoiYmM1ODJmODAtZDFkZS00ODU3LWIxNzQtZmFmYmY5NjI3OTk3In0.l1xO9NVk0cns5PmiQTwwPtDpvcAa_gtgEBSLtNibmK0jBCOCEBwjGiJS2Rzw16DCC70r6dtzUiBgCR7KyzqeDg'

console.log('🧪 Testing new Turso token\n')
console.log('📊 Configuration:')
console.log(`   Database: dev`)
console.log(`   URL: ${dbUrl}`)
console.log(`   Token: ${newToken.substring(0, 20)}...`)

async function testToken() {
  try {
    const client = createClient({
      url: dbUrl,
      authToken: newToken
    })
    
    console.log('\n🔄 Connecting...')
    const result = await client.execute('SELECT 1 as test, sqlite_version() as version')
    
    console.log('✅ SUCCESS! Token is valid')
    console.log(`   SQLite version: ${result.rows[0].version}`)
    
    // Check tables
    const tables = await client.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name
    `)
    
    console.log(`\n📋 Database has ${tables.rows.length} tables:`)
    tables.rows.forEach((row: any, i: number) => {
      console.log(`   ${i + 1}. ${row.name}`)
    })
    
    await client.close()
    console.log('\n🎉 Token works! Update your .env.turso file.')
    
  } catch (error: any) {
    console.error('\n❌ FAILED:', error.message)
    console.log('\n🔧 Generate new token with: turso db tokens create dev')
  }
}

testToken()