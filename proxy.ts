import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = new Set(["/", "/submit", "/login", "/demo"]);

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/track/")) return true;
  return false;
}

function isPublicApi(req: NextRequest): boolean {
  const { pathname } = req.nextUrl;

  // Public API routes
  if (pathname === "/api/v1/auth/session") return true; // set/clear session cookie
  if (pathname === "/api/v1/feedback") return true;
  if (pathname === "/api/v1/ai/classify") return true; // internal call
  if (pathname === "/api/v1/cases") return req.method === "POST"; // POST only
  if (pathname.startsWith("/api/v1/demo/")) return true; // demo routes are token-gated in handlers

  return false;
}

function isProtectedAppRoute(pathname: string): boolean {
  return (
    pathname === "/dashboard" ||
    pathname === "/staff-dashboard" ||
    pathname.startsWith("/cases") ||
    pathname === "/mla" ||
    pathname === "/mla-dashboard" ||
    pathname === "/admin"
  );
}

function getSessionCookie(req: NextRequest): string | null {
  // Common cookie names used with Firebase session cookies.
  // One of these must be set by your login flow / backend.
  const c1 = req.cookies.get("session")?.value;
  if (c1) return c1;
  const c2 = req.cookies.get("__session")?.value;
  if (c2) return c2;
  return null;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Ignore Next internals/static
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap")
  ) {
    return NextResponse.next();
  }

  // Public app routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // API routing rules
  if (pathname.startsWith("/api/v1/")) {
    if (isPublicApi(req)) return NextResponse.next();

    const session = getSessionCookie(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
    }

    return NextResponse.next();
  }

  // Protected app pages
  if (isProtectedAppRoute(pathname)) {
    const session = getSessionCookie(req);
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

