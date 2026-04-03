"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, BellRing, WifiOff } from "lucide-react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";

import { db } from "@/lib/firebase";

type AlertDoc = {
  id: string;
  ward: string;
  category: string;
  case_count: number;
  severity: "MEDIUM" | "HIGH" | "CRITICAL" | "LOW" | string;
  created_at?: any;
  is_active: boolean;
};

function severityStyle(sev: string): { badge: string; icon: JSX.Element } {
  if (sev === "CRITICAL") {
    return {
      badge: "bg-[#DC2626] text-white",
      icon: <AlertTriangle className="h-5 w-5 text-white" aria-hidden="true" />,
    };
  }
  if (sev === "HIGH") {
    return {
      badge: "bg-[#D97706] text-white",
      icon: <BellRing className="h-5 w-5 text-white" aria-hidden="true" />,
    };
  }
  return {
    badge: "bg-amber-200 text-amber-900",
    icon: <AlertTriangle className="h-5 w-5 text-amber-900" aria-hidden="true" />,
  };
}

function playCriticalPing() {
  try {
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 880;
    g.gain.value = 0.0001;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    const now = ctx.currentTime;
    g.gain.exponentialRampToValueAtTime(0.05, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    o.stop(now + 0.25);
    o.onended = () => ctx.close();
  } catch {
    // ignore
  }
}

export function CascadeAlert() {
  const [alerts, setAlerts] = useState<AlertDoc[]>([]);
  const [paused, setPaused] = useState(false);
  const dismissedRef = useRef<Set<string>>(new Set());
  const lastSeenRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const q = query(
      collection(db, "alerts"),
      where("is_active", "==", true),
      orderBy("created_at", "desc"),
    );

    const unsub = onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snap) => {
        setPaused(snap.metadata.fromCache);
        const next = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as AlertDoc[];
        setAlerts(next);

        for (const a of next) {
          if (!lastSeenRef.current.has(a.id)) {
            lastSeenRef.current.add(a.id);
            if (a.severity === "CRITICAL") playCriticalPing();
          }
        }
      },
      () => {
        setPaused(true);
      },
    );

    return () => unsub();
  }, []);

  const visible = useMemo(() => alerts.filter((a) => !dismissedRef.current.has(a.id)).slice(0, 1), [alerts]);

  const banner = visible[0];
  if (!banner && !paused) return null;

  return (
    <div className="relative">
      {paused ? (
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-800">
          <WifiOff className="h-4 w-4" aria-hidden="true" />
          Live updates paused
        </div>
      ) : null}

      <AnimatePresence>
        {banner ? (
          <motion.div
            key={banner.id}
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="fixed left-3 right-3 bottom-3 md:left-[calc(18rem+24px)] md:right-6 z-50"
          >
            <div className="rounded-xl bg-[#DC2626] text-white shadow-lg border border-white/10 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/15">
                    <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Cascade Alert</div>
                    <div className="mt-1 text-sm text-white/90">
                      {banner.case_count} cases in <span className="font-semibold">{banner.ward}</span> for{" "}
                      <span className="font-semibold">{banner.category}</span>
                    </div>
                    <div className="mt-2">
                      {(() => {
                        const s = severityStyle(String(banner.severity));
                        return (
                          <span className={["inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold", s.badge].join(" ")}>
                            {s.icon}
                            {String(banner.severity)}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <a
                    href={`/cases?ward=${encodeURIComponent(banner.ward)}&category=${encodeURIComponent(banner.category)}`}
                    className="inline-flex items-center justify-center rounded-lg bg-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/20"
                  >
                    View Cases
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      dismissedRef.current.add(banner.id);
                      setAlerts((a) => [...a]); // trigger rerender
                    }}
                    className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#1B2A4A] hover:bg-slate-100"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

