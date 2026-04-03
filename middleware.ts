import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Let Next.js handle all routing
  // Auth protection is handled client-side in layouts
  return NextResponse.next();
}

// Only run middleware on specific paths - NOT on login
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|login).*)',
  ],
};
