"use client";

import React from "react";

interface WardMapProps {
  height?: number;
}

export function WardMap({ height = 340 }: WardMapProps) {
  return (
    <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1px solid #E2E8F0" }}>
      <iframe
        title="Pune Ward Map — OpenStreetMap"
        src="https://www.openstreetmap.org/export/embed.html?bbox=73.74%2C18.42%2C73.96%2C18.63&layer=mapnik"
        style={{
          width: "100%",
          height,
          border: "none",
          display: "block",
        }}
        loading="lazy"
      />
      {/* Map overlay: live indicator */}
      <div style={{
        position: "absolute",
        top: 10,
        left: 10,
        background: "rgba(255,255,255,0.95)",
        borderRadius: 8,
        padding: "6px 10px",
        fontSize: 11,
        fontWeight: 600,
        color: "#1B2A4A",
        boxShadow: "0 1px 6px rgba(0,0,0,0.15)",
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#16A34A", display: "inline-block" }} />
        Live · Pune Municipal Area
      </div>
    </div>
  );
}
