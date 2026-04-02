"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { firebaseAuth } from "../lib/firebase/client";
import { useAuth } from "../lib/useAuth";

export function Sidebar({ activePage }: { activePage?: string } = {}) {
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
    { icon: '🏠', label: 'Dashboard', path: '/dashboard', key: 'dashboard' },
    { icon: '📋', label: 'Cases', path: '/cases', key: 'cases' },
    { icon: '🔔', label: 'Alerts', path: '/alerts', key: 'alerts' },
    { icon: '📊', label: 'Reports', path: '/reports', key: 'reports' },
    { icon: '⚙️', label: 'Settings', path: '/settings', key: 'settings' },
  ];

  const isActive = (key: string, path: string) => {
    if (activePage) return activePage === key;
    return pathname === path || pathname.startsWith(path + "/");
  };

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
          const active = isActive(item.key, item.path);
          return (
            <div
              key={item.key}
              onClick={() => router.push(item.path)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', borderRadius: 8, cursor: 'pointer',
                marginBottom: 4,
                background: active ? '#2563EB' : 'transparent',
                color: 'white',
                fontWeight: active ? 600 : 400,
                fontSize: 14,
              }}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
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
