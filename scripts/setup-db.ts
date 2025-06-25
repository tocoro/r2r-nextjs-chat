#!/usr/bin/env node

/**
 * Database setup script for Vercel Postgres
 * Run this script to initialize your database tables and seed initial data
 * 
 * Usage:
 * npx tsx scripts/setup-db.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { initializeDatabase, seedInitialData } from '../lib/db'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

async function setupDatabase() {
  console.log('🚀 Setting up database...')
  
  try {
    // Initialize tables
    console.log('📋 Creating tables...')
    await initializeDatabase()
    
    // Seed initial data
    console.log('🌱 Seeding initial data...')
    await seedInitialData()
    
    console.log('✅ Database setup completed successfully!')
    console.log('\n📝 Next steps:')
    console.log('1. Set up your Vercel Postgres database')
    console.log('2. Add POSTGRES_URL to your environment variables')
    console.log('3. Run this script again in production')
    
  } catch (error) {
    console.error('❌ Database setup failed:', error)
    process.exit(1)
  }
}

// Run the setup
setupDatabase()