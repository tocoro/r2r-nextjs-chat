import { sql } from '@vercel/postgres'
import * as fallback from './users-fallback'
import * as pgDb from './db-pg'

export interface User {
  id: string
  username: string
  email: string
  role: 'admin' | 'user'
  created_at: Date
  last_login?: Date
  is_active: boolean
}

export interface AuditLog {
  id: number
  user_id: string
  action: string
  target_user?: string
  ip_address?: string
  user_agent?: string
  created_at: Date
}

// Initialize database tables
export async function initializeDatabase() {
  if (process.env.POSTGRES_URL?.includes('localhost')) {
    return pgDb.initializeDatabase()
  }
  
  try {
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        role VARCHAR(10) NOT NULL DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        is_active BOOLEAN DEFAULT true
      );
    `

    // Create audit_logs table
    await sql`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        action VARCHAR(255) NOT NULL,
        target_user VARCHAR(255),
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `

    // Create indexes for better performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
    `

    console.log('Database tables initialized successfully')
  } catch (error) {
    console.error('Error initializing database:', error)
    throw error
  }
}

// Check if database is available
async function isDatabaseAvailable(): Promise<boolean> {
  if (!process.env.POSTGRES_URL) {
    return false
  }
  try {
    if (process.env.POSTGRES_URL.includes('localhost')) {
      // Test PostgreSQL connection for local development
      const user = await pgDb.getUserByUsername('admin')
      return true
    } else {
      // Test Vercel Postgres connection
      await sql`SELECT 1`
      return true
    }
  } catch {
    return false
  }
}

// User management functions
export async function createUser(userData: Omit<User, 'created_at'>): Promise<User> {
  if (!(await isDatabaseAvailable())) {
    return fallback.createUser(userData)
  }
  
  if (process.env.POSTGRES_URL?.includes('localhost')) {
    return pgDb.createUser(userData)
  }
  
  try {
    const result = await sql`
      INSERT INTO users (id, username, email, role, is_active)
      VALUES (${userData.id}, ${userData.username}, ${userData.email}, ${userData.role}, ${userData.is_active})
      RETURNING *;
    `
    return result.rows[0] as User
  } catch (error) {
    console.error('Error creating user:', error)
    throw error
  }
}

export async function getUserByUsername(username: string): Promise<User | null> {
  if (!(await isDatabaseAvailable())) {
    return fallback.getUserByUsername(username)
  }
  
  if (process.env.POSTGRES_URL?.includes('localhost')) {
    return pgDb.getUserByUsername(username)
  }
  
  try {
    const result = await sql`
      SELECT * FROM users 
      WHERE username = ${username} AND is_active = true;
    `
    return result.rows[0] as User || null
  } catch (error) {
    console.error('Error getting user by username:', error)
    return null
  }
}

export async function getAllUsers(): Promise<User[]> {
  if (!(await isDatabaseAvailable())) {
    return fallback.getAllUsers()
  }
  
  if (process.env.POSTGRES_URL?.includes('localhost')) {
    return pgDb.getAllUsers()
  }
  
  try {
    const result = await sql`
      SELECT * FROM users 
      ORDER BY created_at DESC;
    `
    return result.rows as User[]
  } catch (error) {
    console.error('Error getting all users:', error)
    return []
  }
}

export async function updateUser(username: string, updates: Partial<User>): Promise<User | null> {
  if (!(await isDatabaseAvailable())) {
    return fallback.updateUser(username, updates)
  }
  
  if (process.env.POSTGRES_URL?.includes('localhost')) {
    return pgDb.updateUser(username, updates)
  }
  
  try {
    const updateFields = []
    const values = []
    let paramCount = 1

    if (updates.email !== undefined) {
      updateFields.push(`email = $${paramCount++}`)
      values.push(updates.email)
    }
    if (updates.role !== undefined) {
      updateFields.push(`role = $${paramCount++}`)
      values.push(updates.role)
    }
    if (updates.is_active !== undefined) {
      updateFields.push(`is_active = $${paramCount++}`)
      values.push(updates.is_active)
    }
    if (updates.last_login !== undefined) {
      updateFields.push(`last_login = $${paramCount++}`)
      values.push(updates.last_login)
    }

    if (updateFields.length === 0) {
      return null
    }

    values.push(username)
    const query = `
      UPDATE users 
      SET ${updateFields.join(', ')} 
      WHERE username = $${paramCount}
      RETURNING *;
    `

    const result = await sql.query(query, values)
    return result.rows[0] as User || null
  } catch (error) {
    console.error('Error updating user:', error)
    throw error
  }
}

export async function deleteUser(username: string): Promise<boolean> {
  if (!(await isDatabaseAvailable())) {
    return fallback.deleteUser(username)
  }
  
  if (process.env.POSTGRES_URL?.includes('localhost')) {
    return pgDb.deleteUser(username)
  }
  
  try {
    const result = await sql`
      DELETE FROM users 
      WHERE username = ${username} AND username != 'admin';
    `
    return (result.rowCount ?? 0) > 0
  } catch (error) {
    console.error('Error deleting user:', error)
    return false
  }
}

export async function updateLastLogin(username: string): Promise<void> {
  if (!(await isDatabaseAvailable())) {
    return fallback.updateLastLogin(username)
  }
  
  if (process.env.POSTGRES_URL?.includes('localhost')) {
    return pgDb.updateLastLogin(username)
  }
  
  try {
    await sql`
      UPDATE users 
      SET last_login = CURRENT_TIMESTAMP 
      WHERE username = ${username};
    `
  } catch (error) {
    console.error('Error updating last login:', error)
  }
}

// Audit logging functions
export async function logAction(
  userId: string,
  action: string,
  targetUser?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  if (!(await isDatabaseAvailable())) {
    return fallback.logAction(userId, action, targetUser, ipAddress, userAgent)
  }
  
  if (process.env.POSTGRES_URL?.includes('localhost')) {
    return pgDb.logAction(userId, action, targetUser, ipAddress, userAgent)
  }
  
  try {
    await sql`
      INSERT INTO audit_logs (user_id, action, target_user, ip_address, user_agent)
      VALUES (${userId}, ${action}, ${targetUser || null}, ${ipAddress || null}, ${userAgent || null});
    `
  } catch (error) {
    console.error('Error logging action:', error)
  }
}

export async function getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
  if (!(await isDatabaseAvailable())) {
    return []
  }
  
  if (process.env.POSTGRES_URL?.includes('localhost')) {
    return pgDb.getAuditLogs(limit)
  }
  
  try {
    const result = await sql`
      SELECT al.*, u.username as user_username
      FROM audit_logs al
      JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT ${limit};
    `
    return result.rows as AuditLog[]
  } catch (error) {
    console.error('Error getting audit logs:', error)
    return []
  }
}

// Seed initial data
export async function seedInitialData(): Promise<void> {
  if (process.env.POSTGRES_URL?.includes('localhost')) {
    return pgDb.seedInitialData()
  }
  
  try {
    // Check if admin user exists
    const adminExists = await getUserByUsername('admin')
    
    if (!adminExists) {
      await createUser({
        id: 'admin',
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin',
        is_active: true
      })
      console.log('Admin user created')
    }

    // Check if test user exists
    const testExists = await getUserByUsername('test')
    
    if (!testExists) {
      await createUser({
        id: 'test',
        username: 'test',
        email: 'test@example.com',
        role: 'user',
        is_active: true
      })
      console.log('Test user created')
    }
  } catch (error) {
    console.error('Error seeding initial data:', error)
  }
}