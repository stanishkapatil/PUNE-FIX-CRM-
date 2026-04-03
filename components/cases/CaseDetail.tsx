"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertOctagon, Loader2, Phone, UserCog } from "lucide-react";
import { collection, doc, getDocs, onSnapshot, query, where } from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import { UrgencyBadge } from "../shared/UrgencyBadge";
import { StatusStepper } from "./StatusStepper";
import { TimelineLog } from "./TimelineLog";
import { AIInsightPanel } from "./AIInsightPanel";
import { SLATimer } from "./SLATimer";

type CaseStatus = "received" | "analysed" | "assigned" | "in_progress" | "resolved" | "closed";

type CaseDoc = {
  id: string;
  case_number: string;
  description: string;
  ward: string;
  category: string;
  status: CaseStatus;
  citizen_phone?: string | null;
  assigned_to_uid?: string | null;
  assigned_to_name?: string | null;
  human_review_flag?: boolean;
  sla_deadline?: any;
  created_at?: any;
  ai?: any;
};

type StaffUser = { uid: string; name: string; role: string };

function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "—";
  const p = phone.replace(/\s+/g, "");
  const digits = p.replace(/[^\d]/g, "");
  const last10 = digits.length >= 10 ? digits.slice(-10) : digits;
  if (last10.length < 10) return phone;
  return `+91 ${last10.slice(0, 5)}*****`;
}

async function authedPatch(caseId: string, body: unknown) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  const token = await user.getIdToken();
  const res = await fetch(`/api/v1/cases/${caseId}`, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error || "Failed to update case");
  return json;
}

export function CaseDetail({ caseId }: { caseId: string }) {
  const [c, setC] = useState<CaseDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [reassigning, setReassigning] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const ref = doc(db, "cases", caseId);
    const unsub = onSnapshot(
      ref,
      { includeMetadataChanges: true },
      (snap) => {
        if (!snap.exists()) {
          setError("Case not found.");
          setLoading(false);
          return;
        }
        const data = snap.data() as any;
        setC({
          id: snap.id,
          case_number: String(data.case_number ?? snap.id),
          description: String(data.description ?? ""),
          ward: String(data.ward ?? ""),
          category: String(data.category ?? "General"),
          status: (data.status ?? "received") as CaseStatus,
          citizen_phone: data.citizen_phone ?? null,
          assigned_to_uid: data.assigned_to_uid ?? null,
          assigned_to_name: data.assigned_to_name ?? null,
          human_review_flag: Boolean(data.human_review_flag ?? false),
          sla_deadline: data.sla_deadline ?? null,
          created_at: data.created_at ?? null,
          ai: data.ai ?? null,
        });
        setError(null);
        setLoading(false);
      },
      () => {
        setLoading(false);
      },
    );
    return () => unsub();
  }, [caseId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const snap = await getDocs(query(collection(db, "users"), where("role", "in", ["staff", "supervisor"])));
        const users = snap.docs.map((d) => ({ uid: d.id, name: String((d.data() as any)?.name ?? d.id), role: String((d.data() as any)?.role ?? "") }));
        if (!cancelled) setStaff(users);
      } catch {
        if (!cancelled) setStaff([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = useMemo(() => (c?.assigned_to_uid ? c.assigned_to_uid : ""), [c?.assigned_to_uid]);

  const doReassign = async (uid: string) => {
    if (!c) return;
    const u = staff.find((s) => s.uid === uid);
    if (!u) return;
    setReassigning(true);
    setActionError(null);
    try {
      await authedPatch(c.id, { assignedToUid: u.uid, assignedToName: u.name, note: `Reassigned to ${u.name}.` });
    } catch (e: any) {
      setActionError(e?.message || "Failed to reassign");
    } finally {
      setReassigning(false);
    }
  };

  const doEscalate = async () => {
    if (!c) return;
    setEscalating(true);
    setActionError(null);
    try {
      await authedPatch(c.id, { escalate: true, note: "Escalation requested. Please review urgently." });
    } catch (e: any) {
      setActionError(e?.message || "Failed to escalate");
    } finally {
      setEscalating(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="inline-flex items-center gap-2 text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Loading case…
        </div>
      </div>
    );
  }

  if (error || !c) {
    return <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error || "Case not found."}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-3 justify-between">
          <div className="min-w-0">
            <div className="text-xs text-slate-500">Case Number</div>
            <div className="text-xl font-bold text-[#1B2A4A]">{c.case_number}</div>
            <div className="mt-2 text-sm text-slate-700">{c.description}</div>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{c.ward}</span>
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{c.category}</span>
              <UrgencyBadge urgencyScore={c.ai?.urgency_score ?? 50} />
            </div>

            <div className="mt-3 inline-flex items-center gap-2 text-sm text-slate-700">
              <Phone className="h-4 w-4 text-slate-500" aria-hidden="true" />
              Citizen: <span className="font-semibold">{maskPhone(c.citizen_phone)}</span>
            </div>
          </div>

          <div className="w-full sm:w-auto">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs font-semibold text-slate-600">Assigned officer</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{c.assigned_to_name || "Pending assignment"}</div>

              <div className="mt-3">
                <div className="text-xs text-slate-600">Reassign</div>
                <div className="mt-1 relative">
                  <select
                    value={selected}
                    disabled={reassigning || staff.length === 0}
                    onChange={(e) => void doReassign(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-[#1B2A4A] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] disabled:opacity-60"
                  >
                    <option value="" disabled>
                      Select staff…
                    </option>
                    {staff.map((s) => (
                      <option key={s.uid} value={s.uid}>
                        {s.name} ({s.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void doEscalate()}
                disabled={escalating}
                className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#DC2626] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b91c1c] disabled:opacity-60"
              >
                <AlertOctagon className="h-4 w-4" aria-hidden="true" />
                {escalating ? "Escalating…" : "Escalate"}
              </button>

              {actionError ? <div className="mt-2 text-xs text-red-700">{actionError}</div> : null}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <StatusStepper caseId={c.id} status={c.status} />
          <TimelineLog caseId={c.id} />
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <UserCog className="h-4 w-4 text-slate-500" aria-hidden="true" />
              Internal notes
            </div>
            <div className="mt-2 text-sm text-slate-600">
              Use the timeline note box to log internal updates (assignment, field visit, follow-ups).
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <AIInsightPanel
            caseId={c.id}
            ward={c.ward}
            category={c.category}
            human_review_flag={Boolean(c.human_review_flag)}
            ai={c.ai}
            currentStatus={c.status}
          />
          <SLATimer deadline={c.sla_deadline} createdAt={c.created_at} />
        </div>
      </div>
    </div>
  );
}

