import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

function loadEnvLocal() {
  const p = resolve(process.cwd(), ".env.local");
  const buf = readFileSync(p);
  // Some Windows editors save .env.local as UTF-16LE; handle both encodings.
  const raw = buf.includes(0) ? buf.toString("utf16le") : buf.toString("utf8");
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
    // Keep existing env if already set by shell, unless it's empty (common on Windows).
    if (process.env[key] === undefined || process.env[key] === "") process.env[key] = val;
  }
}

function initAdmin() {
  if (getApps().length) return getApps()[0]!;

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKeyRaw) {
    throw new Error(
      "Missing Firebase Admin env vars. Ensure FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY are set in .env.local.",
    );
  }

  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

type DemoUser = {
  email: string;
  password: string;
  role: "staff" | "supervisor" | "mla" | "admin";
  department?: string;
  ward?: string;
  name: string;
};

const DEMO_USERS: DemoUser[] = [
  {
    email: "staff@pcrm.demo",
    password: "DemoStaff2026!",
    role: "staff",
    department: "Water Supply",
    name: "Demo Staff",
  },
  {
    email: "supervisor@pcrm.demo",
    password: "DemoSuper2026!",
    role: "supervisor",
    department: "All",
    name: "Demo Supervisor",
  },
  {
    email: "mla@pcrm.demo",
    password: "DemoMLA2026!",
    role: "mla",
    ward: "All",
    name: "Demo MLA",
  },
  {
    email: "admin@pcrm.demo",
    password: "DemoAdmin2026!",
    role: "admin",
    department: "All",
    name: "Demo Admin",
  },
];

async function upsertUser(u: DemoUser) {
  const auth = getAuth();
  const db = getFirestore();

  let uid: string;
  try {
    const existing = await auth.getUserByEmail(u.email);
    uid = existing.uid;
    await auth.updateUser(uid, { password: u.password, disabled: false, displayName: u.name });
  } catch {
    const created = await auth.createUser({
      email: u.email,
      password: u.password,
      displayName: u.name,
      emailVerified: true,
      disabled: false,
    });
    uid = created.uid;
  }

  await db.collection("users").doc(uid).set(
    {
      uid,
      role: u.role,
      name: u.name,
      email: u.email,
      phone: null,
      ward: u.ward ?? null,
      department: u.department ?? null,
      avatar_url: null,
      is_active: true,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    },
    { merge: true },
  );

  return uid;
}

async function main() {
  loadEnvLocal();
  initAdmin();

  const results: Array<{ email: string; uid: string }> = [];
  for (const u of DEMO_USERS) {
    const uid = await upsertUser(u);
    results.push({ email: u.email, uid });
  }

  for (const r of results) {
    // Intentionally print only UID + email (no secrets)
    console.log(`${r.email} -> ${r.uid}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

