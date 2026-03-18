"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock } from "lucide-react";

import { getSLAStatus } from "../../lib/utils/sla";

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

function pad2(n: number) {
  return String(Math.max(0, Math.floor(n))).padStart(2, "0");
}

export function SLATimer({ deadline, createdAt }: { deadline: any; createdAt?: any }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const d = useMemo(() => toDate(deadline), [deadline]);
  const c = useMemo(() => (createdAt ? toDate(createdAt) : undefined), [createdAt]);

  const status = useMemo(() => {
    if (!d) return null;
    return getSLAStatus(d, c ?? undefined);
  }, [d, c, now]);

  if (!d || !status) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold text-slate-900">SLA Timer</div>
        <div className="mt-2 text-sm text-slate-600">SLA deadline not available.</div>
      </div>
    );
  }

  const msLeft = d.getTime() - now;
  const breached = msLeft <= 0 || status.isBreached;

  const h = breached ? 0 : Math.floor(msLeft / (60 * 60 * 1000));
  const m = breached ? 0 : Math.floor((msLeft % (60 * 60 * 1000)) / (60 * 1000));
  const s = breached ? 0 : Math.floor((msLeft % (60 * 1000)) / 1000);

  const color = breached
    ? "border-red-200 bg-red-50 text-red-800"
    : status.isAtRisk
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : "border-emerald-200 bg-emerald-50 text-emerald-900";

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-900">SLA Timer</div>
        <div className="text-xs text-slate-500">{Math.round(status.percentLeft)}% left</div>
      </div>

      <div className="p-4">
        <div className={["rounded-xl border px-4 py-3 flex items-center justify-between gap-3", color].join(" ")}>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" aria-hidden="true" />
            <div className="text-sm font-semibold">{breached ? "BREACHED" : "Time remaining"}</div>
          </div>
          <div className="font-mono text-lg font-bold">
            {breached ? "BREACHED" : `${pad2(h)}:${pad2(m)}:${pad2(s)}`}
          </div>
        </div>
        <div className="mt-2 text-xs text-slate-500">
          {breached ? "SLA deadline has passed." : status.isAtRisk ? "At risk (≤ 20% remaining)." : "Within SLA."}
        </div>
      </div>
    </div>
  );
}

