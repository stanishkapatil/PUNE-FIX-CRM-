"use client";

import { useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Sidebar } from "../../components/layout/Sidebar";
import { Header } from "../../components/layout/Header";
import { AIBrief } from "../../components/dashboard/AIBrief";
import { KPICards } from "../../components/dashboard/KPICards";
import { PriorityQueue } from "../../components/dashboard/PriorityQueue";
import { CategoryChart } from "../../components/dashboard/CategoryChart";
import { CascadeAlert } from "../../components/dashboard/CascadeAlert";
import { DemoControlPanel } from "../../components/demo/DemoControlPanel";

function DemoContent() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");

  useEffect(() => {
    if (token !== "PCRM2026") {
      router.replace("/login");
    }
  }, [router, token]);

  const ok = token === "PCRM2026";

  // Reuse dashboard components; brief refresh is handled by local fetch here.
  const briefState = useMemo(() => ({ brief: "", topPriorityCaseIds: [] as string[] }), []);

  if (!ok) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="fixed top-3 right-3 z-50">
        <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
          DEMO MODE
        </span>
      </div>

      <div className="flex">
        <Sidebar />

        <div className="flex-1 min-w-0">
          <div className="sticky top-0 z-40">
            <Header title="Dashboard (Demo)" />
          </div>

          <main className="px-4 md:px-6 py-6 space-y-6">
            <CascadeAlert />

            <AIBrief
              brief={briefState.brief}
              topPriorityCaseIds={briefState.topPriorityCaseIds}
              loading={false}
              error={null}
              onRefresh={() => router.refresh()}
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

      <DemoControlPanel />
    </div>
  );
}

export default function DemoPage() {
  return (
    <Suspense fallback={null}>
      <DemoContent />
    </Suspense>
  );
}

