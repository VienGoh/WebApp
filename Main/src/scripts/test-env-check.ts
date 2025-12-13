// src/scripts/test-env-check.ts
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

console.log('🔍 Environment Debug Script\n')

// Get current directory
const cwd = process.cwd()
console.log('📁 Current Working Directory:', cwd)

// Check parent directories
let currentDir = cwd
for (let i = 0; i < 5; i++) {
  console.log(`   Level ${i}: ${currentDir}`)
  currentDir = path.dirname(currentDir)
}

// Check for .env.turso in multiple locations
const checkPaths = [
  '.env.turso',                           // Same directory
  path.join(cwd, '.env.turso'),          // Absolute path
  path.join(cwd, 'src', '.env.turso'),   // In src folder
  path.join(__dirname, '.env.turso'),    // Script directory
  path.join(__dirname, '..', '.env.turso'), // Parent of scripts
  path.join(__dirname, '..', '..', '.env.turso'), // Root
]

console.log('\n🔎 Checking for .env.turso:')
checkPaths.forEach(checkPath => {
  try {
    const exists = fs.existsSync(checkPath)
    console.log(`   ${exists ? '✅' : '❌'} ${checkPath}`)
    if (exists) {
      const content = fs.readFileSync(checkPath, 'utf8')
      const firstLine = content.split('\n')[0]
      console.log(`      First line: ${firstLine}`)
    }
  } catch (error) {
    console.log(`   ⚠️  ${checkPath} - Error: ${error.message}`)
  }
})

// Check environment variables
console.log('\n📊 Environment Variables:')
const envVars = ['DATABASE_URL', 'TURSO_AUTH_TOKEN', 'NODE_ENV']
envVars.forEach(key => {
  const value = process.env[key]
  console.log(`   ${key}: ${value ? '✅ Set' : '❌ Not set'}`)
  if (value && (key.includes('TOKEN') || key.includes('SECRET'))) {
    console.log(`      (Value hidden for security)`)
  } else if (value) {
    console.log(`      ${value}`)
  }
})

console.log('\n🎯 Solution:')
console.log('1. Create .env.turso in the correct location')
console.log('2. Or update package.json script path')
console.log('3. Or set environment variables manually')