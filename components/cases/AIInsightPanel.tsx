"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles, RefreshCw, AlertTriangle, Send } from "lucide-react";
import { collection, getCountFromServer, query, where } from "firebase/firestore";

import { firebaseAuth, firebaseDb } from "../../lib/firebase/client";

type Props = {
  caseId: string;
  ward: string;
  category: string;
  human_review_flag: boolean;
  ai: null | {
    category?: string;
    sub_category?: string;
    urgency_score?: number;
    sentiment?: string;
    confidence?: number;
    department?: string;
    suggested_response?: string;
    vulnerable_flag?: boolean;
  };
  currentStatus: "received" | "analysed" | "assigned" | "in_progress" | "resolved" | "closed";
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function sentimentBadge(sentiment: string | undefined) {
  const s = (sentiment ?? "neutral").toLowerCase();
  const map: Record<string, string> = {
    positive: "bg-emerald-50 text-emerald-800 border-emerald-200",
    neutral: "bg-slate-50 text-slate-700 border-slate-200",
    negative: "bg-amber-50 text-amber-900 border-amber-200",
    urgent: "bg-red-50 text-red-800 border-red-200",
  };
  return (
    <span className={["inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold", map[s] ?? map.neutral].join(" ")}>
      {(s || "neutral").toUpperCase()}
    </span>
  );
}

async function authedPatch(caseId: string, body: unknown) {
  const user = firebaseAuth.currentUser;
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

export function AIInsightPanel({ caseId, ward, category, human_review_flag, ai, currentStatus }: Props) {
  const urgency = clamp(Number(ai?.urgency_score ?? 50), 0, 100);
  const confidence = clamp(Number(ai?.confidence ?? 0), 0, 100);

  const [similarCount, setSimilarCount] = useState<number | null>(null);
  const [draft, setDraft] = useState<string>(ai?.suggested_response ?? "");
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const snap = await getCountFromServer(
          query(collection(firebaseDb, "cases"), where("ward", "==", ward), where("category", "==", category)),
        );
        if (!cancelled) setSimilarCount(snap.data().count);
      } catch {
        if (!cancelled) setSimilarCount(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ward, category]);

  useEffect(() => {
    setDraft(ai?.suggested_response ?? "");
  }, [ai?.suggested_response]);

  const regenerateDraft = async () => {
    setDraftLoading(true);
    setDraftError(null);
    try {
      const res = await fetch("/api/v1/ai/draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ caseId }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Failed to generate draft");
      setDraft(String(json?.data?.draft ?? ""));
    } catch (e: any) {
      setDraftError(e?.message || "Failed to generate draft");
    } finally {
      setDraftLoading(false);
    }
  };

  const nextStatusForSend = useMemo(() => {
    // Sending a response generally means the case has moved into processing.
    if (currentStatus === "assigned") return "in_progress";
    if (currentStatus === "analysed") return "assigned";
    if (currentStatus === "received") return "analysed";
    return currentStatus;
  }, [currentStatus]);

  const sendToCitizen = async () => {
    setSending(true);
    setSendError(null);
    try {
      await authedPatch(caseId, {
        status: nextStatusForSend,
        note: `Draft response prepared for citizen:\n\n${draft}`,
        notifySupervisors: false,
      });
    } catch (e: any) {
      setSendError(e?.message || "Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
            <Sparkles className="h-5 w-5 text-[#2563EB]" aria-hidden="true" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">AI Insight</div>
            <div className="text-xs text-slate-500">Classification and draft response</div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {human_review_flag ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5" aria-hidden="true" />
            <div className="font-semibold">Flagged for human review</div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs text-slate-600">Category</div>
            <div className="text-sm font-semibold text-slate-900">{ai?.category ?? category}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs text-slate-600">Sub-category</div>
            <div className="text-sm font-semibold text-slate-900">{ai?.sub_category ?? "—"}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs text-slate-600">Department</div>
            <div className="text-sm font-semibold text-slate-900">{ai?.department ?? "—"}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs text-slate-600">Sentiment</div>
            <div className="mt-1">{sentimentBadge(ai?.sentiment)}</div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900">Urgency score</div>
            <div className="text-sm font-bold text-[#1B2A4A]">{urgency}</div>
          </div>
          <div className="mt-2 h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-[#2563EB]" style={{ width: `${urgency}%` }} />
          </div>
          <div className="mt-2 text-xs text-slate-600">
            Confidence: <span className="font-semibold">{confidence}%</span>
            {similarCount != null ? (
              <>
                {" "}
                • Similar cases: <span className="font-semibold">{Math.max(0, similarCount - 1)}</span>
              </>
            ) : null}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-slate-900">AI Draft</div>
            <button
              type="button"
              onClick={() => void regenerateDraft()}
              disabled={draftLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-3 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8] disabled:opacity-60"
            >
              <RefreshCw className={["h-4 w-4", draftLoading ? "animate-spin" : ""].join(" ")} aria-hidden="true" />
              Regenerate AI Draft
            </button>
          </div>

          {draftError ? <div className="mt-2 text-xs text-red-700">{draftError}</div> : null}

          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={6}
            className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB]"
            placeholder="AI draft will appear here…"
          />

          {sendError ? <div className="mt-2 text-xs text-red-700">{sendError}</div> : null}

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => void sendToCitizen()}
              disabled={sending || !draft.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0D9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f766e] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              {sending ? "Sending…" : "Send to Citizen"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

