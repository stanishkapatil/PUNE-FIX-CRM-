"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, WifiOff } from "lucide-react";
import {
  collection,
  getDocs,
  limit,
  onSnapshot,
  query,
  where,
  type DocumentData,
  type QuerySnapshot,
  type Unsubscribe,
} from "firebase/firestore";

import { firebaseDb } from "../../lib/firebase/client";
import { UrgencyBadge } from "../shared/UrgencyBadge";

type CaseStatus = "received" | "analysed" | "assigned" | "in_progress" | "resolved" | "closed";

type CaseDoc = {
  id: string;
  case_number?: string;
  category?: string;
  ward?: string;
  status?: CaseStatus;
  assigned_to_name?: string | null;
  ai?: { urgency_score?: number } | null;
};

type StepKey = "received" | "analysed" | "assigned" | "in_progress" | "resolved";

const STEPS: Array<{ key: StepKey; label: string }> = [
  { key: "received", label: "Received" },
  { key: "analysed", label: "AI Analysed" },
  { key: "assigned", label: "Assigned" },
  { key: "in_progress", label: "In Progress" },
  { key: "resolved", label: "Resolved" },
];

function normalizeId(input: string): string {
  return input.trim();
}

function statusIndex(s?: CaseStatus): number {
  if (!s) return 0;
  const order: CaseStatus[] = ["received", "analysed", "assigned", "in_progress", "resolved", "closed"];
  const idx = order.indexOf(s);
  return idx === -1 ? 0 : idx;
}

function getCurrentStep(status?: CaseStatus): StepKey {
  const idx = statusIndex(status);
  if (idx <= 0) return "received";
  if (idx === 1) return "analysed";
  if (idx === 2) return "assigned";
  if (idx === 3) return "in_progress";
  return "resolved";
}

function dotClass(state: "done" | "current" | "pending") {
  if (state === "done") return "bg-[#16A34A] border-[#16A34A]";
  if (state === "current") return "bg-[#2563EB] border-[#2563EB] animate-pulse";
  return "bg-white border-slate-300";
}

function lineClass(done: boolean) {
  return done ? "bg-[#16A34A]" : "bg-slate-200";
}

async function findCaseDocByIdentifier(identifier: string): Promise<string | null> {
  const id = normalizeId(identifier);
  if (!id) return null;

  // Primary: query by case_number (as requested)
  const q1 = query(collection(firebaseDb, "cases"), where("case_number", "==", id), limit(1));
  const s1 = await getDocs(q1);
  if (!s1.empty) return s1.docs[0]!.id;

  // Fallback: treat identifier as doc id
  const q2 = query(collection(firebaseDb, "cases"), where("id", "==", id), limit(1));
  const s2 = await getDocs(q2);
  if (!s2.empty) return s2.docs[0]!.id;

  return id; // try as doc id directly
}

export function CaseTracker({ identifier }: { identifier: string }) {
  const [caseDoc, setCaseDoc] = useState<CaseDoc | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(false);

  const lastKnownRef = useRef<CaseDoc | null>(null);
  const unsubRef = useRef<Unsubscribe | null>(null);
  const retryTimerRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  const currentStep = useMemo(() => getCurrentStep(caseDoc?.status), [caseDoc?.status]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const onOnline = () => {
      setReconnecting(false);
      setError(null);
    };
    const onOffline = () => setReconnecting(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    const clear = () => {
      if (unsubRef.current) unsubRef.current();
      unsubRef.current = null;
      if (retryTimerRef.current) window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    };

    clear();
    setError(null);
    setReconnecting(false);

    let cancelled = false;

    const subscribe = async () => {
      try {
        const docId = await findCaseDocByIdentifier(identifier);
        if (cancelled || !docId) {
          if (!cancelled) setError("Invalid tracking code.");
          return;
        }

        const q = query(collection(firebaseDb, "cases"), where("id", "==", docId), limit(1));
        const unsub = onSnapshot(
          q,
          { includeMetadataChanges: true },
          (snap: QuerySnapshot<DocumentData>) => {
            const fromCache = snap.metadata.fromCache;
            if (fromCache) setReconnecting(true);
            else setReconnecting(false);

            if (snap.empty) {
              setError("Case not found. Please check your case number.");
              return;
            }

            const d = snap.docs[0]!;
            const data = d.data() as any;
            const next: CaseDoc = {
              id: d.id,
              case_number: data.case_number ?? "",
              category: data.category ?? "General",
              ward: data.ward ?? "",
              status: data.status ?? "received",
              assigned_to_name: data.assigned_to_name ?? null,
              ai: data.ai ?? null,
            };

            lastKnownRef.current = next;
            setCaseDoc(next);
            setError(null);
          },
          () => {
            // listener error (often network); keep last known state
            setReconnecting(true);
            setError("Reconnecting...");
            retryTimerRef.current = window.setTimeout(() => {
              if (!mountedRef.current) return;
              void subscribe();
            }, 5000);
          },
        );

        unsubRef.current = unsub;
      } catch {
        setReconnecting(true);
        setError("Reconnecting...");
        retryTimerRef.current = window.setTimeout(() => {
          if (!mountedRef.current) return;
          void subscribe();
        }, 5000);
      }
    };

    void subscribe();

    return () => {
      cancelled = true;
      clear();
    };
  }, [identifier]);

  const display = caseDoc ?? lastKnownRef.current;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1B2A4A]">Track your complaint</h1>
          <p className="mt-2 text-base text-slate-600">
            Entered code: <span className="font-semibold text-slate-800">{identifier}</span>
          </p>
        </div>

        {reconnecting ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-800">
            <WifiOff className="h-4 w-4" aria-hidden="true" />
            Reconnecting...
          </div>
        ) : null}
      </div>

      {error && !display ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5" aria-hidden="true" />
          <div>{error}</div>
        </div>
      ) : null}

      {display ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm text-slate-500">Case Number</div>
              <div className="text-base font-semibold text-slate-900 truncate">{display.case_number || display.id}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {display.category ?? "General"}
                </span>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {display.ward || "Ward"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <UrgencyBadge urgencyScore={display.ai?.urgency_score ?? 50} />
            </div>
          </div>

          <div className="mt-4 text-sm text-slate-700">
            Assigned officer: <span className="font-semibold">{display.assigned_to_name || "Pending assignment"}</span>
          </div>

          <div className="mt-6">
            <div className="text-sm font-semibold text-[#1B2A4A]">Status</div>
            <div className="mt-4">
              <ol className="relative">
                {STEPS.map((s, idx) => {
                  const curIdx = STEPS.findIndex((x) => x.key === currentStep);
                  const state: "done" | "current" | "pending" =
                    idx < curIdx ? "done" : idx === curIdx ? "current" : "pending";
                  const isLast = idx === STEPS.length - 1;
                  const nextDone = idx < curIdx;
                  return (
                    <li key={s.key} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={["h-4 w-4 rounded-full border-2", dotClass(state)].join(" ")} />
                        {!isLast ? <div className={["w-1 h-10", lineClass(nextDone)].join(" ")} /> : null}
                      </div>
                      <div className="pb-8">
                        <div className="text-sm font-semibold text-slate-900">{s.label}</div>
                        <div className="text-xs text-slate-500">
                          {state === "done"
                            ? "Completed"
                            : state === "current"
                              ? "In progress"
                              : "Pending"}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
          <div className="h-4 w-44 rounded-md bg-slate-200 animate-pulse" />
          <div className="mt-3 space-y-2">
            <div className="h-3 w-full rounded-md bg-slate-200 animate-pulse" />
            <div className="h-3 w-11/12 rounded-md bg-slate-200 animate-pulse" />
            <div className="h-3 w-10/12 rounded-md bg-slate-200 animate-pulse" />
          </div>
        </div>
      )}
    </div>
  );
}

