export default function Home() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#1B2A4A] text-white flex items-center justify-center font-semibold">
              P
            </div>
            <div>
              <div className="text-lg font-semibold text-[#1B2A4A] leading-none">P-CRM</div>
              <div className="text-xs text-slate-500">Smart grievance management</div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <a
              href="/submit"
              className="inline-flex items-center justify-center rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]"
            >
              Submit a Complaint
            </a>
            <a
              href="/track"
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Track Complaint
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#1B2A4A]">
                Your Voice, Our Priority
              </h1>
              <p className="mt-4 text-base sm:text-lg text-slate-600">
                Smart grievance management for Pune citizens
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <a
                  href="/submit"
                  className="h-11 sm:h-12 px-5 rounded-lg bg-[#2563EB] text-white text-base font-semibold inline-flex items-center justify-center hover:bg-[#1d4ed8]"
                >
                  Submit a Complaint
                </a>
                <a
                  href="/track"
                  className="h-11 sm:h-12 px-5 rounded-lg border border-slate-200 bg-white text-slate-800 text-base font-semibold inline-flex items-center justify-center hover:bg-slate-50"
                >
                  Track Your Complaint
                </a>
              </div>

              <div className="mt-8 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
                <div className="text-sm font-semibold text-[#1B2A4A]">How it works</div>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                    <div className="text-xs font-semibold text-slate-700">Step 1</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">Submit</div>
                    <div className="mt-1 text-xs text-slate-600">Share details and ward.</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                    <div className="text-xs font-semibold text-slate-700">Step 2</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">AI Analyses</div>
                    <div className="mt-1 text-xs text-slate-600">Classifies urgency and department.</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                    <div className="text-xs font-semibold text-slate-700">Step 3</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">Gets Resolved</div>
                    <div className="mt-1 text-xs text-slate-600">Assigned and tracked to closure.</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold text-[#1B2A4A]">City impact at a glance</div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-lg bg-[#F8FAFC] border border-slate-200 p-4">
                  <div className="text-2xl font-bold text-[#1B2A4A]">20,000+</div>
                  <div className="mt-1 text-xs text-slate-600">complaints resolved</div>
                </div>
                <div className="rounded-lg bg-[#F8FAFC] border border-slate-200 p-4">
                  <div className="text-2xl font-bold text-[#1B2A4A]">72hr</div>
                  <div className="mt-1 text-xs text-slate-600">average resolution</div>
                </div>
                <div className="rounded-lg bg-[#F8FAFC] border border-slate-200 p-4">
                  <div className="text-2xl font-bold text-[#1B2A4A]">15</div>
                  <div className="mt-1 text-xs text-slate-600">departments</div>
                </div>
              </div>

              <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                Get instant tracking and real-time updates without visiting an office.
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-600 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <div className="font-semibold text-[#1B2A4A]">P-CRM v1.0</div>
          <div>JSPM JSCOE Innovation Challenge 2026</div>
        </div>
      </footer>
    </div>
  );
}
