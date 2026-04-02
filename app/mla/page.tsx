"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { firebaseAuth } from "../../lib/firebase/client";
import { useAuth } from "../../lib/useAuth";
import { UrgencyBadge } from "../../components/UrgencyBadge";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { toast } from "react-hot-toast";

export default function MLADashboardPage() {
  const router = useRouter();
  const { user, role, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("Resolution Rate");
  const [isDownloading, setIsDownloading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      toast.success(`Filtered view for: ${searchQuery}`);
    }
  };

  useEffect(() => {
    if (!loading && (!user || (role !== "mla" && role !== "admin"))) {
        router.replace("/login");
    }
  }, [user, role, loading, router]);

  const handleLogout = async () => {
    try {
      await signOut(firebaseAuth);
      router.push("/login");
    } catch (e) {
      console.error("Failed to sign out", e);
    }
  };

  const downloadReport = () => {
      setIsDownloading(true);
      setTimeout(() => {
        // Dummy PDF download
        const blob = new Blob(["Dummy Report Data - P-CRM System"], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "Pune_Ward7_MLA_Report.txt";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        setIsDownloading(false);
        toast.success("Report downloaded");
      }, 1500);
  }

  if (loading || !user) {
     return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><LoadingSpinner color="#2563EB" size={32} /></div>;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#F8FAFC", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* MLA SIDEBAR */}
      <aside style={{ width: "240px", backgroundColor: "#1B2A4A", display: "flex", flexDirection: "column", flexShrink: 0, height: "100%", minHeight: "100vh" }}>
        <div style={{ padding: "24px 16px" }}>
          <div style={{ fontSize: "18px", fontWeight: "bold", color: "#FFFFFF" }}>P-CRM</div>
          <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "4px" }}>Constituency Portal</div>
        </div>

        <nav style={{ flex: 1, padding: "0 16px", display: "flex", flexDirection: "column", gap: "4px" }}>
          {[
            { name: "Constituency Overview", icon: "🗺️", href: "/mla", active: true },
            { name: "My Wards", icon: "📍", href: "#", active: false },
            { name: "Department Metrics", icon: "📊", href: "#", active: false },
            { name: "SLA Breaches", icon: "⚠️", href: "#", active: false }
          ].map((item, idx) => (
            <Link key={idx} href={item.href} style={{ height: "48px", display: "flex", alignItems: "center", gap: "12px", padding: "0 16px", backgroundColor: item.active ? "#2563EB" : "transparent", borderRadius: "8px", color: "#FFFFFF", fontSize: "14px", cursor: "pointer", textDecoration: "none" }}>
              <span>{item.icon}</span> {item.name}
            </Link>
          ))}
        </nav>

        <div style={{ padding: "24px 16px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#64748B", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>
              👤
            </div>
            <div>
               <div style={{ fontSize: "14px", color: "#FFFFFF", fontWeight: "600", maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  Hon. MLA {user.email ? user.email.split("@")[0] : ""}
               </div>
               <div style={{ fontSize: "12px", color: "#94A3B8" }}>Kothrud Constituency</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ backgroundColor: "rgba(255,255,255,0.1)", border: "none", color: "#FFFFFF", padding: "8px 0", borderRadius: "6px", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}>
              Sign Out
          </button>
        </div>
      </aside>

      {/* MLA MAIN CONTENT */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100vh", overflowY: "auto" }}>
        {/* TOP BAR */}
        <header style={{ height: "64px", backgroundColor: "#FFFFFF", borderBottom: "1px solid #E2E8F0", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <div style={{ fontSize: "18px", fontWeight: "bold", color: "#1B2A4A" }}>
              Constituency Overview — Kothrud
            </div>
            <input 
              type="text" 
              aria-label="Search cases or wards"
              placeholder="Search cases or wards (Press Enter)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #E2E8F0", fontSize: "13px", width: "240px", outline: "none" }}
            />
          </div>
          <button aria-label="Download Report" onClick={downloadReport} disabled={isDownloading} style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#0D9488", color: "#FFFFFF", border: "none", borderRadius: "6px", padding: "8px 16px", fontSize: "13px", fontWeight: "bold", cursor: isDownloading ? "not-allowed" : "pointer" }}>
            {isDownloading ? <LoadingSpinner size={14} /> : "Download Report ⬇"}
          </button>
        </header>

        {/* MAIN METRICS */}
        <main style={{ padding: "32px", flex: 1 }}>
          <div style={{ display: "flex", gap: "24px", marginBottom: "32px", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 200px", backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", padding: "20px" }}>
              <div style={{ fontSize: "14px", color: "#64748B", marginBottom: "8px" }}>Total Open Cases</div>
              <div style={{ fontSize: "32px", fontWeight: "bold", color: "#1B2A4A", marginBottom: "8px" }}>243</div>
              <div style={{ fontSize: "12px", color: "#16A34A" }}>↓ 12% vs last month</div>
            </div>
            <div style={{ flex: "1 1 200px", backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", padding: "20px" }}>
              <div style={{ fontSize: "14px", color: "#64748B", marginBottom: "8px" }}>Overall Resolution Rate</div>
              <div style={{ fontSize: "32px", fontWeight: "bold", color: "#16A34A", marginBottom: "8px" }}>84%</div>
              <div style={{ fontSize: "12px", color: "#16A34A" }}>↑ 2% vs last month</div>
            </div>
            <div style={{ flex: "1 1 200px", backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", padding: "20px" }}>
              <div style={{ fontSize: "14px", color: "#64748B", marginBottom: "8px" }}>Avg Citizen Rating</div>
              <div style={{ fontSize: "32px", fontWeight: "bold", color: "#F59E0B", marginBottom: "8px" }}>4.2/5</div>
              <div style={{ fontSize: "12px", color: "#64748B" }}>Based on 1,024 reviews</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
            {/* HEATMAP/CHART SECTION */}
            <div style={{ flex: "2 1 500px", backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div style={{ fontSize: "16px", fontWeight: "bold", color: "#1B2A4A" }}>Issue Distribution</div>
                <div style={{ display: "flex", backgroundColor: "#F8FAFC", borderRadius: "8px", padding: "4px" }}>
                  {["Resolution Rate", "Complaint Volume"].map(tab => (
                      <div 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{ cursor: "pointer", padding: "6px 12px", fontSize: "12px", fontWeight: "bold", borderRadius: "6px", color: activeTab === tab ? "#1B2A4A" : "#94A3B8", backgroundColor: activeTab === tab ? "#FFFFFF" : "transparent", boxShadow: activeTab === tab ? "0 1px 2px rgba(0,0,0,0.05)" : "none" }}>
                        {tab}
                      </div>
                  ))}
                </div>
              </div>

              <div style={{ height: "300px", backgroundColor: "#F8FAFC", borderRadius: "8px", border: "1px dashed #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {activeTab === "Resolution Rate" ? (
                    <div style={{ textAlign: "center", color: "#64748B", width: "100%", height: "100%", backgroundImage: "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800')", backgroundSize: "cover", backgroundPosition: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ backgroundColor: "rgba(255,255,255,0.9)", padding: "16px", borderRadius: "8px", margin: "auto" }}>
                            <span style={{ fontSize: "32px", display: "block", marginBottom: "8px" }}>🗺️</span>
                            Resolution Heatmap<br/>
                            <span style={{ fontSize: "12px" }}>Showing 4 major hot-spots in Ward 7 & 12</span>
                        </div>
                    </div>
                ) : (
                    <div style={{ textAlign: "center", color: "#64748B" }}>
                        <span style={{ fontSize: "32px", display: "block", marginBottom: "8px" }}>📊</span>
                        Volume metrics overlay<br/>
                        <span style={{ fontSize: "12px" }}>Water Supply represents 40% of issues</span>
                    </div>
                )}
              </div>
            </div>

            {/* DEPARTMENT PERFORMANCE TABLE */}
            <div style={{ flex: "1 1 300px", backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
              <div style={{ padding: "20px", borderBottom: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: "16px", fontWeight: "bold", color: "#1B2A4A" }}>Department Performance</div>
                <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "4px" }}>By SLA compliance</div>
              </div>
              
              <div style={{ padding: "16px" }}>
                {[
                    { dept: "Water Supply", sla: "68%", color: "#DC2626", bar: 68 },
                    { dept: "Roads & Traffic", sla: "82%", color: "#D97706", bar: 82 },
                    { dept: "Sanitation", sla: "94%", color: "#16A34A", bar: 94 },
                    { dept: "Tax & Finance", sla: "90%", color: "#16A34A", bar: 90 },
                    { dept: "Electricity", sla: "91%", color: "#16A34A", bar: 91 },
                ].map((row, idx) => (
                    <div key={idx} style={{ marginBottom: idx === 3 ? 0 : "20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: "bold", marginBottom: "8px", color: "#1B2A4A" }}>
                            <span>{row.dept}</span>
                            <span style={{ color: row.color }}>{row.sla}</span>
                        </div>
                        <div style={{ width: "100%", height: "6px", backgroundColor: "#F1F5F9", borderRadius: "3px", overflow: "hidden" }}>
                            <div style={{ width: `${row.bar}%`, height: "100%", backgroundColor: row.color }}></div>
                        </div>
                    </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
