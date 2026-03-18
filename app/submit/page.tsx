"use client";

import { ComplaintForm } from "../../components/citizen/ComplaintForm";

export default function SubmitPage() {
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
              <div className="text-xs text-slate-500">Citizen Complaint</div>
            </div>
          </a>
          <a
            href="/track"
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Track
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1B2A4A]">Submit a Complaint</h1>
        <p className="mt-2 text-base text-slate-600">
          Share your issue in detail. You’ll get a tracking link immediately.
        </p>

        <div className="mt-6">
          <ComplaintForm />
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-6 text-sm text-slate-600">
          P-CRM v1.0 — JSPM JSCOE Innovation Challenge 2026
        </div>
      </footer>
    </div>
  );
}

