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
const Timestamp = admin.firestore.Timestamp;
const now = Date.now();

const seedCases = [
  {
    description: "No water supply in Ward 7 for 3 days. Multiple families affected including elderly residents.",
    category: "Water Supply", ward: "Ward 7", phone: "+919876543210",
    status: "in_progress", urgencyScore: 94, sentiment: "Distressed",
    department: "Water Supply Department", vulnerableFlag: true,
    createdAt: Timestamp.fromDate(new Date(now - 6 * 3600000)),
  },
  {
    description: "Large pothole on main road near Ward 3 market causing accidents daily.",
    category: "Roads & Infrastructure", ward: "Ward 3", phone: "+919876543211",
    status: "assigned", urgencyScore: 76, sentiment: "Frustrated",
    department: "Roads Department", vulnerableFlag: false,
    createdAt: Timestamp.fromDate(new Date(now - 12 * 3600000)),
  },
  {
    description: "Street lights not working in Ward 11 residential area for 2 weeks. Safety issue at night.",
    category: "Electricity", ward: "Ward 11", phone: "+919876543212",
    status: "received", urgencyScore: 68, sentiment: "Frustrated",
    department: "Electricity Department", vulnerableFlag: false,
    createdAt: Timestamp.fromDate(new Date(now - 24 * 3600000)),
  },
  {
    description: "Water supply pipe burst near Ward 7 school. Children cannot attend school.",
    category: "Water Supply", ward: "Ward 7", phone: "+919876543213",
    status: "assigned", urgencyScore: 91, sentiment: "Distressed",
    department: "Water Supply Department", vulnerableFlag: true,
    createdAt: Timestamp.fromDate(new Date(now - 4 * 3600000)),
  },
  {
    description: "Garbage not collected in Ward 5 for 5 days. Severe smell and health hazard.",
    category: "Sanitation", ward: "Ward 5", phone: "+919876543214",
    status: "in_progress", urgencyScore: 72, sentiment: "Frustrated",
    department: "Sanitation Department", vulnerableFlag: false,
    createdAt: Timestamp.fromDate(new Date(now - 36 * 3600000)),
  },
  {
    description: "Ward 7 water supply completely cut off. Third complaint from same building in one week.",
    category: "Water Supply", ward: "Ward 7", phone: "+919876543215",
    status: "received", urgencyScore: 96, sentiment: "Distressed",
    department: "Water Supply Department", vulnerableFlag: false,
    createdAt: Timestamp.fromDate(new Date(now - 2 * 3600000)),
  },
  {
    description: "Property tax bill incorrect for past 3 months. Excess amount being charged.",
    category: "Tax & Finance", ward: "Ward 9", phone: "+919876543216",
    status: "resolved", urgencyScore: 45, sentiment: "Frustrated",
    department: "Tax Department", vulnerableFlag: false,
    createdAt: Timestamp.fromDate(new Date(now - 72 * 3600000)),
  },
  {
    description: "Sewage overflow near Ward 2 residential colony. Children playing nearby are at risk.",
    category: "Sanitation", ward: "Ward 2", phone: "+919876543217",
    status: "assigned", urgencyScore: 85, sentiment: "Distressed",
    department: "Sanitation Department", vulnerableFlag: true,
    createdAt: Timestamp.fromDate(new Date(now - 8 * 3600000)),
  },
  {
    description: "Electricity transformer making loud noise and sparks in Ward 6. Fire hazard.",
    category: "Electricity", ward: "Ward 6", phone: "+919876543218",
    status: "in_progress", urgencyScore: 88, sentiment: "Anxious",
    department: "Electricity Department", vulnerableFlag: false,
    createdAt: Timestamp.fromDate(new Date(now - 3 * 3600000)),
  },
  {
    description: "Ward 10 park drainage blocked causing mosquito breeding. Dengue risk increasing.",
    category: "Sanitation", ward: "Ward 10", phone: "+919876543219",
    status: "received", urgencyScore: 70, sentiment: "Concerned",
    department: "Public Health Department", vulnerableFlag: false,
    createdAt: Timestamp.fromDate(new Date(now - 48 * 3600000)),
  },
];

async function seed() {
  console.log("🌱 Seeding Firestore with demo data...\n");

  for (const c of seedCases) {
    const caseId = `PCRM-2024-${Math.floor(1000 + Math.random() * 9000)}`;

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

  await db.collection("users").doc("demo-staff-001").set({ email: "staff@test.com", role: "staff", name: "Officer Kumar" });
  console.log("  ✅ Seeded user role: staff@test.com (role=staff)");

  await db.collection("users").doc("demo-mla-001").set({ email: "mla@test.com", role: "mla", name: "Hon. MLA Kothrud" });
  console.log("  ✅ Seeded user role: mla@test.com (role=mla)");

  console.log("\n🎉 Done! 10 cases + 2 users seeded.");
  console.log("⚠️  IMPORTANT: Create Firebase Auth accounts manually:");
  console.log("   staff@test.com / Demo@1234 → copy UID → update users/demo-staff-001 doc id to that UID");
  console.log("   mla@test.com   / Demo@1234 → copy UID → update users/demo-mla-001 doc id to that UID");
  process.exit(0);
}

seed().catch((e) => { console.error("❌ Seed error:", e.message); process.exit(1); });
