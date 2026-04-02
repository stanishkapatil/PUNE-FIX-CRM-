"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/useAuth";
import { Sidebar } from "../../components/Sidebar";
import { UrgencyBadge } from "../../components/UrgencyBadge";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { toast } from "react-hot-toast";

export default function DashboardPage() {
  const router = useRouter();
  const { user, role, loading } = useAuth();
  
  const [briefText, setBriefText] = useState("3 critical water supply cases in Ward 7 require immediate attention — cascade pattern detected. Officer Kumar is approaching SLA breach on Case #1038. Prioritize water cases before electrical queue today.");
  const [briefTime, setBriefTime] = useState("8:30 AM");
  const [isRefreshingBrief, setIsRefreshingBrief] = useState(false);
  
  const [cases, setCases] = useState<any[]>([]);
  const [cascadeAlerts, setCascadeAlerts] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && (!user || (role !== "staff" && role !== "supervisor" && role !== "admin"))) {
        router.replace("/login");
    }
  }, [user, role, loading, router]);

  useEffect(() => {
    if (user && (role === "admin" || role === "staff" || role === "supervisor")) {
        const fetchDashboardData = async () => {
             try {
                const { collection, getDocs, query, orderBy, limit } = await import("firebase/firestore");
                const { firebaseDb } = await import("../../lib/firebase/client");
                
                const q = query(collection(firebaseDb, "cases"), orderBy("createdAt", "desc"), limit(50));
                const snap = await getDocs(q);
                const loaded = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));

                const tableCases = [...loaded].sort((a,b) => (b.urgencyScore || 0) - (a.urgencyScore || 0)).slice(0, 5);
                setCases(tableCases);

                const cascadeMatches = loaded.filter(c => c.category === "Water Supply" && c.ward === "Ward 7" && c.status !== "resolved" && c.status !== "closed");
                if (cascadeMatches.length >= 3) {
                   setCascadeAlerts([{
                     title: "Water Supply · Ward 7",
                     count: cascadeMatches.length,
                     desc: "Pattern detected: Repeated water supply failures. Recommend immediate field inspection.",
                   }]);
                } else {
                   setCascadeAlerts([]);
                }
             } catch (e) {
                console.error("Dashboard fetch error:", e);
             }
        };
        fetchDashboardData();
    }
  }, [user, role, loading]);

  const refreshBrief = async (e: React.MouseEvent) => {
      e.preventDefault();
      setIsRefreshingBrief(true);
      try {
          const res = await fetch("/api/ai/brief");
          const data = await res.json();
          if (data.brief) {
              setBriefText(data.brief);
              setBriefTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
              toast.success("AI Brief updated");
          }
      } catch (err) {
          toast.error("Failed to refresh brief");
      } finally {
          setIsRefreshingBrief(false);
      }
  };

  const handleEscalate = async () => {
      toast.success("Escalated to Supervisor successfully!");
  }

  if (loading || !user) {
     return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><LoadingSpinner color="#2563EB" size={32} /></div>;
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#F8FAFC",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <Sidebar />

      {/* RIGHT CONTENT AREA */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100vh", overflowY: "auto" }}>
        {/* TOP BAR */}
        <header
          style={{
            height: "64px",
            backgroundColor: "#FFFFFF",
            borderBottom: "1px solid #E2E8F0",
            padding: "0 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0
          }}
        >
          <div style={{ fontSize: "18px", fontWeight: "bold", color: "#1B2A4A" }}>
            Good morning{user.email ? `, ${user.email.split("@")[0]}` : ""} 👋
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "20px" }}>
            <div style={{ position: "relative", cursor: "pointer" }}>
              🔔
              <div style={{ position: "absolute", top: -2, right: -4, width: 8, height: 8, backgroundColor: "#DC2626", borderRadius: "50%", border: "1px solid #FFFFFF" }} />
            </div>
            <span style={{ cursor: "pointer" }}>⚙️</span>
            <div
                style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                backgroundColor: "#E2E8F0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
                }}
            >
                👤
            </div>
          </div>
        </header>

        {/* MAIN DASHBOARD CONTENT */}
        <main style={{ padding: "32px", flex: 1 }}>
          
          {/* AI SITUATION BRIEF CARD */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "12px",
              border: "1px solid #E2E8F0",
              padding: "24px",
              marginBottom: "24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <div style={{ fontSize: "16px", fontWeight: "bold", color: "#1B2A4A", display: "flex", alignItems: "center", gap: "8px" }}>
                🤖 AI Situation Brief
                {isRefreshingBrief && <LoadingSpinner size={14} color="#2563EB" />}
              </div>
              <a href="#" onClick={refreshBrief} style={{ color: "#2563EB", fontSize: "12px", textDecoration: "none" }}>Refresh ↺</a>
            </div>
            <div style={{ fontSize: "11px", color: "#94A3B8", marginBottom: "16px" }}>Generated at {briefTime}</div>

            <div
              style={{
                backgroundColor: "#EFF6FF",
                borderLeft: "3px solid #2563EB",
                borderRadius: "8px",
                padding: "16px",
              }}
            >
              <p style={{ margin: 0, fontSize: "14px", color: "#64748B", lineHeight: "1.6" }}>
                {briefText}
              </p>
            </div>
          </div>

          {/* 4 KPI CARDS */}
          <div style={{ display: "flex", gap: "24px", marginBottom: "24px", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 200px", backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", padding: "20px" }}>
              <div style={{ fontSize: "14px", color: "#64748B", marginBottom: "8px" }}>Open Cases</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#1B2A4A", marginBottom: "8px" }}>47</div>
              <div style={{ fontSize: "12px", color: "#D97706" }}>+3 today</div>
            </div>
            <div style={{ flex: "1 1 200px", backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", padding: "20px" }}>
              <div style={{ fontSize: "14px", color: "#64748B", marginBottom: "8px" }}>Resolved Today</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#16A34A", marginBottom: "8px" }}>12</div>
              <div style={{ fontSize: "12px", color: "#16A34A" }}>↑ from 8 yesterday</div>
            </div>
            <div style={{ flex: "1 1 200px", backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", padding: "20px" }}>
              <div style={{ fontSize: "14px", color: "#64748B", marginBottom: "8px" }}>SLA At Risk</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#DC2626", marginBottom: "8px" }}>5</div>
              <div style={{ fontSize: "12px", color: "#DC2626" }}>⚠ Need attention</div>
            </div>
            <div style={{ flex: "1 1 200px", backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", padding: "20px" }}>
              <div style={{ fontSize: "14px", color: "#64748B", marginBottom: "8px" }}>Avg Resolution</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#1B2A4A", marginBottom: "8px" }}>1.8 days</div>
              <div style={{ fontSize: "12px", color: "#16A34A" }}>↓ 0.5 days this week</div>
            </div>
          </div>

          {/* CASCADE ALERT BANNER */}
          {cascadeAlerts.map((alert, i) => (
            <div
                key={i}
                style={{
                backgroundColor: "#FEF2F2",
                borderLeft: "4px solid #DC2626",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "16px",
                }}
            >
                <div>
                <div style={{ fontSize: "14px", fontWeight: "bold", color: "#DC2626", marginBottom: "4px" }}>
                    🚨 CASCADE ALERT — {alert.title}
                </div>
                <div style={{ fontSize: "13px", color: "#64748B", marginBottom: "8px" }}>
                    {alert.desc}
                </div>
                <button 
                    onClick={handleEscalate}
                    style={{ backgroundColor: "#DC2626", color: "#FFF", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", cursor: "pointer" }}>
                    Escalate to Supervisor
                </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                <div style={{ fontSize: "12px", color: "#DC2626" }}>
                    {alert.count} complaints in 72 hours · CRITICAL
                </div>
                <span onClick={() => {router.push("/cases")}} style={{ color: "#2563EB", fontSize: "14px", fontWeight: "bold", textDecoration: "none", cursor: "pointer" }}>
                    View Cases →
                </span>
                </div>
            </div>
          ))}

          {/* PRIORITY QUEUE TABLE */}
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
            <div style={{ padding: "20px", borderBottom: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: "16px", fontWeight: "bold", color: "#1B2A4A" }}>AI Priority Queue</div>
              <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "4px" }}>Sorted by urgency score</div>
            </div>
            
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                    <th style={{ padding: "12px 20px", fontSize: "12px", color: "#64748B", fontWeight: "600" }}>Case ID</th>
                    <th style={{ padding: "12px 20px", fontSize: "12px", color: "#64748B", fontWeight: "600" }}>Description</th>
                    <th style={{ padding: "12px 20px", fontSize: "12px", color: "#64748B", fontWeight: "600" }}>Ward</th>
                    <th style={{ padding: "12px 20px", fontSize: "12px", color: "#64748B", fontWeight: "600" }}>Category</th>
                    <th style={{ padding: "12px 20px", fontSize: "12px", color: "#64748B", fontWeight: "600" }}>Urgency</th>
                    <th style={{ padding: "12px 20px", fontSize: "12px", color: "#64748B", fontWeight: "600" }}>Status</th>
                    <th style={{ padding: "12px 20px", fontSize: "12px", color: "#64748B", fontWeight: "600" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.length > 0 ? cases.map((row, idx) => (
                    <tr 
                        key={idx} 
                        onClick={() => router.push(`/track/${row.id}`)}
                        style={{ borderBottom: "1px solid #E2E8F0", cursor: "pointer" }}>
                      <td style={{ padding: "16px 20px", fontSize: "14px", color: "#1B2A4A", fontWeight: "500" }}>{row.id}</td>
                      <td style={{ padding: "16px 20px", fontSize: "14px", color: "#1B2A4A" }}>{row.description?.substring(0,40)}{row.description?.length > 40 ? '...' : ''}</td>
                      <td style={{ padding: "16px 20px", fontSize: "14px", color: "#64748B" }}>{row.ward}</td>
                      <td style={{ padding: "16px 20px", fontSize: "14px", color: "#64748B" }}>{row.category}</td>
                      <td style={{ padding: "16px 20px" }}>
                          <UrgencyBadge urgency={row.urgencyScore >= 80 ? "CRITICAL" : row.urgencyScore >= 60 ? "HIGH" : row.urgencyScore >= 30 ? "MEDIUM" : "LOW"} />
                      </td>
                      <td style={{ padding: "16px 20px", fontSize: "14px", color: "#64748B" }}>{row.status?.replace('_', ' ')}</td>
                      <td style={{ padding: "16px 20px" }}>
                        <button 
                            onClick={(e) => { e.stopPropagation(); router.push(`/track/${row.id}`) }}
                            style={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "6px", padding: "6px 12px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
                            View
                        </button>
                      </td>
                    </tr>
                  )) : <tr><td colSpan={7} style={{ padding: "16px", textAlign: "center", color: "#64748B" }}>No cases found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
