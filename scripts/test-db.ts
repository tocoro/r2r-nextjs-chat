#!/usr/bin/env node

import { config } from 'dotenv'
import { resolve } from 'path'
import { Client } from 'pg'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

async function testConnection() {
  const client = new Client({
    connectionString: process.env.POSTGRES_URL
  })

  try {
    console.log('Testing PostgreSQL connection...')
    console.log('Connection string:', process.env.POSTGRES_URL)
    
    await client.connect()
    console.log('✅ Connected to PostgreSQL successfully!')
    
    const result = await client.query('SELECT version()')
    console.log('PostgreSQL version:', result.rows[0].version)
    
  } catch (error) {
    console.error('❌ Connection failed:', error)
  } finally {
    await client.end()
  }
}

testConnection()