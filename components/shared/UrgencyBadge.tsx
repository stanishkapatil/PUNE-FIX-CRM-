"use client";

import type { ReactNode } from "react";
import { AlertTriangle, ArrowDown, ArrowUp, Minus } from "lucide-react";

type UrgencyLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type UrgencyBadgeProps = {
  urgencyScore?: number;
  urgencyLevel?: UrgencyLevel;
  className?: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function levelFromScore(score: number): UrgencyLevel {
  const s = clamp(Math.round(score), 0, 100);
  if (s >= 85) return "CRITICAL";
  if (s >= 65) return "HIGH";
  if (s >= 40) return "MEDIUM";
  return "LOW";
}

function configFor(level: UrgencyLevel): {
  label: UrgencyLevel;
  icon: ReactNode;
  className: string;
} {
  switch (level) {
    case "CRITICAL":
      return {
        label: "CRITICAL",
        icon: <AlertTriangle className="h-4 w-4" aria-hidden="true" />,
        className: "bg-[#DC2626] text-white",
      };
    case "HIGH":
      return {
        label: "HIGH",
        icon: <ArrowUp className="h-4 w-4" aria-hidden="true" />,
        className: "bg-[#D97706] text-white",
      };
    case "MEDIUM":
      return {
        label: "MEDIUM",
        icon: <Minus className="h-4 w-4" aria-hidden="true" />,
        className: "bg-amber-200 text-amber-900",
      };
    case "LOW":
    default:
      return {
        label: "LOW",
        icon: <ArrowDown className="h-4 w-4" aria-hidden="true" />,
        className: "bg-[#16A34A] text-white",
      };
  }
}

export function UrgencyBadge(props: UrgencyBadgeProps) {
  const level: UrgencyLevel =
    props.urgencyLevel ?? (typeof props.urgencyScore === "number" ? levelFromScore(props.urgencyScore) : "LOW");

  const cfg = configFor(level);

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide",
        cfg.className,
        props.className ?? "",
      ].join(" ")}
      role="status"
      aria-label={`Urgency ${cfg.label}`}
    >
      {cfg.icon}
      <span>{cfg.label}</span>
    </span>
  );
}

