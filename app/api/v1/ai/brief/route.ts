import { NextResponse, type NextRequest } from "next/server";

import { getFirebaseAdminDb } from "../../../../../lib/firebase/admin";
import { rateLimitAI } from "../../../../../lib/utils/rateLimit";
import { generateBrief } from "../../../../../lib/ai/brief";

export const runtime = "nodejs";

function jsonError(status: number, code: string, error: string) {
  return NextResponse.json({ error, code }, { status });
}

function getClientIp(req: NextRequest): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]!.trim();
  const xr = req.headers.get("x-real-ip");
  return xr?.trim() || "unknown";
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = rateLimitAI(ip);
  if (!rl.allowed) return jsonError(429, "RATE_LIMIT", "Rate limit exceeded");

  try {
    // open cases: anything not closed
    const snap = await getFirebaseAdminDb()
      .collection("cases")
      .where("status", "in", ["received", "analysed", "assigned", "in_progress", "resolved"])
      .get();

    const cases = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    const { brief, topPriorityCaseIds } = await generateBrief(cases as any);

    return NextResponse.json({ ok: true, data: { brief, topPriorityCaseIds } }, { status: 200 });
  } catch {
    return jsonError(500, "BRIEF_FAILED", "Failed to generate brief");
  }
}

