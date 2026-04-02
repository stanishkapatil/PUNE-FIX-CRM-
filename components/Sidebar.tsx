"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { firebaseAuth } from "../lib/firebase/client";
import { useAuth } from "../lib/useAuth";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(firebaseAuth);
      router.push("/login");
    } catch (e) {
      console.error("Failed to sign out", e);
    }
  };

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: "🏠" },
    { name: "Cases", href: "/cases", icon: "📋" },
    { name: "Alerts", href: "/alerts", icon: "🔔" },
    { name: "Reports", href: "/reports", icon: "📊" },
    { name: "Settings", href: "/settings", icon: "⚙️" },
  ];

  return (
    <aside
      style={{
        width: "240px",
        backgroundColor: "#1B2A4A",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        height: "100%",
        minHeight: "100vh"
      }}
    >
      <div style={{ padding: "24px 16px" }}>
        <div style={{ fontSize: "18px", fontWeight: "bold", color: "#FFFFFF" }}>P-CRM</div>
        <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "4px" }}>Staff Portal</div>
      </div>

      <nav style={{ flex: 1, padding: "0 16px", display: "flex", flexDirection: "column", gap: "4px" }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                height: "48px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "0 16px",
                backgroundColor: isActive ? "#2563EB" : "transparent",
                borderRadius: "8px",
                color: "#FFFFFF",
                fontSize: "14px",
                textDecoration: "none",
                cursor: "pointer",
              }}
            >
              <span>{item.icon}</span> {item.name}
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: "24px 16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: "#64748B",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
            }}
          >
            👤
          </div>
          <div>
             <div style={{ fontSize: "14px", color: "#FFFFFF", fontWeight: "600", maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.email ? user.email.split("@")[0] : "Staff Officer"}
             </div>
             <div style={{ fontSize: "12px", color: "#94A3B8", textTransform: "capitalize" }}>{role || "Officer"}</div>
          </div>
        </div>
        
        <button
            onClick={handleLogout}
            style={{
              backgroundColor: "rgba(255,255,255,0.1)",
              border: "none",
              color: "#FFFFFF",
              padding: "8px 0",
              borderRadius: "6px",
              fontSize: "12px",
              cursor: "pointer",
              fontWeight: "600"
            }}
        >
            Sign Out
        </button>
      </div>
    </aside>
  );
}
