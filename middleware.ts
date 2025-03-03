import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // In a real app, check for auth token/session
  // This is a simple example for demonstration

  const session = request.cookies.get('session');
  const isAuthRoute = request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname.startsWith("/register")

  // Protected routes
  if (request.nextUrl.pathname.startsWith("/dashboard") || request.nextUrl.pathname.startsWith("/presentation")) {
    // Check if user is authenticated
    if (!session) {
      const response = NextResponse.redirect(new URL("/login", request.url))
      // Clear any invalid session cookie
      response.cookies.delete('session')
      return response
    }
  }

  // Redirect authenticated users away from auth routes
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}
  matcher: ["/dashboard/:path*", "/presentation/:path*", "/login", "/register"],
}

