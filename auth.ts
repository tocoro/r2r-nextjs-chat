import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import type { NextAuthConfig } from "next-auth"

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // For demo purposes, accept any username/password combination
        // In production, you would validate against a database
        if (credentials?.username && credentials?.password) {
          return {
            id: "1",
            name: credentials.username,
            email: `${credentials.username}@example.com`
          }
        }
        return null
      }
    })
  ],
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login"
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnLogin = nextUrl.pathname.startsWith("/login")
      
      if (isOnLogin) {
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl))
        return true
      }
      
      if (isLoggedIn) return true
      return false // Redirect unauthenticated users to login page
    }
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)