"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TrackLandingPage() {
  const [trackingId, setTrackingId] = useState("");
  const router = useRouter();

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingId.trim()) {
      router.push(`/track/${trackingId.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
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
            href="/complaints/new"
            className="inline-flex items-center justify-center rounded-lg bg-[#2563EB] px-3 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]"
          >
            Submit New Request
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-16 sm:py-24">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Track Your Case</h1>
          <p className="mt-2 text-slate-600 font-medium">
            Enter your case tracking ID to see its current status and updates.
          </p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
          <form onSubmit={handleTrack} className="flex flex-col gap-4">
            <div>
              <label htmlFor="trackingId" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Tracking ID
              </label>
              <input
                autoFocus
                type="text"
                id="trackingId"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                placeholder="e.g. jf8a6b32"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 transition-all font-medium placeholder:font-normal"
                required
              />
            </div>
            <button
              type="submit"
              className="mt-2 w-full rounded-xl bg-[#1B2A4A] py-3 text-sm font-semibold text-white transition-all hover:bg-slate-800"
            >
              Track Status
            </button>
          </form>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white mt-auto sticky top-[100vh]">
        <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-slate-600 text-center">
          P-CRM v1.0 — Innovation Challenge 2026
        </div>
      </footer>
    </div>
  );
}
