"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const faqs = [
  {
    q: "Do I need to create an account to file a complaint?",
    a: "No account needed. You only require your mobile number. Submit your complaint in under 60 seconds — no registration, no passwords.",
  },
  {
    q: "How will I know my complaint was received?",
    a: "You receive an instant SMS confirmation with your unique case number and a direct tracking link the moment your complaint is submitted.",
  },
  {
    q: "How long does it take to resolve a complaint?",
    a: "SLA timelines by category: Water Supply — 72 hrs, Electricity — 48 hrs, Roads — 96 hrs, Sanitation — 72 hrs, Tax & Finance — 120 hrs.",
  },
  {
    q: "Can I track my complaint status?",
    a: "Yes. Visit /track and enter your case number at any time — no login required. You'll see a full real-time status timeline.",
  },
  {
    q: "What happens after I submit?",
    a: "Our AI classifies your complaint in under 3 seconds, assigns it to the correct department, and notifies the officer in charge automatically.",
  },
  {
    q: "What if my complaint is not resolved on time?",
    a: "The system automatically alerts supervisors before SLA breach. Escalation is fully automatic — you don't need to follow up manually.",
  },
  {
    q: "Can I attach a photo as evidence?",
    a: "Yes. You can upload a photo while filing your complaint. The image is stored securely and visible to the assigned officer.",
  },
  {
    q: "How do I rate my experience after resolution?",
    a: "Once your case is resolved, you receive an SMS with a link to rate the service 1–5 stars. Your feedback directly influences officer performance scores.",
  },
];

export default function FAQPage() {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#F8FAFC",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {/* NAVBAR */}
      <header style={{
        height: 60,
        backgroundColor: "#FFFFFF",
        borderBottom: "1px solid #E2E8F0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
      }}>
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, background: "#1B2A4A",
            borderRadius: 8, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 16,
          }}>🏛️</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1B2A4A" }}>P-CRM</div>
            <div style={{ fontSize: 10, color: "#94A3B8", marginTop: -2 }}>Smart Public Governance</div>
          </div>
        </Link>
        <nav style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <Link href="/" style={{ textDecoration: "none", fontSize: 14, color: "#64748B" }}>Home</Link>
          <Link href="/faq" style={{ textDecoration: "none", fontSize: 14, color: "#1B2A4A", fontWeight: 600 }}>FAQ</Link>
          <Link href="/track" style={{ textDecoration: "none", fontSize: 14, color: "#64748B" }}>Track Case</Link>
          <button
            onClick={() => router.push("/complaints/new")}
            style={{
              background: "#2563EB", color: "#FFF",
              border: "none", borderRadius: 8,
              padding: "8px 18px", fontSize: 13,
              fontWeight: 600, cursor: "pointer",
            }}
          >
            File a Complaint
          </button>
        </nav>
      </header>

      {/* HERO */}
      <div style={{
        background: "linear-gradient(135deg, #1B2A4A 0%, #2563EB 100%)",
        padding: "60px 32px",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>💬</div>
        <h1 style={{ margin: "0 0 12px", fontSize: 32, fontWeight: 800, color: "#FFFFFF" }}>
          Frequently Asked Questions
        </h1>
        <p style={{ margin: 0, fontSize: 16, color: "rgba(255,255,255,0.8)", maxWidth: 500, marginLeft: "auto", marginRight: "auto" }}>
          Everything you need to know about filing and tracking your grievance with P-CRM.
        </p>
      </div>

      {/* FAQ LIST */}
      <div style={{ maxWidth: 760, margin: "48px auto", padding: "0 24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {faqs.map((faq, i) => (
            <div
              key={i}
              style={{
                background: "#FFFFFF",
                borderRadius: 12,
                border: `1px solid ${openIndex === i ? "#BFDBFE" : "#E2E8F0"}`,
                overflow: "hidden",
                boxShadow: openIndex === i ? "0 2px 12px rgba(37,99,235,0.08)" : "0 1px 3px rgba(0,0,0,0.04)",
                transition: "all 0.2s ease",
              }}
            >
              {/* Question row */}
              <button
                onClick={() => toggle(i)}
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "18px 24px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  gap: 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: openIndex === i ? "#EFF6FF" : "#F8FAFC",
                    color: openIndex === i ? "#2563EB" : "#94A3B8",
                    display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 12,
                    fontWeight: 700, flexShrink: 0,
                  }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 600, color: "#1B2A4A", lineHeight: 1.4 }}>
                    {faq.q}
                  </span>
                </div>
                <span style={{
                  fontSize: 18, color: openIndex === i ? "#2563EB" : "#94A3B8",
                  flexShrink: 0, transition: "transform 0.2s",
                  display: "inline-block",
                  transform: openIndex === i ? "rotate(180deg)" : "rotate(0deg)",
                }}>
                  ›
                </span>
              </button>

              {/* Answer */}
              {openIndex === i && (
                <div style={{
                  padding: "0 24px 18px 64px",
                  fontSize: 14,
                  color: "#64748B",
                  lineHeight: 1.7,
                  borderTop: "1px solid #EFF6FF",
                  paddingTop: 14,
                }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{
          marginTop: 48,
          background: "linear-gradient(135deg, #1B2A4A, #2563EB)",
          borderRadius: 16,
          padding: "32px 40px",
          textAlign: "center",
          color: "#FFFFFF",
        }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>📝</div>
          <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 700 }}>
            Ready to file your complaint?
          </h2>
          <p style={{ margin: "0 0 24px", fontSize: 14, color: "rgba(255,255,255,0.8)" }}>
            Takes less than 60 seconds. No account required.
          </p>
          <button
            onClick={() => router.push("/complaints/new")}
            style={{
              background: "#FFFFFF",
              color: "#1B2A4A",
              border: "none",
              borderRadius: 10,
              padding: "12px 28px",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            File a Complaint →
          </button>
        </div>

        <p style={{ textAlign: "center", marginTop: 32, fontSize: 13, color: "#94A3B8" }}>
          Still have questions?{" "}
          <span
            onClick={() => router.push("/login")}
            style={{ color: "#2563EB", cursor: "pointer", textDecoration: "underline" }}
          >
            Contact the administration
          </span>
        </p>
      </div>
    </div>
  );
}
