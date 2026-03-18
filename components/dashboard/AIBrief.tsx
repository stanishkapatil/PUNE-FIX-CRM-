"use client";

import Link from "next/link";
import { Sparkles, RefreshCw, AlertTriangle } from "lucide-react";

import { AIBriefSkeleton } from "../shared/LoadingStates";

type Props = {
  brief: string;
  topPriorityCaseIds: string[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void | Promise<void>;
};

export function AIBrief({ brief, topPriorityCaseIds, loading, error, onRefresh }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="px-4 sm:px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
            <Sparkles className="h-5 w-5 text-[#2563EB]" aria-hidden="true" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">AI Situation Brief</div>
            <div className="text-xs text-slate-500">3-sentence summary for quick triage</div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void onRefresh()}
          className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-3 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Refresh AI Brief
        </button>
      </div>

      <div className="p-4 sm:p-5">
        {loading ? (
          <AIBriefSkeleton />
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5" aria-hidden="true" />
            <div>{error}</div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed">{brief || "No brief available yet."}</p>

            <div>
              <div className="text-xs font-semibold text-slate-700">Top priority cases</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {topPriorityCaseIds.slice(0, 3).map((id) => (
                  <Link
                    key={id}
                    href={`/cases/${id}`}
                    className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#1B2A4A] hover:bg-slate-50"
                  >
                    {id}
                  </Link>
                ))}
                {topPriorityCaseIds.length === 0 ? (
                  <span className="text-xs text-slate-500">No cases ranked yet.</span>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

