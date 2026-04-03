"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { firebaseAuth, firebaseDb } from "../../lib/firebase/client";
import { useAuth, UserRole } from "../../lib/useAuth";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { toast } from "react-hot-toast";

// Quick-fill helper for judges
function DemoBtn({ label, email, password, onFill }: { label: string; email: string; password: string; onFill: (e: string, p: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onFill(email, password)}
      style={{
        flex: 1,
        background: "none",
        border: "1px solid #BBF7D0",
        borderRadius: 6,
        padding: "4px 0",
        fontSize: 11,
        color: "#15803D",
        cursor: "pointer",
        fontWeight: 600,
      }}
    >
      {label}
    </button>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { user, role, loading } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");

  const fillDemo = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
    setLoginError("");
  };

  useEffect(() => {
    if (!loading && user) {
        // Redirection logic for existing users
        if (role === "admin" || role === "staff" || role === "supervisor") router.replace("/dashboard");
        else if (role === "mla") router.replace("/mla");
        else if (role === "citizen") router.replace("/");
        else router.replace("/dashboard");
    }
  }, [user, role, loading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    if (!email.trim() || !password) {
        setLoginError("Please enter your email and password.");
        return;
    }

    setIsSubmitting(true);
    try {
        const cred = await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
        const userDoc = await getDoc(doc(firebaseDb, "users", cred.user.uid));
        
        let fetchedRole: UserRole = null;
        if (userDoc.exists()) {
            fetchedRole = userDoc.data().role as UserRole;
        }

        if (fetchedRole === "admin" || fetchedRole === "staff" || fetchedRole === "supervisor") router.push("/dashboard");
        else if (fetchedRole === "mla") router.push("/mla");
        else if (fetchedRole === "citizen") router.push("/");
        else router.push("/dashboard");
        
    } catch (error: any) {
        const code = error?.code || "";
        if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
            setLoginError("Invalid email or password. Please try again.");
        } else if (code === "auth/too-many-requests") {
            setLoginError("Too many attempts. Please wait a few minutes.");
        } else {
            setLoginError("Login failed. Please try again.");
        }
        setIsSubmitting(false);
    }
  };

  const handleForgot = (e: React.MouseEvent) => {
      e.preventDefault();
      alert("Please contact your system administrator to reset your password.");
  }

  if (loading) {
     return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><LoadingSpinner color="#2563EB" size={32} /></div>;
  }

  // Already authenticated — show spinner while useEffect redirect fires
  if (user) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F8FAFC",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        gap: "16px",
      }}>
        <LoadingSpinner color="#2563EB" size={32} />
        <p style={{ fontSize: "14px", color: "#64748B" }}>Redirecting to your dashboard…</p>
      </div>
    );
  } 

  return (
    <div
      style={{
        backgroundColor: "#F8FAFC",
        minHeight: "100vh",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          border: "1px solid #E2E8F0",
          padding: "40px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}
      >
        {/* LOGO SECTION */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              backgroundColor: "#1B2A4A",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
            }}
          >
            🏛
          </div>
          <div>
            <div style={{ fontSize: "22px", fontWeight: "bold", color: "#1B2A4A", lineHeight: "1" }}>
              Pune Fix
            </div>
            <div style={{ fontSize: "13px", color: "#94A3B8", marginTop: "2px" }}>
              Smart Public Governance
            </div>
          </div>
        </div>

        <div style={{ borderBottom: "1px solid #E2E8F0", marginBottom: "24px" }} />

        {/* HEADING */}
        <h1 style={{ margin: "0 0 4px 0", fontSize: "20px", fontWeight: "bold", color: "#1B2A4A" }}>
          Welcome back
        </h1>
        <p style={{ margin: "0 0 20px 0", fontSize: "13px", color: "#94A3B8" }}>
          Sign in to your account
        </p>

        {/* Inline error */}
        {loginError && (
          <div style={{
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: 13,
            color: "#DC2626",
            marginBottom: 4,
          }}>
            ⚠️ {loginError}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label htmlFor="email" style={{ fontSize: "14px", color: "#1B2A4A" }}>Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="officer@pune.gov.in"
              style={{
                height: "44px",
                border: "1px solid #E2E8F0",
                borderRadius: "8px",
                padding: "0 12px",
                fontSize: "16px",
                fontFamily: "inherit",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label htmlFor="password" style={{ fontSize: "14px", color: "#1B2A4A" }}>Password</label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  height: "44px",
                  border: "1px solid #E2E8F0",
                  borderRadius: "8px",
                  padding: "0 40px 0 12px",
                  fontSize: "16px",
                  fontFamily: "inherit",
                }}
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  fontSize: "16px",
                  cursor: "pointer",
                  color: "#94A3B8",
                }}
              >
                {showPassword ? "🕵️" : "👁"}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <a href="#" onClick={handleForgot} style={{ color: "#2563EB", fontSize: "12px", textDecoration: "none" }}>
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: "100%",
              height: "44px",
              backgroundColor: isSubmitting ? "#94A3B8" : "#2563EB",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "bold",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              marginTop: "8px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            {isSubmitting ? <LoadingSpinner size={16} /> : "Sign In"}
          </button>
        </form>

        <p style={{ margin: "16px 0 0 0", fontSize: "12px", color: "#94A3B8", textAlign: "center" }}>
          🔒 Access restricted to authorized personnel only.
        </p>

        {/* ── DEMO CREDENTIALS (visible to judges) ── */}
        <div style={{
          marginTop: 20,
          background: "#F0FDF4",
          borderRadius: 10,
          border: "1px solid #BBF7D0",
          padding: "14px 16px",
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#15803D", marginBottom: 10 }}>
            🎯 Demo Credentials — Click to fill
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <DemoBtn
              label="👤 Staff Login"
              email="staff@pune.gov.in"
              password="Demo@1234"
              onFill={fillDemo}
            />
            <DemoBtn
              label="🏛️ MLA Login"
              email="mla@pune.gov.in"
              password="Demo@1234"
              onFill={fillDemo}
            />
          </div>
          <div style={{ fontSize: 10, color: "#166534", lineHeight: 1.6 }}>
            <div>Staff: staff@pune.gov.in / Demo@1234</div>
            <div>MLA&nbsp;&nbsp;&nbsp;: mla@pune.gov.in / Demo@1234</div>
          </div>
        </div>
      </div>
    </div>
  );
}
