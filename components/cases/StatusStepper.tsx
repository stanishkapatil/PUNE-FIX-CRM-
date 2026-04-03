"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";

import { auth } from "@/lib/firebase";

type CaseStatus = "received" | "analysed" | "assigned" | "in_progress" | "resolved" | "closed";

const STATUSES: Array<{ key: CaseStatus; label: string }> = [
  { key: "received", label: "Received" },
  { key: "analysed", label: "Analysed" },
  { key: "assigned", label: "Assigned" },
  { key: "in_progress", label: "In Progress" },
  { key: "resolved", label: "Resolved" },
  { key: "closed", label: "Closed" },
];

const ALLOWED_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  received: ["analysed"],
  analysed: ["assigned"],
  assigned: ["in_progress"],
  in_progress: ["resolved"],
  resolved: ["closed"],
  closed: [],
};

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

export function StatusStepper({ caseId, status, onUpdated }: { caseId: string; status: CaseStatus; onUpdated?: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowed = useMemo(() => new Set(ALLOWED_TRANSITIONS[status] ?? []), [status]);

  const handleChange = async (next: CaseStatus) => {
    if (next === status) return;
    if (!allowed.has(next)) return;
    setSaving(true);
    setError(null);
    try {
      await authedPatch(caseId, { status: next });
      onUpdated?.();
    } catch (e: any) {
      setError(e?.message || "Failed to update status");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-900">Status</div>
        <div className="relative">
          <select
            value={status}
            disabled={saving}
            onChange={(e) => void handleChange(e.target.value as CaseStatus)}
            className="h-10 rounded-lg border border-slate-300 bg-white pl-3 pr-9 text-sm font-semibold text-[#1B2A4A] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] disabled:opacity-60"
          >
            {STATUSES.map((s) => (
              <option key={s.key} value={s.key} disabled={s.key !== status && !allowed.has(s.key)}>
                {s.label} {s.key !== status && !allowed.has(s.key) ? "(disabled)" : ""}
              </option>
            ))}
          </select>
          <ChevronDown className="h-4 w-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-6 gap-2">
          {STATUSES.map((s) => {
            const isCurrent = s.key === status;
            const isDone = STATUSES.findIndex((x) => x.key === s.key) < STATUSES.findIndex((x) => x.key === status);
            return (
              <div key={s.key} className="text-center">
                <div
                  className={[
                    "mx-auto h-3.5 w-3.5 rounded-full border-2",
                    isCurrent ? "bg-[#2563EB] border-[#2563EB]" : isDone ? "bg-[#16A34A] border-[#16A34A]" : "bg-white border-slate-300",
                  ].join(" ")}
                />
                <div className={["mt-1 text-[11px] font-semibold", isCurrent ? "text-[#1B2A4A]" : "text-slate-500"].join(" ")}>
                  {s.label}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Allowed next:{" "}
            <span className="font-semibold text-slate-700">
              {(ALLOWED_TRANSITIONS[status] ?? []).length ? (ALLOWED_TRANSITIONS[status] ?? []).join(", ") : "none"}
            </span>
          </div>
          {saving ? (
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              Saving…
            </div>
          ) : null}
        </div>

        {error ? (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
        ) : null}
      </div>
    </div>
  );
}

