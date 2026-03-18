import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { firebaseAuth, firebaseDb } from "../firebase/client";
import type { UserRole, UserProfile } from "../../types";

export type CurrentUser = {
  user: User;
  role: UserRole;
  profile?: UserProfile;
};

export async function getUserRole(uid: string): Promise<UserRole> {
  if (!uid?.trim()) throw new Error("getUserRole: uid is required");

  const snap = await getDoc(doc(firebaseDb, "users", uid));
  if (!snap.exists()) throw new Error("getUserRole: user profile not found");

  const role = (snap.data() as any)?.role as UserRole | undefined;
  if (!role || !["staff", "supervisor", "mla", "admin"].includes(role)) {
    throw new Error("getUserRole: invalid role");
  }

  return role;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const existing = firebaseAuth.currentUser;
  if (existing) {
    const role = await getUserRole(existing.uid);
    return { user: existing, role };
  }

  return await new Promise<CurrentUser | null>((resolve, reject) => {
    const unsub = onAuthStateChanged(
      firebaseAuth,
      async (user) => {
        unsub();
        try {
          if (!user) return resolve(null);
          const role = await getUserRole(user.uid);
          resolve({ user, role });
        } catch (e) {
          reject(e);
        }
      },
      (err) => {
        unsub();
        reject(err);
      },
    );
  });
}

export async function requireAuth(roles?: UserRole[]): Promise<CurrentUser> {
  const current = await getCurrentUser();
  if (!current) throw new Error("UNAUTHENTICATED");

  if (roles && roles.length > 0 && !roles.includes(current.role)) {
    throw new Error("FORBIDDEN");
  }

  return current;
}

