import { Client, Pool } from 'pg'
import type { User, AuditLog } from './db'

// Create a connection pool for better performance
let pool: Pool | null = null

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })
  }
  return pool
}

export async function initializeDatabase() {
  const client = getPool()
  
  try {
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        role VARCHAR(10) NOT NULL DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        is_active BOOLEAN DEFAULT true
      );
    `)

    // Create audit_logs table
    await client.query(`
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
    `)

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    `)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    `)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
    `)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
    `)

    console.log('Database tables initialized successfully')
  } catch (error) {
    console.error('Error initializing database:', error)
    throw error
  }
}

export async function createUser(userData: Omit<User, 'created_at'>): Promise<User> {
  const client = getPool()
  
  try {
    const result = await client.query(
      `INSERT INTO users (id, username, email, role, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *;`,
      [userData.id, userData.username, userData.email, userData.role, userData.is_active]
    )
    return result.rows[0] as User
  } catch (error) {
    console.error('Error creating user:', error)
    throw error
  }
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const client = getPool()
  
  try {
    const result = await client.query(
      `SELECT * FROM users WHERE username = $1 AND is_active = true;`,
      [username]
    )
    return result.rows[0] as User || null
  } catch (error) {
    console.error('Error getting user by username:', error)
    return null
  }
}

export async function getAllUsers(): Promise<User[]> {
  const client = getPool()
  
  try {
    const result = await client.query(
      `SELECT * FROM users ORDER BY created_at DESC;`
    )
    return result.rows as User[]
  } catch (error) {
    console.error('Error getting all users:', error)
    return []
  }
}

export async function updateUser(username: string, updates: Partial<User>): Promise<User | null> {
  const client = getPool()
  
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

    const result = await client.query(query, values)
    return result.rows[0] as User || null
  } catch (error) {
    console.error('Error updating user:', error)
    throw error
  }
}

export async function deleteUser(username: string): Promise<boolean> {
  const client = getPool()
  
  try {
    const result = await client.query(
      `DELETE FROM users WHERE username = $1 AND username != 'admin';`,
      [username]
    )
    return result.rowCount > 0
  } catch (error) {
    console.error('Error deleting user:', error)
    return false
  }
}

export async function updateLastLogin(username: string): Promise<void> {
  const client = getPool()
  
  try {
    await client.query(
      `UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE username = $1;`,
      [username]
    )
  } catch (error) {
    console.error('Error updating last login:', error)
  }
}

export async function logAction(
  userId: string,
  action: string,
  targetUser?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const client = getPool()
  
  try {
    await client.query(
      `INSERT INTO audit_logs (user_id, action, target_user, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5);`,
      [userId, action, targetUser || null, ipAddress || null, userAgent || null]
    )
  } catch (error) {
    console.error('Error logging action:', error)
  }
}

export async function getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
  const client = getPool()
  
  try {
    const result = await client.query(
      `SELECT al.*, u.username as user_username
       FROM audit_logs al
       JOIN users u ON al.user_id = u.id
       ORDER BY al.created_at DESC
       LIMIT $1;`,
      [limit]
    )
    return result.rows as AuditLog[]
  } catch (error) {
    console.error('Error getting audit logs:', error)
    return []
  }
}

export async function seedInitialData(): Promise<void> {
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