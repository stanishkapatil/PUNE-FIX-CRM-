"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Clock } from "lucide-react";
import { collection, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";

import { firebaseDb } from "../../lib/firebase/client";
import { UrgencyBadge } from "../shared/UrgencyBadge";
import { PriorityQueueSkeleton } from "../shared/LoadingStates";

type Row = {
  id: string;
  case_number: string;
  description: string;
  ward: string;
  status: string;
  assigned_to_name?: string | null;
  ai?: { urgency_score?: number } | null;
  sla_deadline?: any;
  priority?: { priority_score?: number } | null;
};

function toDate(v: any): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v?.toDate === "function") return v.toDate();
  if (typeof v?.seconds === "number") return new Date(v.seconds * 1000);
  if (typeof v?._seconds === "number") return new Date(v._seconds * 1000);
  if (typeof v === "string") {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function formatCountdown(deadline: Date | null): string {
  if (!deadline) return "—";
  const ms = deadline.getTime() - Date.now();
  if (ms <= 0) return "Breached";
  const totalMin = Math.floor(ms / (60 * 1000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h ${m}m`;
}

export function PriorityQueue() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  // Tick to keep countdowns fresh without re-querying
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setTick((x) => x + 1), 60 * 1000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    const q = query(
      collection(firebaseDb, "cases"),
      where("status", "in", ["received", "analysed", "assigned", "in_progress", "resolved"]),
      orderBy("priority.priority_score", "desc"),
      limit(10),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setRows(
          snap.docs.map((d) => {
            const data = d.data() as any;
            return {
              id: d.id,
              case_number: String(data.case_number ?? d.id),
              description: String(data.description ?? ""),
              ward: String(data.ward ?? ""),
              status: String(data.status ?? ""),
              assigned_to_name: data.assigned_to_name ?? null,
              ai: data.ai ?? null,
              sla_deadline: data.sla_deadline ?? null,
              priority: data.priority ?? null,
            } as Row;
          }),
        );
        setLoading(false);
      },
      () => {
        setLoading(false);
      },
    );

    return () => unsub();
  }, []);

  const empty = useMemo(() => !loading && rows.length === 0, [loading, rows.length]);

  if (loading) return <PriorityQueueSkeleton />;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 sm:px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-900">Priority Queue</div>
          <div className="text-xs text-slate-500">Top 10 cases by priority score</div>
        </div>
      </div>

      {empty ? (
        <div className="p-6 text-sm text-slate-600">No cases to show yet.</div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {rows.map((r) => {
            const score = Math.round(Number(r.priority?.priority_score ?? 0));
            const deadline = toDate(r.sla_deadline);
            const countdown = formatCountdown(deadline);
            return (
              <li key={r.id}>
                <Link href={`/cases/${r.id}`} className="block px-4 sm:px-5 py-4 hover:bg-slate-50">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-semibold text-slate-900">{r.case_number}</div>
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {r.ward}
                        </span>
                        <UrgencyBadge urgencyScore={r.ai?.urgency_score ?? 50} />
                      </div>
                      <div className="mt-1 text-sm text-slate-600 line-clamp-2">{r.description}</div>

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                        <div className="inline-flex items-center gap-1">
                          <Clock className="h-4 w-4 text-slate-500" aria-hidden="true" />
                          <span>SLA: {countdown}</span>
                        </div>
                        <div className="inline-flex items-center gap-2">
                          <span className="text-slate-500">Priority</span>
                          <span className="font-semibold text-[#1B2A4A]">{score}</span>
                        </div>
                        {r.assigned_to_name ? (
                          <div className="inline-flex items-center gap-2">
                            <span className="text-slate-500">Officer</span>
                            <span className="font-semibold text-slate-800">{r.assigned_to_name}</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400 mt-1" aria-hidden="true" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

