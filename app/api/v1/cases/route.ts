import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { getFirebaseAdminDb } from "../../../../lib/firebase/admin";
import { rateLimitCreateCase } from "../../../../lib/utils/rateLimit";
import { generateCaseNumber } from "../../../../lib/utils/caseNumber";
import { getSLADuration, getSLADeadline } from "../../../../lib/utils/sla";
import { saveNotification } from "../../../../lib/utils/notifications";

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

function parseBase64Image(input: string): { mimeType: "image/jpeg" | "image/png"; base64: string; sizeBytes: number } {
  const raw = input.trim();
  let mime: string | null = null;
  let b64 = raw;

  const m = raw.match(/^data:(image\/(?:jpeg|png));base64,(.+)$/i);
  if (m) {
    mime = m[1]!.toLowerCase();
    b64 = m[2]!;
  }

  // Basic base64 sanity
  if (!/^[A-Za-z0-9+/=\s]+$/.test(b64)) {
    throw new Error("Invalid base64 data");
  }

  // Approx bytes: (len * 3/4) - padding
  const cleaned = b64.replace(/\s/g, "");
  const padding = cleaned.endsWith("==") ? 2 : cleaned.endsWith("=") ? 1 : 0;
  const sizeBytes = Math.floor((cleaned.length * 3) / 4) - padding;

  if (!mime) {
    // Attempt sniff via magic bytes (base64)
    const head = Buffer.from(cleaned.slice(0, 64), "base64");
    if (head.length >= 4 && head[0] === 0xff && head[1] === 0xd8) mime = "image/jpeg";
    else if (head.length >= 8 && head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47) mime = "image/png";
  }

  if (mime !== "image/jpeg" && mime !== "image/png") {
    throw new Error("Photo must be JPEG or PNG");
  }

  if (sizeBytes > 5 * 1024 * 1024) {
    throw new Error("Photo exceeds 5MB limit");
  }

  return { mimeType: mime, base64: cleaned, sizeBytes };
}

const PhoneSchema = z
  .string()
  .trim()
  .regex(/^\+91\s?[6-9]\d{9}$/, "Invalid Indian phone number. Expected +91 XXXXXXXXXX");

const CreateCaseSchema = z.object({
  citizenName: z.string().trim().min(2),
  citizenPhone: PhoneSchema,
  citizenEmail: z.string().trim().email().optional(),
  citizenAddress: z.string().trim().min(5).optional(),
  ward: z.string().trim().min(1),
  title: z.string().trim().min(3),
  description: z.string().trim().min(10),
  category: z.string().trim().min(1),
  isRecurring: z.boolean().optional().default(false),
  photoBase64: z.string().trim().optional(),
});

async function notifyAllStaff(title: string, message: string, meta: { caseId?: string; alertId?: string }) {
  const roles = ["staff", "supervisor", "mla", "admin"] as const;
  const snap = await getFirebaseAdminDb().collection("users").where("role", "in", [...roles]).get();
  const users = snap.docs.map((d) => d.id);

  await Promise.all(
    users.map((uid) =>
      saveNotification(uid, {
        type: meta.alertId ? "cascade_alert" : "case_submitted",
        title,
        message,
        case_id: meta.caseId,
        alert_id: meta.alertId,
      }),
    ),
  );
}

async function maybeCreateCascadeAlert(ward: string, category: string, nowMs: number) {
  const since = nowMs - 72 * 60 * 60 * 1000;
  const snap = await getFirebaseAdminDb()
    .collection("cases")
    .where("ward", "==", ward)
    .where("category", "==", category)
    .where("created_at_ms", ">=", since)
    .get();

  const count = snap.size;
  if (count < 3) return null;

  const severity = count >= 7 ? "CRITICAL" : count >= 5 ? "HIGH" : "MEDIUM";
  const alertId = randomUUID();

  await getFirebaseAdminDb().collection("alerts").doc(alertId).set({
    id: alertId,
    category,
    ward,
    case_count: count,
    window_hours: 72,
    severity,
    is_active: true,
    created_at: FieldValue.serverTimestamp(),
    last_case_at: FieldValue.serverTimestamp(),
  });

  return { alertId, severity, count };
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = rateLimitCreateCase(ip);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded", code: "RATE_LIMIT" }, { status: 429, headers: { "x-ratelimit-reset": String(rl.resetIn) } });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "BAD_JSON", "Invalid JSON body");
  }

  const parsed = CreateCaseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;

  let photo: { mimeType: string; base64: string; sizeBytes: number } | null = null;
  try {
    if (data.photoBase64) photo = parseBase64Image(data.photoBase64);
  } catch (e: any) {
    return jsonError(400, "INVALID_PHOTO", e?.message || "Invalid photo");
  }

  const now = new Date();
  const nowMs = now.getTime();

  const caseId = randomUUID();
  const caseNumber = generateCaseNumber(now);
  const slaHours = getSLADuration(data.category);
  const slaDeadline = getSLADeadline(data.category, now);

  const caseRef = getFirebaseAdminDb().collection("cases").doc(caseId);
  const timelineRef = caseRef.collection("timeline").doc(randomUUID());

  try {
    await getFirebaseAdminDb().runTransaction(async (tx) => {
      tx.set(caseRef, {
        id: caseId,
        case_number: caseNumber,
        citizen_name: data.citizenName,
        citizen_phone: data.citizenPhone.replace(/\s+/g, ""),
        citizen_email: data.citizenEmail ?? null,
        citizen_address: data.citizenAddress ?? null,
        ward: data.ward,
        title: data.title,
        description: data.description,
        category: data.category,
        sub_category: null,
        department: null,
        attachments: [],
        photo: photo
          ? {
              mimeType: photo.mimeType,
              base64: photo.base64,
              sizeBytes: photo.sizeBytes,
            }
          : null,
        status: "received",
        assigned_to_uid: null,
        assigned_to_name: null,
        assigned_at: null,
        resolved_at: null,
        closed_at: null,
        ai: null,
        human_review_flag: true,
        ai_classified_at: null,
        is_recurring: data.isRecurring ?? false,
        vulnerable_flag: false,
        sla_hours: slaHours,
        sla_deadline: Timestamp.fromDate(slaDeadline),
        created_at: FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp(),
        created_at_ms: nowMs,
        updated_at_ms: nowMs,
      });

      tx.set(timelineRef, {
        id: timelineRef.id,
        case_id: caseId,
        type: "created",
        message: `Case created and received (Case No: ${caseNumber}).`,
        created_at: FieldValue.serverTimestamp(),
        meta: { ward: data.ward, category: data.category },
      });
    });
  } catch {
    return jsonError(500, "FIRESTORE_WRITE_FAILED", "Failed to create case");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const trackingUrl = appUrl ? `${appUrl}/track/${caseId}` : `/track/${caseId}`;

  // Fire-and-forget tasks (do not block response)
  void (async () => {
    try {
      // AI classification via internal route (keeps AI logic centralized)
      if (appUrl) {
        void fetch(`${appUrl}/api/v1/ai/classify`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ caseId, description: data.description, ward: data.ward, category: data.category }),
          cache: "no-store",
        });
      }

      const alert = await maybeCreateCascadeAlert(data.ward, data.category, nowMs);
      if (alert) {
        await notifyAllStaff(
          "Cascade alert triggered",
          `${alert.count} cases for ${data.category} in Ward ${data.ward} within 72 hours (Severity: ${alert.severity}).`,
          { alertId: alert.alertId },
        );
      }

      await notifyAllStaff(
        "New case submitted",
        `New case received in Ward ${data.ward} under ${data.category} (Case No: ${caseNumber}).`,
        { caseId },
      );
    } catch {
      // best-effort only
    }
  })();

  return NextResponse.json(
    { caseId, caseNumber, trackingUrl, rateLimit: { remaining: rl.remaining, resetIn: rl.resetIn } },
    { status: 201 },
  );
}

