import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

function loadEnvLocal() {
  const p = resolve(process.cwd(), ".env.local");
  const raw = readFileSync(p, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

function ok(label: string) {
  console.log(`✅ ${label}`);
}
function fail(label: string, fix: string) {
  console.log(`❌ ${label}`);
  console.log(`   Fix: ${fix}`);
}

function requireEnv(key: string): string | null {
  const v = process.env[key];
  return v && v.trim() ? v : null;
}

function initAdmin(): boolean {
  try {
    if (getApps().length) return true;
    const projectId = requireEnv("FIREBASE_ADMIN_PROJECT_ID");
    const clientEmail = requireEnv("FIREBASE_ADMIN_CLIENT_EMAIL");
    const privateKeyRaw = requireEnv("FIREBASE_ADMIN_PRIVATE_KEY");
    if (!projectId || !clientEmail || !privateKeyRaw) return false;
    const privateKey = privateKeyRaw.replace(/\\n/g, "\n");
    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
    return true;
  } catch {
    return false;
  }
}

async function checkGemini(): Promise<boolean> {
  const key = requireEnv("GEMINI_API_KEY");
  if (!key) return false;
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro",
    generationConfig: { maxOutputTokens: 5, temperature: 0 },
  });
  const res = await model.generateContent("Reply with exactly: OK");
  const text = res.response.text().trim().toUpperCase();
  return text.includes("OK");
}

async function main() {
  loadEnvLocal();

  const requiredEnv = [
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID",
    "FIREBASE_ADMIN_PROJECT_ID",
    "FIREBASE_ADMIN_CLIENT_EMAIL",
    "FIREBASE_ADMIN_PRIVATE_KEY",
    "GEMINI_API_KEY",
    "NEXT_PUBLIC_APP_URL",
  ];

  const missing = requiredEnv.filter((k) => !requireEnv(k));
  if (missing.length) {
    fail(
      "All required env vars present",
      `Add missing keys to .env.local: ${missing.join(", ")}`,
    );
  } else {
    ok("All required env vars present");
  }

  const adminOk = initAdmin();
  if (!adminOk) {
    fail(
      "Firebase Admin connects successfully",
      "Verify FIREBASE_ADMIN_* values in .env.local (service account email + private key with \\n).",
    );
    return;
  }
  ok("Firebase Admin connects successfully");

  // Firestore /cases accessible
  try {
    const db = getFirestore();
    await db.collection("cases").limit(1).get();
    ok("Firestore /cases collection accessible");
  } catch {
    fail(
      "Firestore /cases collection accessible",
      "Check service account permissions for Firestore and that the project ID is correct.",
    );
  }

  // Gemini API key valid
  try {
    const gemOk = await checkGemini();
    if (gemOk) ok("Gemini API key valid (test call)");
    else fail("Gemini API key valid (test call)", "Set a valid GEMINI_API_KEY in .env.local (server-only).");
  } catch {
    fail("Gemini API key valid (test call)", "Ensure GEMINI_API_KEY is valid and outbound network access is allowed.");
  }

  // Demo users in Firestore
  try {
    const db = getFirestore();
    const emails = ["staff@pcrm.demo", "supervisor@pcrm.demo", "mla@pcrm.demo", "admin@pcrm.demo"];
    const snaps = await Promise.all(
      emails.map((email) => db.collection("users").where("email", "==", email).limit(1).get()),
    );
    const missingUsers = emails.filter((_, i) => snaps[i]!.empty);
    if (missingUsers.length) {
      fail(
        "All 4 demo users exist in Firestore /users",
        `Run: npx ts-node scripts/createDemoUsers.ts (missing: ${missingUsers.join(", ")})`,
      );
    } else {
      ok("All 4 demo users exist in Firestore /users");
    }
  } catch {
    fail(
      "All 4 demo users exist in Firestore /users",
      "Ensure Firestore is reachable and the service account has read access to /users.",
    );
  }

  // Bonus: verify Auth users exist
  try {
    const auth = getAuth();
    const emails = ["staff@pcrm.demo", "supervisor@pcrm.demo", "mla@pcrm.demo", "admin@pcrm.demo"];
    const res = await Promise.allSettled(emails.map((e) => auth.getUserByEmail(e)));
    const missingAuth = emails.filter((_, i) => res[i]?.status === "rejected");
    if (missingAuth.length) {
      fail(
        "All 4 demo users exist in Firebase Auth",
        `Run: npx ts-node scripts/createDemoUsers.ts (missing in Auth: ${missingAuth.join(", ")})`,
      );
    } else {
      ok("All 4 demo users exist in Firebase Auth");
    }
  } catch {
    fail("All 4 demo users exist in Firebase Auth", "Check service account permissions for Firebase Auth.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

