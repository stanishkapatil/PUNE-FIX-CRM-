"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "../components/Navbar";

export default function HomePage() {
  const router = useRouter();
  const [trackId, setTrackId] = useState("");

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackId.trim()) {
      router.push(`/track/${trackId.trim()}`);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        minHeight: "100vh",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: "#1B2A4A",
      }}
    >
      <Navbar />

      <main
        style={{
          width: "100%",
          maxWidth: "960px",
          margin: "0 auto",
          padding: "0 24px",
        }}
      >
        <section
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            border: "1px solid #E2E8F0",
            padding: "48px",
            marginTop: "32px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "32px",
          }}
        >
          <div style={{ flex: "1 1 400px" }}>
            <div
              style={{
                backgroundColor: "#EFF6FF",
                color: "#2563EB",
                fontSize: "12px",
                padding: "4px 12px",
                borderRadius: "20px",
                display: "inline-block",
                fontWeight: "bold",
                marginBottom: "16px",
              }}
            >
              ✦ AI-POWERED CITY MANAGEMENT
            </div>
            
            <h1
              style={{
                fontSize: "36px",
                fontWeight: "900",
                color: "#1B2A4A",
                margin: "0",
                lineHeight: "1.2",
              }}
            >
              Your Voice Matters.
            </h1>
            <h2
              style={{
                fontSize: "36px",
                fontWeight: "bold",
                color: "#2563EB",
                margin: "0 0 16px 0",
                lineHeight: "1.2",
              }}
            >
              Help us improve your city.
            </h2>
            
            <p
              style={{
                fontSize: "14px",
                color: "#64748B",
                maxWidth: "380px",
                margin: "0",
                lineHeight: "1.6",
              }}
            >
              Submit concerns directly to city officials. Our AI-driven system ensures your
              complaints are categorized and routed to the right department instantly for 3x faster
              resolution.
            </p>

            <div style={{ display: "flex", gap: "16px", marginTop: "32px", flexWrap: "wrap" }}>
              <Link
                href="/complaints/new"
                style={{
                  backgroundColor: "#2563EB",
                  color: "#FFFFFF",
                  height: "40px",
                  padding: "0 16px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "bold",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                File a Complaint →
              </Link>
              
              <form onSubmit={handleTrackSubmit} style={{ display: "flex" }}>
                <input
                  type="text"
                  placeholder="Enter Case ID..."
                  value={trackId}
                  onChange={(e) => setTrackId(e.target.value)}
                  style={{
                    height: "40px",
                    border: "1px solid #1B2A4A",
                    borderRight: "none",
                    borderRadius: "8px 0 0 8px",
                    padding: "0 12px",
                    fontSize: "14px",
                    outline: "none"
                  }}
                />
                <button
                  type="submit"
                  style={{
                    backgroundColor: "#FFFFFF",
                    color: "#1B2A4A",
                    height: "40px",
                    padding: "0 16px",
                    borderRadius: "0 8px 8px 0",
                    border: "1px solid #1B2A4A",
                    fontSize: "14px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  Track My Ticket
                </button>
              </form>
            </div>
          </div>

          <div
            style={{
              width: "280px",
              height: "180px",
              borderRadius: "12px",
              backgroundImage: "url('https://images.unsplash.com/photo-1486325212027-8081e485255e?w=560')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        </section>
      </main>
    </div>
  );
}
