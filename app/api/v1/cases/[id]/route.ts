import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { FieldValue } from "firebase-admin/firestore";

import { getFirebaseAdminAuth, getFirebaseAdminDb } from "../../../../../lib/firebase/admin";
import { saveNotification } from "../../../../../lib/utils/notifications";

export const runtime = "nodejs";

function jsonError(status: number, code: string, error: string) {
  return NextResponse.json({ error, code }, { status });
}

async function requireStaffRole(req: NextRequest): Promise<{ uid: string; role: string; name?: string }> {
  const authz = req.headers.get("authorization") || "";
  const m = authz.match(/^Bearer\s+(.+)$/i);
  if (!m) throw new Error("MISSING_AUTH");

  const token = m[1]!.trim();
  const decoded = await getFirebaseAdminAuth().verifyIdToken(token);
  const uid = decoded.uid;

  const profileSnap = await getFirebaseAdminDb().collection("users").doc(uid).get();
  const role = profileSnap.exists ? (profileSnap.data() as any)?.role : null;
  const name = profileSnap.exists ? (profileSnap.data() as any)?.name : undefined;

  if (!role || !["staff", "supervisor", "mla", "admin"].includes(role)) {
    throw new Error("FORBIDDEN");
  }

  return { uid, role, name };
}

const StatusSchema = z.enum(["received", "analysed", "assigned", "in_progress", "resolved", "closed"]);

const PatchSchema = z.object({
  status: StatusSchema.optional(),
  note: z.string().trim().min(3).max(4000).optional(),
  assignedToUid: z.string().trim().min(1).optional(),
  assignedToName: z.string().trim().min(1).optional(),
  escalate: z.boolean().optional(),
});

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  received: ["analysed"],
  analysed: ["assigned"],
  assigned: ["in_progress"],
  in_progress: ["resolved"],
  resolved: ["closed"],
  closed: [],
};

export async function GET(_: NextRequest, ctx: { params: { id: string } }) {
  const id = ctx.params.id;
  if (!id?.trim()) return jsonError(400, "INVALID_ID", "Missing case id");

  const caseRef = getFirebaseAdminDb().collection("cases").doc(id);
  const snap = await caseRef.get();
  if (!snap.exists) return jsonError(404, "NOT_FOUND", "Case not found");

  const timelineSnap = await caseRef.collection("timeline").orderBy("created_at", "asc").get();
  const timeline = timelineSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

  return NextResponse.json({ ok: true, data: { case: { id: snap.id, ...(snap.data() as any) }, timeline } }, { status: 200 });
}

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  const id = ctx.params.id;
  if (!id?.trim()) return jsonError(400, "INVALID_ID", "Missing case id");

  let actor: { uid: string; role: string; name?: string };
  try {
    actor = await requireStaffRole(req);
  } catch (e: any) {
    const msg = String(e?.message || e);
    if (msg === "MISSING_AUTH") return jsonError(401, "UNAUTHORIZED", "Missing Authorization header");
    if (msg === "FORBIDDEN") return jsonError(403, "FORBIDDEN", "Insufficient permissions");
    return jsonError(401, "UNAUTHORIZED", "Invalid authentication");
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "BAD_JSON", "Invalid JSON body");
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const nextStatus = parsed.data.status;
  const note = parsed.data.note;
  const assignedToUid = parsed.data.assignedToUid;
  const assignedToName = parsed.data.assignedToName;
  const escalate = parsed.data.escalate === true;

  const caseRef = getFirebaseAdminDb().collection("cases").doc(id);
  const timelineRef = caseRef.collection("timeline").doc(randomUUID());

  try {
    await getFirebaseAdminDb().runTransaction(async (tx) => {
      const currentSnap = await tx.get(caseRef);
      if (!currentSnap.exists) throw new Error("NOT_FOUND");

      const current = currentSnap.data() as any;
      const currentStatus: string = current.status;
      if (nextStatus) {
        const allowed = ALLOWED_TRANSITIONS[currentStatus] ?? [];
        if (!allowed.includes(nextStatus)) {
          throw new Error("INVALID_TRANSITION");
        }
      }

      const update: Record<string, unknown> = {
        updated_at: FieldValue.serverTimestamp(),
        updated_at_ms: Date.now(),
      };

      if (nextStatus) {
        update.status = nextStatus;
      }

      if (assignedToUid && assignedToName) {
        update.assigned_to_uid = assignedToUid;
        update.assigned_to_name = assignedToName;
        update.assigned_at = FieldValue.serverTimestamp();
        if (!nextStatus && currentStatus === "analysed") {
          // encourage flow: analysed -> assigned when staff explicitly assigns
          update.status = "assigned";
        }
      }

      const finalStatus = (update.status as string | undefined) ?? currentStatus;

      if (finalStatus === "assigned" && !current.assigned_to_uid) {
        // If assignment happens elsewhere, keep as-is; do not auto-assign here.
        update.assigned_at = FieldValue.serverTimestamp();
      }
      if (finalStatus === "resolved") update.resolved_at = FieldValue.serverTimestamp();
      if (finalStatus === "closed") update.closed_at = FieldValue.serverTimestamp();

      tx.set(caseRef, update, { merge: true });

      tx.set(timelineRef, {
        id: timelineRef.id,
        case_id: id,
        type: nextStatus ? "status_changed" : note ? "comment" : assignedToUid ? "assigned" : "comment",
        message: nextStatus
          ? `Status updated from ${currentStatus} to ${finalStatus}.`
          : assignedToUid && assignedToName
            ? `Case assigned to ${assignedToName}.`
            : note
              ? note
              : "Case updated.",
        from_status: nextStatus ? currentStatus : null,
        to_status: nextStatus ? finalStatus : null,
        actor_uid: actor.uid,
        actor_name: actor.name ?? null,
        created_at: FieldValue.serverTimestamp(),
        meta: escalate ? { escalated: true } : null,
      });
    });
  } catch (e: any) {
    const msg = String(e?.message || e);
    if (msg === "NOT_FOUND") return jsonError(404, "NOT_FOUND", "Case not found");
    if (msg === "INVALID_TRANSITION") return jsonError(409, "INVALID_TRANSITION", "Invalid status transition");
    return jsonError(500, "UPDATE_FAILED", "Failed to update case");
  }

  // Best-effort notifications
  void (async () => {
    try {
      const roles = ["staff", "supervisor", "mla", "admin"] as const;
      const snap = await getFirebaseAdminDb().collection("users").where("role", "in", [...roles]).get();
      const users = snap.docs.map((d) => d.id);
      await Promise.all(
        users.map((uid) =>
          saveNotification(uid, {
            type: "status_updated",
            title: "Case status updated",
            message: nextStatus
              ? `Case ${id} status updated to ${nextStatus}.`
              : assignedToUid
                ? `Case ${id} was reassigned.`
                : escalate
                  ? `Case ${id} was escalated.`
                  : `Case ${id} was updated.`,
            case_id: id,
          }),
        ),
      );

      if (escalate) {
        const supervisors = await getFirebaseAdminDb().collection("users").where("role", "==", "supervisor").get();
        const supIds = supervisors.docs.map((d) => d.id);
        await Promise.all(
          supIds.map((uid) =>
            saveNotification(uid, {
              type: "system",
              title: "Case escalation requested",
              message: `Escalation requested for case ${id}. Please review and assign action.`,
              case_id: id,
            }),
          ),
        );
      }
    } catch {
      // ignore
    }
  })();

  return NextResponse.json({ ok: true, data: { caseId: id, status: nextStatus ?? null } }, { status: 200 });
}

