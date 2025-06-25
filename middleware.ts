import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isLoginPage = req.nextUrl.pathname.startsWith("/login")
  const isApiAuth = req.nextUrl.pathname.startsWith("/api/auth")
  const isAdminPage = req.nextUrl.pathname.startsWith("/admin")
  
  // Allow access to login page and auth API routes
  if (isLoginPage || isApiAuth) {
    return NextResponse.next()
  }
  
  // Redirect to login if not authenticated
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.url)
    return NextResponse.redirect(loginUrl)
  }
  
  // Check admin access
  if (isAdminPage) {
    const userRole = req.auth?.user?.role
    if (userRole !== "admin") {
      const homeUrl = new URL("/", req.url)
      return NextResponse.redirect(homeUrl)
    }
  }
  
  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"]
}