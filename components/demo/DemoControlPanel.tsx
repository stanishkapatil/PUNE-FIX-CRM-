"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FlaskConical, RefreshCcw, Siren, Users, ChevronUp, ChevronDown, ExternalLink } from "lucide-react";

type Role = "staff" | "supervisor" | "mla";

function nextRole(r: Role): Role {
  if (r === "staff") return "supervisor";
  if (r === "supervisor") return "mla";
  return "staff";
}

export function DemoControlPanel() {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<Role>("staff");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const header = useMemo(() => (open ? "Demo Control Panel" : "Demo Controls"), [open]);

  const callDemo = async (path: string) => {
    setBusy(path);
    setError(null);
    try {
      const res = await fetch(path, { method: "POST", headers: { "x-demo-token": "PCRM2026" } });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || "Demo action failed");
      return json;
    } catch (e: any) {
      setError(e?.message || "Demo action failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
      className="fixed bottom-4 right-4 z-50"
      style={{ touchAction: "none" }}
    >
      <div className="w-[280px] rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full px-4 py-3 flex items-center justify-between bg-[#1B2A4A] text-white"
          aria-label="Toggle demo control panel"
        >
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4" aria-hidden="true" />
            <span className="text-sm font-semibold">{header}</span>
          </div>
          {open ? <ChevronDown className="h-4 w-4" aria-hidden="true" /> : <ChevronUp className="h-4 w-4" aria-hidden="true" />}
        </button>

        {open ? (
          <div className="p-4 space-y-3">
            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
            ) : null}

            <button
              type="button"
              onClick={() => window.open("/submit", "_blank", "noopener,noreferrer")}
              className="w-full inline-flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              <span className="inline-flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-slate-500" aria-hidden="true" />
                Submit Test Complaint
              </span>
            </button>

            <button
              type="button"
              onClick={() => void callDemo("/api/v1/demo/trigger-cascade")}
              disabled={busy != null}
              className="w-full inline-flex items-center justify-between rounded-lg bg-[#DC2626] px-3 py-2 text-sm font-semibold text-white hover:bg-[#b91c1c] disabled:opacity-60"
            >
              <span className="inline-flex items-center gap-2">
                <Siren className="h-4 w-4" aria-hidden="true" />
                Trigger Cascade Alert
              </span>
              {busy === "/api/v1/demo/trigger-cascade" ? "…" : ""}
            </button>

            <button
              type="button"
              onClick={() => void callDemo("/api/v1/demo/reset")}
              disabled={busy != null}
              className="w-full inline-flex items-center justify-between rounded-lg bg-[#2563EB] px-3 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8] disabled:opacity-60"
            >
              <span className="inline-flex items-center gap-2">
                <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                Reset Demo Data
              </span>
              {busy === "/api/v1/demo/reset" ? "…" : ""}
            </button>

            <button
              type="button"
              onClick={() => setRole((r) => nextRole(r))}
              className="w-full inline-flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              <span className="inline-flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-500" aria-hidden="true" />
                Switch Role
              </span>
              <span className="text-xs font-semibold uppercase text-slate-600">{role}</span>
            </button>

            <div className="text-[11px] text-slate-500">
              Demo actions are token-protected and only available in demo mode.
            </div>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}

