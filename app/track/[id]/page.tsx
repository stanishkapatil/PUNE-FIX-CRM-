"use client";

import { CaseTracker } from "../../../components/citizen/CaseTracker";

import { use } from "react";

export default function TrackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#1B2A4A] text-white flex items-center justify-center font-semibold">
              P
            </div>
            <div>
              <div className="text-base font-semibold text-[#1B2A4A] leading-none">P-CRM</div>
              <div className="text-xs text-slate-500">Track Complaint</div>
            </div>
          </a>
          <a
            href="/submit"
            className="inline-flex items-center justify-center rounded-lg bg-[#2563EB] px-3 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]"
          >
            Submit
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
        <CaseTracker identifier={id} />
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-6 text-sm text-slate-600">
          P-CRM v1.0 — JSPM JSCOE Innovation Challenge 2026
        </div>
      </footer>
    </div>
  );
}

