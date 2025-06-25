import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import type { NextAuthConfig } from "next-auth"

export const authConfig: NextAuthConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET || "vtMvmSbVHhJI9Tgz9Y/0YzRD9itTi3nHEHCu+EA0VRU=",
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === 'development',
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log("Authorize called with credentials:", credentials)
        
        if (credentials?.username && credentials?.password) {
          try {
            // Dynamic import to avoid loading in Edge runtime
            const { getUserByUsername, updateLastLogin } = await import("@/lib/db")
            
            // Get user from our user store
            const user = await getUserByUsername(credentials.username as string)
            
            if (user && user.is_active) {
              // Update last login
              await updateLastLogin(user.username)
              
              const authUser = {
                id: user.id,
                name: user.username,
                email: user.email,
                role: user.role
              }
              console.log("Returning user:", authUser)
              return authUser
            }
          } catch (error) {
            console.error("Error in authorize:", error)
          }
        }
        console.log("Invalid credentials or user not found")
        return null
      }
    })
  ],
  pages: {
    signIn: "/login"
  },
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.id = user.id
        token.name = user.name
        token.email = user.email
        token.role = user.role
      }
      return token
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token) {
        session.user.id = token.id
        session.user.name = token.name
        session.user.email = token.email
        session.user.role = token.role
      }
      return session
    }
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)