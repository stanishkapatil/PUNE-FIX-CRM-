import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { FieldValue } from "firebase-admin/firestore";

import { getFirebaseAdminDb } from "../../../../lib/firebase/admin";
import { saveNotification } from "../../../../lib/utils/notifications";

export const runtime = "nodejs";

function jsonError(status: number, code: string, error: string) {
  return NextResponse.json({ error, code }, { status });
}

const BodySchema = z.object({
  caseId: z.string().trim().min(1),
  rating: z.number().int().min(1).max(5),
  message: z.string().trim().max(2000).optional(),
  citizenName: z.string().trim().max(120).optional(),
  citizenPhone: z.string().trim().max(32).optional(),
});

async function notifySupervisors(title: string, message: string, caseId: string) {
  const snap = await getFirebaseAdminDb().collection("users").where("role", "==", "supervisor").get();
  const supervisors = snap.docs.map((d) => d.id);
  await Promise.all(
    supervisors.map((uid) =>
      saveNotification(uid, {
        type: "system",
        title,
        message,
        case_id: caseId,
      }),
    ),
  );
}

export async function POST(req: NextRequest) {
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

  const data = parsed.data;

  // Ensure case exists
  const caseSnap = await getFirebaseAdminDb().collection("cases").doc(data.caseId).get();
  if (!caseSnap.exists) return jsonError(404, "NOT_FOUND", "Case not found");

  const feedbackId = randomUUID();
  try {
    await getFirebaseAdminDb().collection("feedback").doc(feedbackId).set({
      id: feedbackId,
      case_id: data.caseId,
      rating: data.rating,
      message: data.message ?? null,
      citizen_name: data.citizenName ?? null,
      citizen_phone: data.citizenPhone ?? null,
      created_at: FieldValue.serverTimestamp(),
    });
  } catch {
    return jsonError(500, "FIRESTORE_WRITE_FAILED", "Failed to save feedback");
  }

  if (data.rating <= 2) {
    void notifySupervisors(
      "Low feedback received",
      `Citizen gave a low rating (${data.rating}/5) for case ${data.caseId}. Please review and follow up.`,
      data.caseId,
    );
  }

  return NextResponse.json({ ok: true, data: { feedbackId } }, { status: 201 });
}

