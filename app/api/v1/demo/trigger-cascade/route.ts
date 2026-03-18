import "server-only";

import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { getFirebaseAdminDb } from "../../../../../lib/firebase/admin";
import { generateCaseNumber } from "../../../../../lib/utils/caseNumber";
import { getSLADuration, getSLADeadline } from "../../../../../lib/utils/sla";

export const runtime = "nodejs";

function jsonError(status: number, code: string, error: string) {
  return NextResponse.json({ error, code }, { status });
}

function demoAllowed(req: NextRequest): boolean {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const isLocal = appUrl.includes("localhost") || appUrl.includes("127.0.0.1");
  const headerToken = req.headers.get("x-demo-token");
  return isLocal || headerToken === "PCRM2026";
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
  if (!demoAllowed(req)) return jsonError(403, "DEMO_FORBIDDEN", "Demo endpoints are restricted");

  const now = new Date();
  const nowMs = now.getTime();

  const ward = "Ward 7";
  const category = "Water Supply";

  const writes = Array.from({ length: 4 }).map(async (_, i) => {
    const caseId = randomUUID();
    const caseNumber = generateCaseNumber(now);
    const slaHours = getSLADuration(category);
    const deadline = getSLADeadline(category, now);
    const ref = getFirebaseAdminDb().collection("cases").doc(caseId);

    await ref.set({
      id: caseId,
      case_number: caseNumber,
      citizen_name: ["Ramesh Kumar", "Priya Sharma", "Mohammed Iqbal", "Sunita Devi"][i] ?? "Citizen",
      citizen_phone: "+919876543210",
      citizen_email: null,
      citizen_address: "Pune, Maharashtra",
      ward,
      title: "No water supply",
      description:
        "No water supply since morning in our lane. Multiple households affected. Please send a team urgently to check the valve and pipeline.",
      category,
      sub_category: "No water supply",
      department: "Water Supply",
      attachments: [],
      photo: null,
      status: "received",
      assigned_to_uid: null,
      assigned_to_name: null,
      assigned_at: null,
      resolved_at: null,
      closed_at: null,
      ai: {
        category,
        sub_category: "No water supply",
        urgency_score: 78,
        sentiment: "urgent",
        department: "Water Supply",
        suggested_response: "We have noted your complaint and will dispatch the water supply team to inspect the issue.",
        confidence: 86,
        vulnerable_flag: false,
      },
      human_review_flag: false,
      ai_classified_at: FieldValue.serverTimestamp(),
      is_recurring: true,
      vulnerable_flag: false,
      sla_hours: slaHours,
      sla_deadline: Timestamp.fromDate(deadline),
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
      created_at_ms: nowMs + i,
      updated_at_ms: nowMs + i,
      demo_seed: true,
    });
  });

  try {
    await Promise.all(writes);
    const alert = await maybeCreateCascadeAlert(ward, category, nowMs);
    return NextResponse.json(
      { success: true, alertTriggered: Boolean(alert), alertId: alert?.alertId ?? null },
      { status: 200 },
    );
  } catch {
    return jsonError(500, "DEMO_WRITE_FAILED", "Failed to trigger cascade");
  }
}

