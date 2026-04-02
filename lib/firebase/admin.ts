import "server-only";

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";

function initFirebaseAdmin(): App {
  if (getApps().length > 0) return getApps()[0]!;

  let credential;
  
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      credential = cert(serviceAccount);
    } catch (e) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY", e);
      throw e;
    }
  } else {
    // Fallback to individual env vars
    const required = [
      "FIREBASE_ADMIN_PROJECT_ID",
      "FIREBASE_ADMIN_CLIENT_EMAIL",
      "FIREBASE_ADMIN_PRIVATE_KEY",
    ] as const;

    const missing = required.filter((k) => !process.env[k] || process.env[k]?.trim() === "");
    if (missing.length) {
      throw new Error(
        `Missing required Firebase Admin env vars: ${missing.join(", ")} or FIREBASE_SERVICE_ACCOUNT_KEY.`
      );
    }
    
    credential = cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    });
  }

  return initializeApp({
    credential,
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
