"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Clock, ShieldAlert, ClipboardList } from "lucide-react";
import {
  collection,
  getCountFromServer,
  getDocs,
  query,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

import { firebaseDb } from "../../lib/firebase/client";
import { getSLAStatus } from "../../lib/utils/sla";
import { KPICardSkeleton } from "../shared/LoadingStates";

type CaseRow = {
  created_at?: any;
  resolved_at?: any;
  status?: string;
  sla_deadline?: any;
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

function mapCaseDoc(d: QueryDocumentSnapshot<DocumentData>): CaseRow {
  const data = d.data() as any;
  return {
    created_at: data.created_at,
    resolved_at: data.resolved_at,
    status: data.status,
    sla_deadline: data.sla_deadline,
  };
}

export function KPICards() {
  const [loading, setLoading] = useState(true);
  const [openCases, setOpenCases] = useState(0);
  const [resolvedToday, setResolvedToday] = useState(0);
  const [slaAtRisk, setSlaAtRisk] = useState(0);
  const [avgResolutionHours, setAvgResolutionHours] = useState<number | null>(null);

  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const casesCol = collection(firebaseDb, "cases");

        const openSnap = await getCountFromServer(
          query(casesCol, where("status", "in", ["received", "analysed", "assigned", "in_progress", "resolved"])),
        );

        const resolvedTodayDocs = await getDocs(
          query(casesCol, where("status", "==", "resolved"), where("resolved_at", ">=", todayStart)),
        );

        // SLA at risk computed from deadline vs now (client-side), keep query bounded.
        const openDocs = await getDocs(
          query(casesCol, where("status", "in", ["received", "analysed", "assigned", "in_progress"]), where("sla_deadline", ">=", new Date(0))),
        );

        let atRisk = 0;
        for (const d of openDocs.docs) {
          const data = d.data() as any;
          const deadline = toDate(data.sla_deadline);
          if (!deadline) continue;
          const createdAt = toDate(data.created_at) ?? undefined;
          const st = getSLAStatus(deadline, createdAt);
          if (st.isAtRisk) atRisk += 1;
        }

        // Average resolution time (hours) computed from resolved cases today.
        const rows = resolvedTodayDocs.docs.map(mapCaseDoc);
        const diffs: number[] = [];
        for (const r of rows) {
          const created = toDate(r.created_at);
          const resolved = toDate(r.resolved_at);
          if (!created || !resolved) continue;
          diffs.push((resolved.getTime() - created.getTime()) / (60 * 60 * 1000));
        }
        const avg = diffs.length ? diffs.reduce((a, b) => a + b, 0) / diffs.length : null;

        if (!cancelled) {
          setOpenCases(openSnap.data().count);
          setResolvedToday(resolvedTodayDocs.size);
          setSlaAtRisk(atRisk);
          setAvgResolutionHours(avg);
        }
      } catch {
        if (!cancelled) {
          setOpenCases(0);
          setResolvedToday(0);
          setSlaAtRisk(0);
          setAvgResolutionHours(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [todayStart]);

  if (loading) return <KPICardSkeleton />;

  const cards = [
    {
      label: "Open Cases",
      value: openCases.toLocaleString(),
      icon: <ClipboardList className="h-5 w-5 text-[#2563EB]" aria-hidden="true" />,
      hint: "Active across departments",
    },
    {
      label: "Resolved Today",
      value: resolvedToday.toLocaleString(),
      icon: <Activity className="h-5 w-5 text-[#16A34A]" aria-hidden="true" />,
      hint: "Cases resolved since midnight",
    },
    {
      label: "SLA at Risk",
      value: slaAtRisk.toLocaleString(),
      icon: <ShieldAlert className="h-5 w-5 text-[#D97706]" aria-hidden="true" />,
      hint: "≤ 20% SLA time remaining",
    },
    {
      label: "Avg Resolution Time",
      value: avgResolutionHours == null ? "—" : `${Math.round(avgResolutionHours)}h`,
      icon: <Clock className="h-5 w-5 text-[#1B2A4A]" aria-hidden="true" />,
      hint: "Based on today’s resolved cases",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-700">{c.label}</div>
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 border border-slate-200">
              {c.icon}
            </div>
          </div>
          <div className="mt-3 text-3xl font-bold text-[#1B2A4A]">{c.value}</div>
          <div className="mt-2 text-xs text-slate-500">{c.hint}</div>
        </div>
      ))}
    </div>
  );
}

