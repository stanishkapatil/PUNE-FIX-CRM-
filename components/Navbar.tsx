"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../lib/useAuth";

export function Navbar() {
  const pathname = usePathname();
  const { user, role, loading } = useAuth();

  return (
    <nav
      style={{
        height: "64px",
        backgroundColor: "#FFFFFF",
        borderBottom: "1px solid #E2E8F0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "960px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
        }}
      >
        {/* Left */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "20px" }}>🏛</span>
          <span style={{ color: "#1B2A4A", fontSize: "16px", fontWeight: "bold" }}>
            Pune Fix
          </span>
        </div>

        {/* Right Nav Links */}
        <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
          <Link href="/" style={{ color: pathname === "/" ? "#2563EB" : "#1B2A4A", fontSize: "14px", textDecoration: "none", fontWeight: pathname === "/" ? "bold" : "normal" }}>
            Home
          </Link>
          <Link
            href="/complaints/new"
            style={{ color: pathname === "/complaints/new" ? "#2563EB" : "#1B2A4A", fontSize: "14px", textDecoration: "none", fontWeight: pathname === "/complaints/new" ? "bold" : "normal" }}
          >
            File Complaint
          </Link>
          <Link
            href="/track"
            style={{ color: pathname.startsWith("/track") ? "#2563EB" : "#1B2A4A", fontSize: "14px", textDecoration: "none", fontWeight: pathname.startsWith("/track") ? "bold" : "normal" }}
          >
            Track Status
          </Link>
          <Link 
            href="/faq" 
            style={{ color: pathname.startsWith("/faq") ? "#2563EB" : "#1B2A4A", fontSize: "14px", textDecoration: "none", fontWeight: pathname.startsWith("/faq") ? "bold" : "normal" }}
          >
            FAQ
          </Link>

          {!loading && user ? (
            <Link
              href={role === "admin" ? "/admin" : role === "mla" ? "/mla" : "/dashboard"}
              style={{
                backgroundColor: "#F8FAFC",
                color: "#1B2A4A",
                border: "1px solid #E2E8F0",
                borderRadius: "8px",
                height: "32px",
                padding: "0 16px",
                fontSize: "14px",
                fontWeight: "bold",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginLeft: "8px",
              }}
            >
              Portal
            </Link>
          ) : (
            <Link
              href="/login"
              style={{
                backgroundColor: "#2563EB",
                color: "#FFFFFF",
                borderRadius: "8px",
                height: "32px",
                padding: "0 16px",
                fontSize: "14px",
                fontWeight: "bold",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginLeft: "8px",
              }}
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
