import { NextResponse } from "next/server";
import { Timestamp, WriteBatch } from "firebase-admin/firestore";

import { getFirebaseAdminDb } from "../../../../../lib/firebase/admin";
import { calculatePriorityScore } from "../../../../../lib/scoring/priority";

export const runtime = "nodejs";

function jsonError(status: number, code: string, error: string) {
  return NextResponse.json({ error, code }, { status });
}

function toDate(v: any): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v === "string") {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof v?.toDate === "function") return v.toDate();
  if (typeof v?.seconds === "number") return new Date(v.seconds * 1000);
  if (typeof v?._seconds === "number") return new Date(v._seconds * 1000);
  return null;
}

export async function GET() {
  try {
    const snap = await getFirebaseAdminDb()
      .collection("cases")
      .where("status", "in", ["received", "analysed", "assigned", "in_progress", "resolved"])
      .get();

    const docs = snap.docs;
    let updated = 0;

    const chunks: Array<typeof docs> = [];
    for (let i = 0; i < docs.length; i += 500) chunks.push(docs.slice(i, i + 500));

    for (const chunk of chunks) {
      const batch: WriteBatch = getFirebaseAdminDb().batch();

      for (const d of chunk) {
        const data: any = d.data();
        const deadline = toDate(data.sla_deadline) ?? null;
        const createdAt = toDate(data.created_at) ?? (typeof data.created_at_ms === "number" ? new Date(data.created_at_ms) : null);

        if (!deadline) continue;

        const urgency = Number(data.ai?.urgency_score ?? 50);
        const vulnerable_flag = Boolean(data.vulnerable_flag ?? data.ai?.vulnerable_flag ?? false);
        const is_recurring = Boolean(data.is_recurring ?? false);

        const score = calculatePriorityScore({
          urgency_score: urgency,
          sla_deadline: deadline,
          sla_created_at: createdAt ?? undefined,
          vulnerable_flag,
          is_recurring,
        });

        batch.set(
          d.ref,
          {
            priority: {
              priority_score: score.priority_score,
              sla_hours_left: score.sla_hours_left,
              sla_percent_left: score.sla_percent_left,
              sla_remaining_inverse: score.sla_remaining_inverse,
            },
            updated_at: Timestamp.now(),
            updated_at_ms: Date.now(),
          },
          { merge: true },
        );
        updated += 1;
      }

      await batch.commit();
    }

    return NextResponse.json({ ok: true, data: { updated } }, { status: 200 });
  } catch {
    return jsonError(500, "RECALC_FAILED", "Failed to recalculate scores");
  }
}

