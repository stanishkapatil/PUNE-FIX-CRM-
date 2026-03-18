import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { FieldValue } from "firebase-admin/firestore";

import { getFirebaseAdminDb } from "../../../../../lib/firebase/admin";
import { rateLimitAI } from "../../../../../lib/utils/rateLimit";
import { classifyComplaint } from "../../../../../lib/ai/classify";
import { saveNotification } from "../../../../../lib/utils/notifications";

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
  description: z.string().trim().min(10),
  ward: z.string().trim().min(1),
  category: z.string().trim().optional(),
});

async function notifyAllStaff(title: string, message: string, caseId: string) {
  const roles = ["staff", "supervisor", "mla", "admin"] as const;
  const snap = await getFirebaseAdminDb().collection("users").where("role", "in", [...roles]).get();
  const users = snap.docs.map((d) => d.id);
  await Promise.all(
    users.map((uid) =>
      saveNotification(uid, {
        type: "ai_classification_complete",
        title,
        message,
        case_id: caseId,
      }),
    ),
  );
}

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

  const { caseId, description, ward, category } = parsed.data;

  const caseRef = getFirebaseAdminDb().collection("cases").doc(caseId);
  const caseSnap = await caseRef.get();
  if (!caseSnap.exists) return jsonError(404, "NOT_FOUND", "Case not found");

  const ai = await classifyComplaint(description, ward, category);

  const timelineRef = caseRef.collection("timeline").doc(randomUUID());

  try {
    await getFirebaseAdminDb().runTransaction(async (tx) => {
      tx.set(
        caseRef,
        {
          ai: {
            category: ai.category,
            sub_category: ai.sub_category,
            urgency_score: ai.urgency_score,
            sentiment: ai.sentiment,
            department: ai.department,
            suggested_response: ai.suggested_response,
            confidence: ai.confidence,
            vulnerable_flag: ai.vulnerable_flag,
          },
          category: ai.category || (category ?? "Unclassified"),
          sub_category: ai.sub_category ?? null,
          department: ai.department ?? null,
          vulnerable_flag: ai.vulnerable_flag,
          human_review_flag: ai.human_review_flag,
          ai_classified_at: FieldValue.serverTimestamp(),
          updated_at: FieldValue.serverTimestamp(),
          updated_at_ms: Date.now(),
        },
        { merge: true },
      );

      tx.set(timelineRef, {
        id: timelineRef.id,
        case_id: caseId,
        type: "ai_classified",
        message: "AI Analysis Complete",
        created_at: FieldValue.serverTimestamp(),
        meta: {
          confidence: ai.confidence,
          urgency_score: ai.urgency_score,
          human_review_flag: ai.human_review_flag,
        },
      });
    });
  } catch {
    return jsonError(500, "UPDATE_FAILED", "Failed to save AI classification");
  }

  // best-effort notification
  void notifyAllStaff(
    "AI classification complete",
    `AI analysis completed for case ${caseId}.`,
    caseId,
  );

  return NextResponse.json({ ok: true, data: { caseId, ai } }, { status: 200 });
}

