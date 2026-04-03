"use client";
import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export type UserRole = "citizen" | "staff" | "supervisor" | "mla" | "admin" | null;

interface AuthState {
  user: User | null;
  role: UserRole;
  loading: boolean;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    role: null,
    loading: true, // starts true
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          const role = userDoc.exists()
            ? (userDoc.data().role as UserRole)
            : "staff";
          setState({ user, role, loading: false }); // ← loading false
        } catch {
          setState({ user, role: "staff", loading: false }); // ← always false
        }
      } else {
        setState({ user: null, role: null, loading: false }); // ← loading false
      }
    });

    return () => unsubscribe();
  }, []); // empty deps — runs once on mount

  return state;
}
