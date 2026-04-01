import { NextResponse, type NextRequest } from "next/server";

import { getFirebaseAdminAuth } from "../../../../../lib/firebase/admin";

export const runtime = "nodejs";

const SESSION_COOKIE_NAME = "session";
const SESSION_EXPIRES_IN_MS = 1000 * 60 * 60 * 24 * 5; // 5 days

function jsonError(status: number, code: string, error: string) {
  return NextResponse.json({ ok: false, code, error }, { status });
}

function isSecureCookie(req: NextRequest): boolean {
  const proto = req.headers.get("x-forwarded-proto");
  if (proto) return proto === "https";
  // local dev default
  return process.env.NODE_ENV === "production";
}

// Create/refresh a Firebase session cookie from an ID token.
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as null | { idToken?: string };
    const idToken = body?.idToken;
    if (!idToken || typeof idToken !== "string") {
      return jsonError(400, "MISSING_ID_TOKEN", "Missing idToken");
    }

    const auth = getFirebaseAdminAuth();
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn: SESSION_EXPIRES_IN_MS });

    const res = NextResponse.json({ ok: true }, { status: 200 });
    res.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: isSecureCookie(req),
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(SESSION_EXPIRES_IN_MS / 1000),
    });
    return res;
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : "Failed to create session";
    return jsonError(401, "SESSION_CREATE_FAILED", msg);
  }
}

// Clear session cookie.
export async function DELETE(req: NextRequest) {
  const res = NextResponse.json({ ok: true }, { status: 200 });
  res.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: isSecureCookie(req),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}

