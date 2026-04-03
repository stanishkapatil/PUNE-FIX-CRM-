"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { UserRole } from "@/lib/useAuth";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function LoginPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          const role = userDoc.exists() ? (userDoc.data().role as UserRole) : "staff";
          if (role === "mla") router.replace("/mla");
          else if (role === "citizen") router.replace("/");
          else router.replace("/dashboard");
        } catch {
          router.replace("/dashboard");
        }
      } else {
        setChecking(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setLoginError("Please enter your email and password.");
      return;
    }
    setIsSubmitting(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const userDoc = await getDoc(doc(db, "users", cred.user.uid));
      const role = userDoc.exists() ? userDoc.data().role : "staff";
      
      const searchParams = new URLSearchParams(window.location.search);
      const next = searchParams.get("next") || "/dashboard";
      router.push(next);
    } catch (err: any) {
      setLoginError("Invalid email or password.");
      setIsSubmitting(false);
    }
  };

  if (checking) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><p style={{ color: "#94A3B8", fontSize: 14 }}>Checking session...</p></div>;
  }

  return (
    <div style={{ backgroundColor: "#F8FAFC", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "420px", backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", padding: "40px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
        <h1 style={{ marginBottom: "20px", fontSize: "24px", fontWeight: "bold", textAlign: "center" }}>Pune Fix</h1>
        {loginError && <div style={{ color: "red", marginBottom: "10px" }}>{loginError}</div>}
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={{ padding: "10px", borderRadius: "8px", border: "1px solid #E2E8F0" }} />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" style={{ padding: "10px", borderRadius: "8px", border: "1px solid #E2E8F0" }} />
          <button type="submit" disabled={isSubmitting} style={{ padding: "12px", borderRadius: "8px", background: "#2563EB", color: "#FFF", border: "none" }}>{isSubmitting ? "Signing in..." : "Sign In"}</button>
        </form>
      </div>
    </div>
  );
}
