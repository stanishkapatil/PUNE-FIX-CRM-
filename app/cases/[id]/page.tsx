"use client";

import { Sidebar } from "../../../components/layout/Sidebar";
import { Header } from "../../../components/layout/Header";
import { CaseDetail } from "../../../components/cases/CaseDetail";

export default function CaseDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="flex">
        <Sidebar />

        <div className="flex-1 min-w-0">
          <div className="sticky top-0 z-40">
            <Header title="Case Detail" />
          </div>

          <main className="px-4 md:px-6 py-6">
            <CaseDetail caseId={params.id} />
          </main>
        </div>
      </div>
    </div>
  );
}

