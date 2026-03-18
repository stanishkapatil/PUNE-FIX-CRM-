"use client";

import { useEffect, useMemo, useState } from "react";
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar } from "recharts";
import { Download, Loader2 } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";

import { Sidebar } from "../../components/layout/Sidebar";
import { Header } from "../../components/layout/Header";
import { firebaseDb } from "../../lib/firebase/client";
import { getCurrentUser } from "../../lib/utils/auth";
import type { UserRole } from "../../types";

type CaseStatus = "received" | "analysed" | "assigned" | "in_progress" | "resolved" | "closed";

type CaseRow = {
  id: string;
  category: string;
  department: string;
  status: CaseStatus;
  created_at?: any;
  resolved_at?: any;
};

type DeptAgg = {
  department: string;
  total: number;
  resolved: number;
  pending: number;
  avgHours: number | null;
  rate: number;
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

function resolutionColor(rate: number): string {
  if (rate > 80) return "text-emerald-700";
  if (rate >= 50) return "text-amber-700";
  return "text-red-700";
}

function downloadCsv(filename: string, rows: Record<string, string | number | null | undefined>[]) {
  const headers = Array.from(
    rows.reduce((set, r) => {
      Object.keys(r).forEach((k) => set.add(k));
      return set;
    }, new Set<string>()),
  );
  const escape = (v: any) => {
    const s = v == null ? "" : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => escape((r as any)[h])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function MLAPage() {
  const [roleOk, setRoleOk] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const me = await getCurrentUser();
        const role = me?.role as UserRole | undefined;
        if (!cancelled) setRoleOk(role === "mla" || role === "admin");
      } catch {
        if (!cancelled) setRoleOk(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const snap = await getDocs(collection(firebaseDb, "cases"));
        const rows = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            category: String(data.category ?? "General"),
            department: String(data.department ?? data.ai?.department ?? "General"),
            status: (data.status ?? "received") as CaseStatus,
            created_at: data.created_at ?? null,
            resolved_at: data.resolved_at ?? null,
          } satisfies CaseRow;
        });
        if (!cancelled) setCases(rows);
      } catch {
        if (!cancelled) setError("Failed to load MLA metrics.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const metrics = useMemo(() => {
    const total = cases.length;
    const resolved = cases.filter((c) => c.status === "resolved" || c.status === "closed").length;
    const open = cases.filter((c) => c.status !== "closed").length;
    const rate = total ? (resolved / total) * 100 : 0;

    const diffs: number[] = [];
    for (const c of cases) {
      const created = toDate(c.created_at);
      const resolvedAt = toDate(c.resolved_at);
      if (!created || !resolvedAt) continue;
      diffs.push((resolvedAt.getTime() - created.getTime()) / (60 * 60 * 1000));
    }
    const avg = diffs.length ? diffs.reduce((a, b) => a + b, 0) / diffs.length : null;

    return { total, resolved, open, rate, avg };
  }, [cases]);

  const deptTable = useMemo(() => {
    const map = new Map<string, { total: number; resolved: number; pending: number; hours: number[] }>();
    for (const c of cases) {
      const key = c.department || "General";
      const m = map.get(key) ?? { total: 0, resolved: 0, pending: 0, hours: [] };
      m.total += 1;
      const isResolved = c.status === "resolved" || c.status === "closed";
      if (isResolved) {
        m.resolved += 1;
        const created = toDate(c.created_at);
        const resolvedAt = toDate(c.resolved_at);
        if (created && resolvedAt) m.hours.push((resolvedAt.getTime() - created.getTime()) / (60 * 60 * 1000));
      } else {
        m.pending += 1;
      }
      map.set(key, m);
    }
    const rows: DeptAgg[] = Array.from(map.entries()).map(([department, v]) => {
      const avgHours = v.hours.length ? v.hours.reduce((a, b) => a + b, 0) / v.hours.length : null;
      const rate = v.total ? (v.resolved / v.total) * 100 : 0;
      return { department, total: v.total, resolved: v.resolved, pending: v.pending, avgHours, rate };
    });
    rows.sort((a, b) => b.total - a.total);
    return rows;
  }, [cases]);

  const last7Trend = useMemo(() => {
    const days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - (6 - i));
      return d;
    });
    const fmt = (d: Date) => d.toLocaleDateString(undefined, { weekday: "short" });
    return days.map((day) => {
      const end = new Date(day);
      end.setDate(end.getDate() + 1);
      const count = cases.filter((c) => {
        const created = toDate(c.created_at);
        if (!created) return false;
        return created >= day && created < end;
      }).length;
      return { day: fmt(day), cases: count };
    });
  }, [cases]);

  const categoryBreakdown = useMemo(() => {
    const keys = ["Water Supply", "Roads & Infrastructure", "Electricity", "Sanitation", "Tax & Finance", "General"];
    const label: Record<string, string> = {
      "Water Supply": "Water",
      "Roads & Infrastructure": "Roads",
      Electricity: "Electricity",
      Sanitation: "Sanitation",
      "Tax & Finance": "Tax",
      General: "General",
    };
    return keys.map((k) => ({ category: label[k] ?? k, count: cases.filter((c) => c.category === k).length }));
  }, [cases]);

  const doDownload = () => {
    const rows = deptTable.map((d) => ({
      Department: d.department,
      Total: d.total,
      Resolved: d.resolved,
      Pending: d.pending,
      "Avg Time (hrs)": d.avgHours == null ? "" : Math.round(d.avgHours),
      "Resolution Rate %": Math.round(d.rate),
    }));
    downloadCsv("p-crm-weekly-report.csv", rows);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="flex">
        <Sidebar />
        <div className="flex-1 min-w-0">
          <div className="sticky top-0 z-40">
            <Header title="Constituency Overview — Pune" />
          </div>

          <main className="px-4 md:px-6 py-6 space-y-6">
            {roleOk === false ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                You do not have access to the MLA dashboard.
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-[#1B2A4A]">Constituency Overview — Pune</h1>
              <button
                type="button"
                onClick={doDownload}
                className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8]"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Download Weekly Report
              </button>
            </div>

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            ) : null}

            {loading ? (
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm inline-flex items-center gap-2 text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Loading MLA metrics…
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="text-sm font-semibold text-slate-700">Total Cases</div>
                    <div className="mt-2 text-3xl font-bold text-[#1B2A4A]">{metrics.total}</div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="text-sm font-semibold text-slate-700">Resolution Rate</div>
                    <div className="mt-2 text-3xl font-bold text-[#1B2A4A]">{Math.round(metrics.rate)}%</div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="text-sm font-semibold text-slate-700">Avg Resolution Time</div>
                    <div className="mt-2 text-3xl font-bold text-[#1B2A4A]">
                      {metrics.avg == null ? "—" : `${Math.round(metrics.avg)}h`}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="text-sm font-semibold text-slate-700">Open Cases</div>
                    <div className="mt-2 text-3xl font-bold text-[#1B2A4A]">{metrics.open}</div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <div className="text-sm font-semibold text-slate-900">Department Performance</div>
                    <div className="text-xs text-slate-500">Resolution rate color-coded</div>
                  </div>
                  <div className="p-4 overflow-auto">
                    <table className="min-w-[840px] w-full text-sm">
                      <thead className="text-left text-slate-600">
                        <tr>
                          <th className="py-2">Department</th>
                          <th className="py-2">Total</th>
                          <th className="py-2">Resolved</th>
                          <th className="py-2">Pending</th>
                          <th className="py-2">Avg Time</th>
                          <th className="py-2">Resolution Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {deptTable.map((d) => (
                          <tr key={d.department}>
                            <td className="py-3 font-semibold text-slate-900">{d.department}</td>
                            <td className="py-3">{d.total}</td>
                            <td className="py-3">{d.resolved}</td>
                            <td className="py-3">{d.pending}</td>
                            <td className="py-3">{d.avgHours == null ? "—" : `${Math.round(d.avgHours)}h`}</td>
                            <td className={["py-3 font-semibold", resolutionColor(d.rate)].join(" ")}>
                              {Math.round(d.rate)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <div className="text-sm font-semibold text-slate-900">Weekly Trend</div>
                      <div className="text-xs text-slate-500">Cases submitted per day (last 7 days)</div>
                    </div>
                    <div className="p-4 h-[320px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={last7Trend} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                          <XAxis dataKey="day" stroke="#64748B" tick={{ fontSize: 12 }} />
                          <YAxis stroke="#64748B" tick={{ fontSize: 12 }} allowDecimals={false} />
                          <Tooltip contentStyle={{ borderRadius: 12, borderColor: "#E2E8F0" }} />
                          <Line type="monotone" dataKey="cases" stroke="#2563EB" strokeWidth={3} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <div className="text-sm font-semibold text-slate-900">Category Breakdown</div>
                      <div className="text-xs text-slate-500">Total cases by category</div>
                    </div>
                    <div className="p-4 h-[320px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryBreakdown} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                          <XAxis dataKey="category" stroke="#64748B" tick={{ fontSize: 12 }} />
                          <YAxis stroke="#64748B" tick={{ fontSize: 12 }} allowDecimals={false} />
                          <Tooltip contentStyle={{ borderRadius: 12, borderColor: "#E2E8F0" }} />
                          <Bar dataKey="count" fill="#2563EB" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

