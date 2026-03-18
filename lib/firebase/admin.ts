import "server-only";

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";

type AdminEnv = {
  FIREBASE_ADMIN_PROJECT_ID: string;
  FIREBASE_ADMIN_CLIENT_EMAIL: string;
  FIREBASE_ADMIN_PRIVATE_KEY: string;
};

function getAdminEnv(): AdminEnv {
  const required = [
    "FIREBASE_ADMIN_PROJECT_ID",
    "FIREBASE_ADMIN_CLIENT_EMAIL",
    "FIREBASE_ADMIN_PRIVATE_KEY",
  ] as const;

  const missing = required.filter((k) => !process.env[k] || process.env[k]?.trim() === "");
  if (missing.length) {
    throw new Error(
      `Missing required Firebase Admin env vars: ${missing.join(", ")}. ` +
        `Define them in .env.local (server-only, do not prefix with NEXT_PUBLIC_).`,
    );
  }

  return {
    FIREBASE_ADMIN_PROJECT_ID: process.env.FIREBASE_ADMIN_PROJECT_ID!,
    FIREBASE_ADMIN_CLIENT_EMAIL: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
    FIREBASE_ADMIN_PRIVATE_KEY: process.env.FIREBASE_ADMIN_PRIVATE_KEY!,
  };
}

function initFirebaseAdmin(): App {
  const env = getAdminEnv();

  const privateKey = env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n");

  if (getApps().length) return getApps()[0]!;

  return initializeApp({
    credential: cert({
      projectId: env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

let cachedApp: App | null = null;
let cachedAuth: Auth | null = null;
let cachedDb: Firestore | null = null;
let cachedStorage: Storage | null = null;

export function getFirebaseAdminApp(): App {
  cachedApp ??= initFirebaseAdmin();
  return cachedApp;
}

export function getFirebaseAdminAuth(): Auth {
  cachedAuth ??= getAuth(getFirebaseAdminApp());
  return cachedAuth;
}

export function getFirebaseAdminDb(): Firestore {
  cachedDb ??= getFirestore(getFirebaseAdminApp());
  return cachedDb;
}

export function getFirebaseAdminStorage(): Storage {
  cachedStorage ??= getStorage(getFirebaseAdminApp());
  return cachedStorage;
}

