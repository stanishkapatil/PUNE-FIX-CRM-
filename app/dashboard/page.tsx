"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { WifiOff } from "lucide-react";
import { collection, onSnapshot, query, where } from "firebase/firestore";

import { Sidebar } from "../../components/layout/Sidebar";
import { Header } from "../../components/layout/Header";
import { AIBrief } from "../../components/dashboard/AIBrief";
import { KPICards } from "../../components/dashboard/KPICards";
import { PriorityQueue } from "../../components/dashboard/PriorityQueue";
import { CategoryChart } from "../../components/dashboard/CategoryChart";
import { CascadeAlert } from "../../components/dashboard/CascadeAlert";
import { firebaseDb } from "../../lib/firebase/client";

export default function DashboardPage() {
  const [brief, setBrief] = useState<string>("");
  const [topPriorityCaseIds, setTopPriorityCaseIds] = useState<string[]>([]);
  const [briefLoading, setBriefLoading] = useState(true);
  const [briefError, setBriefError] = useState<string | null>(null);

  const [livePaused, setLivePaused] = useState(false);

  const fetchBrief = useCallback(async () => {
    setBriefLoading(true);
    setBriefError(null);
    try {
      const res = await fetch("/api/v1/ai/brief", { method: "POST" });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Failed to fetch AI brief");
      setBrief(String(json?.data?.brief ?? ""));
      setTopPriorityCaseIds(Array.isArray(json?.data?.topPriorityCaseIds) ? json.data.topPriorityCaseIds : []);
    } catch (e: any) {
      setBriefError(e?.message || "Failed to fetch AI brief");
    } finally {
      setBriefLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBrief();
  }, [fetchBrief]);

  // Firestore realtime connection health for alerts (page-level requirement)
  useEffect(() => {
    const q = query(collection(firebaseDb, "alerts"), where("is_active", "==", true));
    const unsub = onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snap) => {
        // fromCache indicates offline / degraded realtime
        setLivePaused(snap.metadata.fromCache);
      },
      () => {
        setLivePaused(true);
      },
    );
    return () => unsub();
  }, []);

  const pausedBadge = useMemo(() => {
    if (!livePaused) return null;
    return (
      <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-800">
        <WifiOff className="h-4 w-4" aria-hidden="true" />
        Live updates paused
      </div>
    );
  }, [livePaused]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="flex">
        <Sidebar />

        <div className="flex-1 min-w-0">
          <div className="sticky top-0 z-40">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Header title="Dashboard" />
              </div>
              <div className="pr-4 md:pr-6">{pausedBadge}</div>
            </div>
          </div>

          <main className="px-4 md:px-6 py-6 space-y-6">
            <CascadeAlert />

            <AIBrief
              brief={brief}
              topPriorityCaseIds={topPriorityCaseIds}
              loading={briefLoading}
              error={briefError}
              onRefresh={fetchBrief}
            />

            <KPICards />

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3">
                <PriorityQueue />
              </div>
              <div className="lg:col-span-2">
                <CategoryChart />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

