// Fallback user store for development when database is not available
export interface User {
  id: string
  username: string
  email: string
  role: 'admin' | 'user'
  created_at: Date
  last_login?: Date
  is_active: boolean
}

// In-memory user store for development
const users: Map<string, User> = new Map([
  ['admin', {
    id: 'admin',
    username: 'admin',
    email: 'admin@example.com',
    role: 'admin',
    created_at: new Date('2024-01-01'),
    last_login: new Date(),
    is_active: true
  }],
  ['test', {
    id: 'test',
    username: 'test',
    email: 'test@example.com',
    role: 'user',
    created_at: new Date(),
    last_login: new Date(),
    is_active: true
  }]
])

export function getUserByUsername(username: string): Promise<User | null> {
  return Promise.resolve(users.get(username) || null)
}

export function getAllUsers(): Promise<User[]> {
  return Promise.resolve(Array.from(users.values()))
}

export function createUser(userData: Omit<User, 'created_at'>): Promise<User> {
  const user: User = {
    ...userData,
    created_at: new Date()
  }
  users.set(user.username, user)
  return Promise.resolve(user)
}

export function updateUser(username: string, updates: Partial<User>): Promise<User | null> {
  const user = users.get(username)
  if (!user) return Promise.resolve(null)
  
  const updatedUser = { ...user, ...updates }
  users.set(username, updatedUser)
  return Promise.resolve(updatedUser)
}

export function deleteUser(username: string): Promise<boolean> {
  if (username === 'admin') return Promise.resolve(false)
  return Promise.resolve(users.delete(username))
}

export function updateLastLogin(username: string): Promise<void> {
  const user = users.get(username)
  if (user) {
    user.last_login = new Date()
    users.set(username, user)
  }
  return Promise.resolve()
}

export function logAction(
  userId: string,
  action: string,
  targetUser?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  console.log(`[AUDIT] ${userId}: ${action}${targetUser ? ` -> ${targetUser}` : ''}`)
  return Promise.resolve()
}