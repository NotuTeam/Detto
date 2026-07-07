import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/onboarding", "/auth", "/login", "/register", "/invite", "/api", "/_next", "/favicon.ico", "/decor", "/logo", "/manifest.json", "/sw.js"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get("detto_session")?.value;

  const isPublic = pathname === "/" || PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Redirect logged-in users away from auth pages
  if (session && ["/login", "/onboarding", "/auth"].some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // Protect non-public routes
  if (!session && !isPublic) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/((?!_next/static|_next/image|favicon.ico|manifest\\.json|sw\\.js).*)"],
};
