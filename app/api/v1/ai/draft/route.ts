import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getFirebaseAdminDb } from "../../../../../lib/firebase/admin";
import { rateLimitAI } from "../../../../../lib/utils/rateLimit";
import { generateDraft } from "../../../../../lib/ai/draft";

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

const BodySchema = z.object({
  caseId: z.string().trim().min(1),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = rateLimitAI(ip);
  if (!rl.allowed) return jsonError(429, "RATE_LIMIT", "Rate limit exceeded");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "BAD_JSON", "Invalid JSON body");
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const snap = await getFirebaseAdminDb().collection("cases").doc(parsed.data.caseId).get();
    if (!snap.exists) return jsonError(404, "NOT_FOUND", "Case not found");

    const c = { id: snap.id, ...(snap.data() as any) };
    const { draft } = await generateDraft(c as any);
    return NextResponse.json({ ok: true, data: { draft } }, { status: 200 });
  } catch {
    return jsonError(500, "DRAFT_FAILED", "Failed to generate draft");
  }
}

