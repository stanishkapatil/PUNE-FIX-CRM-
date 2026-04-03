// scripts/seed.ts — Run with: npm run seed
import * as fs from "fs";
import * as path from "path";
import * as admin from "firebase-admin";

// Manually load .env.local since tsx doesn't load it automatically
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (!process.env[key]) process.env[key] = val;
  }
}

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID!;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL!;
const rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY!;
const privateKey = rawKey.replace(/\\n/g, "\n");

if (!privateKey || privateKey.length < 50) {
  console.error("❌ FIREBASE_ADMIN_PRIVATE_KEY is missing or invalid.");
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });
}

const db = admin.firestore();
const authAdmin = admin.auth();
const Timestamp = admin.firestore.Timestamp;
const now = Date.now();

// ─── 15 SEED CASES (including 4 Ward 7 Water Supply to trigger cascade) ───────
const seedCases = [
  // 4 × Water Supply Ward 7 → triggers cascade alert
  {
    description: "No water supply for 3 days in Ward 7. Multiple families including elderly residents affected.",
    category: "Water Supply", ward: "Ward 7", phone: "+919876543210",
    status: "in_progress", urgencyScore: 94, sentiment: "Distressed",
    department: "Water Supply Department", vulnerableFlag: true,
    createdAt: Timestamp.fromDate(new Date(now - 6 * 3600000)),
  },
  {
    description: "Water pipe burst near Ward 7 school. Children cannot attend school.",
    category: "Water Supply", ward: "Ward 7", phone: "+919876543211",
    status: "assigned", urgencyScore: 91, sentiment: "Distressed",
    department: "Water Supply Department", vulnerableFlag: true,
    createdAt: Timestamp.fromDate(new Date(now - 4 * 3600000)),
  },
  {
    description: "Contaminated water supply in Ward 7 causing illness in multiple households.",
    category: "Water Supply", ward: "Ward 7", phone: "+919876543212",
    status: "received", urgencyScore: 96, sentiment: "Distressed",
    department: "Water Supply Department", vulnerableFlag: false,
    createdAt: Timestamp.fromDate(new Date(now - 2 * 3600000)),
  },
  {
    description: "Ward 7 water supply completely cut off. Third complaint from same building in one week.",
    category: "Water Supply", ward: "Ward 7", phone: "+919876543213",
    status: "received", urgencyScore: 88, sentiment: "Frustrated",
    department: "Water Supply Department", vulnerableFlag: false,
    createdAt: Timestamp.fromDate(new Date(now - 1 * 3600000)),
  },

  // Roads
  {
    description: "Large pothole on main road near Ward 3 market causing accidents daily.",
    category: "Roads & Infrastructure", ward: "Ward 3", phone: "+919876543214",
    status: "assigned", urgencyScore: 76, sentiment: "Frustrated",
    department: "Roads Department", vulnerableFlag: false,
    createdAt: Timestamp.fromDate(new Date(now - 12 * 3600000)),
  },
  {
    description: "Road completely broken near Ward 12 hospital. Ambulances cannot pass.",
    category: "Roads & Infrastructure", ward: "Ward 12", phone: "+919876543215",
    status: "in_progress", urgencyScore: 89, sentiment: "Distressed",
    department: "Roads Department", vulnerableFlag: true,
    createdAt: Timestamp.fromDate(new Date(now - 8 * 3600000)),
  },
  {
    description: "Illegal construction blocking public road in Ward 6.",
    category: "Roads & Infrastructure", ward: "Ward 6", phone: "+919876543222",
    status: "received", urgencyScore: 67, sentiment: "Concerned",
    department: "Roads Department", vulnerableFlag: false,
    createdAt: Timestamp.fromDate(new Date(now - 20 * 3600000)),
  },

  // Electricity
  {
    description: "Street lights not working in Ward 11 residential area for 2 weeks.",
    category: "Electricity", ward: "Ward 11", phone: "+919876543216",
    status: "received", urgencyScore: 65, sentiment: "Frustrated",
    department: "Electricity Department", vulnerableFlag: false,
    createdAt: Timestamp.fromDate(new Date(now - 24 * 3600000)),
  },
  {
    description: "Power cut every day 6pm to 10pm in Ward 5 for past week.",
    category: "Electricity", ward: "Ward 5", phone: "+919876543217",
    status: "in_progress", urgencyScore: 78, sentiment: "Frustrated",
    department: "Electricity Department", vulnerableFlag: false,
    createdAt: Timestamp.fromDate(new Date(now - 16 * 3600000)),
  },
  {
    description: "Transformer damaged in Ward 10. Whole area without power for 24 hours.",
    category: "Electricity", ward: "Ward 10", phone: "+919876543224",
    status: "in_progress", urgencyScore: 93, sentiment: "Distressed",
    department: "Electricity Department", vulnerableFlag: false,
    createdAt: Timestamp.fromDate(new Date(now - 3 * 3600000)),
  },

  // Sanitation
  {
    description: "Garbage not collected in Ward 5 for 5 days. Severe smell and health hazard.",
    category: "Sanitation", ward: "Ward 5", phone: "+919876543218",
    status: "in_progress", urgencyScore: 72, sentiment: "Frustrated",
    department: "Sanitation Department", vulnerableFlag: false,
    createdAt: Timestamp.fromDate(new Date(now - 36 * 3600000)),
  },
  {
    description: "Open drain overflowing in Ward 8 near school. Children at risk.",
    category: "Sanitation", ward: "Ward 8", phone: "+919876543219",
    status: "assigned", urgencyScore: 85, sentiment: "Distressed",
    department: "Sanitation Department", vulnerableFlag: true,
    createdAt: Timestamp.fromDate(new Date(now - 10 * 3600000)),
  },
  {
    description: "Public toilet in Ward 4 not cleaned for 10 days. Health emergency.",
    category: "Sanitation", ward: "Ward 4", phone: "+919876543223",
    status: "in_progress", urgencyScore: 80, sentiment: "Concerned",
    department: "Sanitation Department", vulnerableFlag: false,
    createdAt: Timestamp.fromDate(new Date(now - 14 * 3600000)),
  },

  // Tax & Finance
  {
    description: "Property tax bill incorrect for past 3 months. Excess amount being charged.",
    category: "Tax & Finance", ward: "Ward 9", phone: "+919876543220",
    status: "resolved", urgencyScore: 45, sentiment: "Frustrated",
    department: "Tax Department", vulnerableFlag: false,
    createdAt: Timestamp.fromDate(new Date(now - 72 * 3600000)),
  },
  {
    description: "Water tax charged twice this month. Need refund and correction.",
    category: "Tax & Finance", ward: "Ward 2", phone: "+919876543221",
    status: "assigned", urgencyScore: 48, sentiment: "Frustrated",
    department: "Tax Department", vulnerableFlag: false,
    createdAt: Timestamp.fromDate(new Date(now - 48 * 3600000)),
  },
];

// ─── CREATE / ENSURE FIREBASE AUTH USERS & FIRESTORE DOCS ────────────────────
async function upsertUser(
  email: string,
  password: string,
  role: string,
  name: string,
  extras: Record<string, string> = {}
): Promise<string> {
  let uid: string;
  try {
    const existing = await authAdmin.getUserByEmail(email);
    uid = existing.uid;
    console.log(`  🔄 Auth user already exists: ${email} (${uid})`);
  } catch {
    const created = await authAdmin.createUser({ email, password, displayName: name });
    uid = created.uid;
    console.log(`  ✅ Created Auth user: ${email} (${uid})`);
  }

  await db.collection("users").doc(uid).set(
    { uid, email, role, name, ...extras, updatedAt: Timestamp.now() },
    { merge: true }
  );
  console.log(`  ✅ Firestore users/${uid} → role=${role}`);
  return uid;
}

async function seed() {
  console.log("🌱 Seeding Firestore with demo data...\n");

  // ── 1. SEED CASES ──────────────────────────────────────────────────────────
  console.log("📋 Seeding 15 cases...");
  for (const c of seedCases) {
    const caseId = `PCRM-2025-${Math.floor(1000 + Math.random() * 9000)}`;

    const timeline: object[] = [
      { title: "Complaint submitted", status: "received", timestamp: c.createdAt.toMillis(), note: "Submitted via Citizen Portal." },
      { title: "AI Classification", status: "analysed", timestamp: c.createdAt.toMillis() + 3 * 60000, note: `AI classified: ${c.category}, urgency ${c.urgencyScore}.` },
    ];
    if (["assigned", "in_progress", "resolved"].includes(c.status)) {
      (timeline as object[]).push({ title: "Assigned to department", status: "assigned", timestamp: c.createdAt.toMillis() + 15 * 60000, note: `Forwarded to ${c.department}.` });
    }
    if (["in_progress", "resolved"].includes(c.status)) {
      (timeline as object[]).push({ title: "Investigation in progress", status: "in_progress", timestamp: c.createdAt.toMillis() + 3600000, note: "Field officer dispatched." });
    }
    if (c.status === "resolved") {
      (timeline as object[]).push({ title: "Resolution & Fix", status: "resolved", timestamp: c.createdAt.toMillis() + 4 * 3600000, note: "Issue resolved. Citizen notified via SMS." });
    }

    await db.collection("cases").doc(caseId).set({
      ...c,
      caseId,
      case_number: caseId,
      citizen_phone: c.phone,
      ai: { urgency_score: c.urgencyScore, sentiment: c.sentiment, department: c.department, vulnerable_flag: c.vulnerableFlag, category: c.category },
      timeline,
    });
    console.log(`  ✅ ${caseId} — ${c.category} · ${c.ward} · ${c.status}`);
  }

  // ── 2. SEED CASCADE ALERT ──────────────────────────────────────────────────
  console.log("\n🚨 Seeding cascade alert...");
  await db.collection("alerts").doc("cascade-ward7-water").set({
    type: "cascade",
    ward: "Ward 7",
    category: "Water Supply",
    caseCount: 4,
    message: "Water Supply · Ward 7 · 4 complaints in 6 hours · Probable systemic issue",
    severity: "CRITICAL",
    isResolved: false,
    createdAt: Timestamp.fromDate(new Date(now - 1 * 3600000)),
  });
  console.log("  ✅ alerts/cascade-ward7-water seeded");

  // ── 3. CREATE DEMO AUTH USERS ─────────────────────────────────────────────
  console.log("\n👤 Creating demo users...");
  await upsertUser("staff@pune.gov.in", "Demo@1234", "staff", "Priya Sharma", {
    department: "Water Supply Department",
  });
  await upsertUser("mla@pune.gov.in", "Demo@1234", "mla", "MLA Sharma", {
    constituency: "Pune Ward Cluster",
  });

  console.log("\n🎉 Done! 15 cases + cascade alert + 2 users seeded.");
  console.log("\n🔑 Demo credentials:");
  console.log("   Staff: staff@pune.gov.in / Demo@1234 → /dashboard");
  console.log("   MLA:   mla@pune.gov.in   / Demo@1234 → /mla");
  process.exit(0);
}

seed().catch((e) => { console.error("❌ Seed error:", e.message); process.exit(1); });
