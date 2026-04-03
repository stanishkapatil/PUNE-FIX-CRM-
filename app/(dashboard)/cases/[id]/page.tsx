"use client";

import { Header } from "@/components/layout/Header";
import { CaseDetail } from "@/components/cases/CaseDetail";

import { use } from "react";

export default function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <div className="flex-1 min-w-0">
      <div className="sticky top-0 z-40">
        <Header title="Case Detail" />
      </div>

      <main className="px-4 md:px-6 py-6">
        <CaseDetail caseId={id} />
      </main>
    </div>
  );
}

