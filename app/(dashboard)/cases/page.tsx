"use client";

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, Filter, Loader2 } from "lucide-react";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";


import { Header } from "@/components/layout/Header";
import { db } from "@/lib/firebase";
import { UrgencyBadge } from "@/components/shared/UrgencyBadge";

type CaseRow = {
  id: string;
  case_number: string;
  description: string;
  ward: string;
  category: string;
  status: string;
  assigned_to_name?: string | null;
  ai?: { urgency_score?: number } | null;
  priority?: { priority_score?: number } | null;
  updated_at_ms?: number | null;
};

function wardFromParam(p: string | null): string {
  if (!p) return "";
  const n = Number(p);
  if (Number.isFinite(n) && n >= 1 && n <= 20) return `Ward ${n}`;
  if (p.toLowerCase().startsWith("ward")) return p;
  return p;
}

function wardToParam(ward: string): string {
  const m = ward.match(/Ward\s+(\d+)/i);
  return m ? m[1]! : ward;
}

function openStatuses() {
  return ["received", "analysed", "assigned", "in_progress", "resolved"] as const;
}

function buildQuery(filters: { status: string; ward: string; category: string }, cursor?: QueryDocumentSnapshot<DocumentData>) {
  const casesCol = collection(db, "cases");
  const clauses: any[] = [];

  if (filters.status === "open") clauses.push(where("status", "in", [...openStatuses()]));
  else if (filters.status) clauses.push(where("status", "==", filters.status));

  if (filters.ward) clauses.push(where("ward", "==", filters.ward));
  if (filters.category) clauses.push(where("category", "==", filters.category));

  let q = query(casesCol, ...clauses, limit(100));
  if (cursor) q = query(casesCol, ...clauses, startAfter(cursor), limit(100));
  return q;
}

function docToRow(d: QueryDocumentSnapshot<DocumentData>): CaseRow {
  const data = d.data() as any;
  return {
    id: d.id,
    case_number: String(data.case_number ?? d.id),
    description: String(data.description ?? ""),
    ward: String(data.ward ?? ""),
    category: String(data.category ?? "General"),
    status: String(data.status ?? "received"),
    assigned_to_name: data.assigned_to_name ?? null,
    ai: data.ai ?? null,
    priority: data.priority ?? null,
    updated_at_ms: typeof data.updated_at_ms === "number" ? data.updated_at_ms : null,
  };
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    received: "bg-slate-100 text-slate-700",
    analysed: "bg-blue-50 text-blue-700",
    assigned: "bg-indigo-50 text-indigo-700",
    in_progress: "bg-amber-50 text-amber-800",
    resolved: "bg-emerald-50 text-emerald-800",
    closed: "bg-slate-200 text-slate-700",
  };
  return (
    <span className={["inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", map[status] ?? "bg-slate-100 text-slate-700"].join(" ")}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

function CasesContent() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [search, setSearch] = useState(params.get("q") ?? "");
  const [status, setStatus] = useState(params.get("status") ?? "open");
  const [ward, setWard] = useState(wardFromParam(params.get("ward")));
  const [category, setCategory] = useState(params.get("category") ?? "");

  const [rows, setRows] = useState<CaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cursorRef = useRef<QueryDocumentSnapshot<DocumentData> | undefined>(undefined);

  const applyUrl = (next: { q?: string; status?: string; ward?: string; category?: string }) => {
    const sp = new URLSearchParams(params.toString());
    if (next.q !== undefined) (next.q ? sp.set("q", next.q) : sp.delete("q"));
    if (next.status !== undefined) (next.status ? sp.set("status", next.status) : sp.delete("status"));
    if (next.ward !== undefined) (next.ward ? sp.set("ward", wardToParam(next.ward)) : sp.delete("ward"));
    if (next.category !== undefined) (next.category ? sp.set("category", next.category) : sp.delete("category"));
    router.replace(`${pathname}?${sp.toString()}`);
  };

  const filters = useMemo(() => ({ status, ward, category }), [status, ward, category]);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    cursorRef.current = undefined;
    try {
      const snap = await getDocs(buildQuery(filters));
      const nextRows = snap.docs.map(docToRow).sort((a, b) => (b.priority?.priority_score || 0) - (a.priority?.priority_score || 0));
      setRows(nextRows);
      cursorRef.current = snap.docs[snap.docs.length - 1];
      setHasMore(snap.size === 100);
    } catch {
      setError("Failed to load cases.");
      setRows([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.ward, filters.category]);

  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.case_number.toLowerCase().includes(q) || r.description.toLowerCase().includes(q));
  }, [rows, search]);

  const loadMore = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      const snap = await getDocs(buildQuery(filters, cursorRef.current));
      const nextRows = snap.docs.map(docToRow).sort((a, b) => (b.priority?.priority_score || 0) - (a.priority?.priority_score || 0));
      setRows((prev) => [...prev, ...nextRows].sort((a, b) => (b.priority?.priority_score || 0) - (a.priority?.priority_score || 0)));
      cursorRef.current = snap.docs[snap.docs.length - 1];
      setHasMore(snap.size === 100);
    } catch {
      setError("Failed to load more cases.");
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="flex-1 min-w-0">
          <div className="sticky top-0 z-40">
            <Header title="Cases" />
          </div>

          <main className="px-4 md:px-6 py-6 space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
              <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#1B2A4A]">
                  <Filter className="h-4 w-4" aria-hidden="true" />
                  Filters
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                    <input
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        applyUrl({ q: e.target.value });
                      }}
                      placeholder="Search case number or description..."
                      className="h-11 w-full sm:w-72 rounded-lg border border-slate-300 pl-9 pr-3 text-base focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB]"
                    />
                  </div>

                  <select
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value);
                      applyUrl({ status: e.target.value });
                    }}
                    className="h-11 rounded-lg border border-slate-300 px-3 text-base focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB]"
                  >
                    <option value="open">Open</option>
                    <option value="received">Received</option>
                    <option value="analysed">Analysed</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>

                  <select
                    value={ward}
                    onChange={(e) => {
                      setWard(e.target.value);
                      applyUrl({ ward: e.target.value });
                    }}
                    className="h-11 rounded-lg border border-slate-300 px-3 text-base focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB]"
                  >
                    <option value="">All wards</option>
                    {Array.from({ length: 20 }).map((_, i) => (
                      <option key={i} value={`Ward ${i + 1}`}>
                        Ward {i + 1}
                      </option>
                    ))}
                  </select>

                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      applyUrl({ category: e.target.value });
                    }}
                    className="h-11 rounded-lg border border-slate-300 px-3 text-base focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB]"
                  >
                    <option value="">All categories</option>
                    <option value="Water Supply">Water Supply</option>
                    <option value="Roads & Infrastructure">Roads & Infrastructure</option>
                    <option value="Electricity">Electricity</option>
                    <option value="Sanitation">Sanitation</option>
                    <option value="Tax & Finance">Tax & Finance</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>
            </div>

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            ) : null}

            <div className="space-y-3">
              {loading ? (
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Loading cases…
                  </div>
                </div>
              ) : displayed.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm text-sm text-slate-600">
                  No cases match your filters.
                </div>
              ) : (
                displayed.map((c) => (
                  <Link
                    key={c.id}
                    href={`/cases/${c.id}`}
                    className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:bg-slate-50"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3 justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-sm font-semibold text-slate-900">{c.case_number}</div>
                          <StatusPill status={c.status} />
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                            {c.ward}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                            {c.category}
                          </span>
                        </div>
                        <div className="mt-2 text-sm text-slate-700 line-clamp-2">{c.description}</div>
                        <div className="mt-2 text-xs text-slate-500">
                          Priority score:{" "}
                          <span className="font-semibold text-[#1B2A4A]">
                            {Math.round(Number(c.priority?.priority_score ?? 0))}
                          </span>
                          {c.assigned_to_name ? (
                            <>
                              {" "}
                              • Assigned to <span className="font-semibold text-slate-700">{c.assigned_to_name}</span>
                            </>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <UrgencyBadge urgencyScore={c.ai?.urgency_score ?? 50} />
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>

            {!loading && hasMore ? (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={() => void loadMore()}
                  disabled={loadingMore}
                  className="inline-flex items-center justify-center rounded-lg bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1d4ed8] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loadingMore ? "Loading…" : "Load more"}
                </button>
              </div>
            ) : null}
          </main>
      </div>
  );
}

export default function CasesPage() {
  return (
    <Suspense fallback={null}>
      <CasesContent />
    </Suspense>
  );
}

