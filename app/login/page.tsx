"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { firebaseAuth, firebaseDb } from "../../lib/firebase/client";
import { useAuth, UserRole } from "../../lib/useAuth";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { toast } from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const { user, role, loading } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
        // Redirection logic for existing users
        if (role === "admin") router.replace("/admin");
        else if (role === "mla") router.replace("/mla");
        else router.replace("/dashboard");
    }
  }, [user, role, loading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
        return toast.error("Please enter email and password");
    }

    setIsSubmitting(true);
    try {
        const cred = await signInWithEmailAndPassword(firebaseAuth, email, password);
        const userDoc = await getDoc(doc(firebaseDb, "users", cred.user.uid));
        
        let fetchedRole: UserRole = null;
        if (userDoc.exists()) {
            fetchedRole = userDoc.data().role as UserRole;
        }

        if (fetchedRole === "admin") router.push("/admin");
        else if (fetchedRole === "mla") router.push("/mla");
        else router.push("/dashboard");
        
    } catch (error: any) {
        toast.error("Invalid email or password");
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

  // Prevent flash of login screen if already authed
  if (user) return null; 

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
              P-CRM
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
        <p style={{ margin: "0 0 24px 0", fontSize: "13px", color: "#94A3B8" }}>
          Sign in to your account
        </p>

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
          Access restricted to authorized personnel only.
        </p>
      </div>
    </div>
  );
}
