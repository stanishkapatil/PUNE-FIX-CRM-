import React from "react";

export type UrgencyType = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export function UrgencyBadge({ urgency }: { urgency: UrgencyType }) {
  let bg = "#F8FAFC";
  let color = "#64748B";
  let border = "1px solid #E2E8F0";
  let icon = "🟢";

  switch (urgency) {
    case "CRITICAL":
      bg = "#FEF2F2";
      color = "#DC2626";
      border = "1px solid #DC2626";
      icon = "🚨";
      break;
    case "HIGH":
      bg = "#FFFBEB"; // light amber
      color = "#D97706";
      border = "1px solid #D97706";
      icon = "❗";
      break;
    case "MEDIUM":
      bg = "#FEF3C7"; // lighter amber/yellow
      color = "#D97706";
      border = "1px solid #D97706";
      icon = "⚠️";
      break;
    case "LOW":
      bg = "#F0FDF4"; // light green
      color = "#16A34A";
      border = "1px solid #16A34A";
      icon = "✅";
      break;
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        backgroundColor: bg,
        color: color,
        border: border,
        borderRadius: "6px",
        padding: "4px 8px",
        fontSize: "12px",
        fontWeight: "bold",
      }}
    >
      <span>{icon}</span> {urgency}
    </span>
  );
}
