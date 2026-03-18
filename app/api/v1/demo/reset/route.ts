import "server-only";

import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { FieldValue, Timestamp, type WriteBatch } from "firebase-admin/firestore";

import { firebaseAdminDb } from "../../../../../lib/firebase/admin";
import { generateCaseNumber } from "../../../../../lib/utils/caseNumber";
import { getSLADuration, getSLADeadline } from "../../../../../lib/utils/sla";
import { calculatePriorityScore } from "../../../../../lib/scoring/priority";

export const runtime = "nodejs";

function jsonError(status: number, code: string, error: string) {
  return NextResponse.json({ error, code }, { status });
}

function demoAllowed(req: NextRequest): boolean {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const isLocal = appUrl.includes("localhost") || appUrl.includes("127.0.0.1");
  const headerToken = req.headers.get("x-demo-token");
  return isLocal || headerToken === "PCRM2026";
}

async function commitBatches(batches: WriteBatch[]) {
  for (const b of batches) {
    await b.commit();
  }
}

async function deleteRecentCases(nowMs: number) {
  const since = nowMs - 24 * 60 * 60 * 1000;
  const snap = await firebaseAdminDb.collection("cases").where("created_at_ms", ">=", since).get();

  const batches: WriteBatch[] = [];
  let batch = firebaseAdminDb.batch();
  let ops = 0;

  for (const d of snap.docs) {
    // delete timeline subcollection docs (best-effort)
    try {
      const timeline = await d.ref.collection("timeline").get();
      for (const t of timeline.docs) {
        batch.delete(t.ref);
        ops += 1;
        if (ops >= 450) {
          batches.push(batch);
          batch = firebaseAdminDb.batch();
          ops = 0;
        }
      }
    } catch {
      // ignore
    }

    batch.delete(d.ref);
    ops += 1;
    if (ops >= 450) {
      batches.push(batch);
      batch = firebaseAdminDb.batch();
      ops = 0;
    }
  }

  if (ops > 0) batches.push(batch);
  await commitBatches(batches);

  return snap.size;
}

async function deactivateAlerts() {
  const snap = await firebaseAdminDb.collection("alerts").where("is_active", "==", true).get();
  const batches: WriteBatch[] = [];
  let batch = firebaseAdminDb.batch();
  let ops = 0;
  for (const d of snap.docs) {
    batch.set(d.ref, { is_active: false, updated_at: FieldValue.serverTimestamp() }, { merge: true });
    ops += 1;
    if (ops >= 450) {
      batches.push(batch);
      batch = firebaseAdminDb.batch();
      ops = 0;
    }
  }
  if (ops > 0) batches.push(batch);
  await commitBatches(batches);
  return snap.size;
}

type SeedCase = {
  citizen_name: string;
  citizen_phone: string;
  citizen_address: string;
  ward: string;
  category: string;
  sub_category: string;
  department: string;
  title: string;
  description: string;
  status: "received" | "analysed" | "assigned" | "in_progress" | "resolved" | "closed";
  urgency_score: number;
  sentiment: "positive" | "neutral" | "negative" | "urgent";
  confidence: number;
  vulnerable_flag: boolean;
  is_recurring: boolean;
  assigned_to_name?: string;
  resolved_offset_hours?: number; // if resolved/closed, createdAt + offset
};

function seedData(): SeedCase[] {
  const data: SeedCase[] = [
    {
      citizen_name: "Ramesh Kumar",
      citizen_phone: "+919876543210",
      citizen_address: "Kothrud, Pune",
      ward: "Ward 7",
      category: "Water Supply",
      sub_category: "No water supply",
      department: "Water Supply",
      title: "No water supply since morning",
      description: "No water supply since 6 AM in our society. Elderly residents are facing difficulty. Please restore supply urgently.",
      status: "received",
      urgency_score: 82,
      sentiment: "urgent",
      confidence: 88,
      vulnerable_flag: true,
      is_recurring: true,
    },
    {
      citizen_name: "Priya Sharma",
      citizen_phone: "+919845612345",
      citizen_address: "Baner, Pune",
      ward: "Ward 7",
      category: "Water Supply",
      sub_category: "Low water pressure",
      department: "Water Supply",
      title: "Very low water pressure",
      description: "Water pressure is extremely low for the last 2 days. Tanks are not filling. Please check the main line pressure.",
      status: "analysed",
      urgency_score: 66,
      sentiment: "negative",
      confidence: 83,
      vulnerable_flag: false,
      is_recurring: true,
    },
    {
      citizen_name: "Mohammed Iqbal",
      citizen_phone: "+919765432189",
      citizen_address: "Aundh, Pune",
      ward: "Ward 7",
      category: "Water Supply",
      sub_category: "Leakage",
      department: "Water Supply",
      title: "Water leakage near road divider",
      description: "There is continuous water leakage near the road divider causing wastage and slippery road. Please repair the pipeline.",
      status: "assigned",
      urgency_score: 58,
      sentiment: "neutral",
      confidence: 80,
      vulnerable_flag: false,
      is_recurring: false,
      assigned_to_name: "Sachin Patil",
    },
    {
      citizen_name: "Sunita Devi",
      citizen_phone: "+919812345678",
      citizen_address: "Hadapsar, Pune",
      ward: "Ward 3",
      category: "Sanitation",
      sub_category: "Garbage not collected",
      department: "Sanitation",
      title: "Garbage pickup missed",
      description: "Garbage has not been collected for 3 days. The area is smelling and stray dogs are tearing the waste bags.",
      status: "in_progress",
      urgency_score: 72,
      sentiment: "negative",
      confidence: 86,
      vulnerable_flag: false,
      is_recurring: true,
      assigned_to_name: "Anita Jadhav",
    },
    {
      citizen_name: "Amit Kulkarni",
      citizen_phone: "+919700112233",
      citizen_address: "Shivajinagar, Pune",
      ward: "Ward 1",
      category: "Roads & Infrastructure",
      sub_category: "Pothole",
      department: "Roads & Infrastructure",
      title: "Large pothole near bus stop",
      description: "A large pothole near the bus stop is causing accidents. Two-wheeler riders are slipping at night. Please fix urgently.",
      status: "resolved",
      urgency_score: 79,
      sentiment: "urgent",
      confidence: 90,
      vulnerable_flag: false,
      is_recurring: false,
      assigned_to_name: "Rahul Deshmukh",
      resolved_offset_hours: 30,
    },
    {
      citizen_name: "Neha Singh",
      citizen_phone: "+919822334455",
      citizen_address: "Wakad, Pune",
      ward: "Ward 5",
      category: "Electricity",
      sub_category: "Street light not working",
      department: "Electricity",
      title: "Street light off for a week",
      description: "Street light in front of our building is not working for a week. It is unsafe at night. Please repair at the earliest.",
      status: "assigned",
      urgency_score: 61,
      sentiment: "negative",
      confidence: 84,
      vulnerable_flag: false,
      is_recurring: true,
      assigned_to_name: "Vijay Kadam",
    },
    {
      citizen_name: "Kavita Joshi",
      citizen_phone: "+919900778899",
      citizen_address: "Pimpri, Pune",
      ward: "Ward 10",
      category: "Tax & Finance",
      sub_category: "Property tax receipt issue",
      department: "Tax & Finance",
      title: "Property tax receipt not generated",
      description: "After paying property tax online, the receipt is not generated. Please help with the payment confirmation and receipt.",
      status: "analysed",
      urgency_score: 45,
      sentiment: "neutral",
      confidence: 78,
      vulnerable_flag: false,
      is_recurring: false,
    },
    {
      citizen_name: "Arjun Nair",
      citizen_phone: "+919811223344",
      citizen_address: "Kalyani Nagar, Pune",
      ward: "Ward 12",
      category: "General",
      sub_category: "Noise complaint",
      department: "General",
      title: "Loud music late night",
      description: "There is loud music from a nearby venue after 11 PM. It is disturbing residents and students. Please take action as per rules.",
      status: "received",
      urgency_score: 40,
      sentiment: "negative",
      confidence: 77,
      vulnerable_flag: false,
      is_recurring: true,
    },
    {
      citizen_name: "Deepak Verma",
      citizen_phone: "+919812000111",
      citizen_address: "Sinhagad Road, Pune",
      ward: "Ward 8",
      category: "Roads & Infrastructure",
      sub_category: "Broken manhole cover",
      department: "Roads & Infrastructure",
      title: "Open manhole on main road",
      description: "An open manhole on the main road is dangerous. Please place a cover and barricade immediately to prevent accidents.",
      status: "in_progress",
      urgency_score: 88,
      sentiment: "urgent",
      confidence: 92,
      vulnerable_flag: false,
      is_recurring: false,
      assigned_to_name: "Rahul Deshmukh",
    },
    {
      citizen_name: "Sanjay Gupta",
      citizen_phone: "+919899001122",
      citizen_address: "Viman Nagar, Pune",
      ward: "Ward 14",
      category: "Sanitation",
      sub_category: "Drain overflow",
      department: "Sanitation",
      title: "Drain overflow near market",
      description: "Drain is overflowing near the market area, causing foul smell and mosquito issues. Please clean and clear blockage.",
      status: "assigned",
      urgency_score: 70,
      sentiment: "negative",
      confidence: 85,
      vulnerable_flag: false,
      is_recurring: true,
      assigned_to_name: "Anita Jadhav",
    },
    // 10 more realistic cases
    {
      citizen_name: "Farah Khan",
      citizen_phone: "+919812341234",
      citizen_address: "Camp, Pune",
      ward: "Ward 2",
      category: "Electricity",
      sub_category: "Transformer noise",
      department: "Electricity",
      title: "Transformer making loud noise",
      description: "Transformer near our lane is making loud noise and sparks occasionally. Please inspect to avoid any hazard.",
      status: "analysed",
      urgency_score: 76,
      sentiment: "urgent",
      confidence: 82,
      vulnerable_flag: false,
      is_recurring: false,
    },
    {
      citizen_name: "Nitin Pawar",
      citizen_phone: "+919876500321",
      citizen_address: "Dhanori, Pune",
      ward: "Ward 6",
      category: "General",
      sub_category: "Stray dog menace",
      department: "General",
      title: "Stray dogs causing fear",
      description: "Stray dogs are chasing children near the school gate in the evening. Please arrange a safety drive and vaccination.",
      status: "assigned",
      urgency_score: 64,
      sentiment: "urgent",
      confidence: 79,
      vulnerable_flag: true,
      is_recurring: true,
      assigned_to_name: "Sachin Patil",
    },
    {
      citizen_name: "Meera Iyer",
      citizen_phone: "+919811009988",
      citizen_address: "Pashan, Pune",
      ward: "Ward 4",
      category: "Tax & Finance",
      sub_category: "Water bill mismatch",
      department: "Tax & Finance",
      title: "Water bill amount seems incorrect",
      description: "This month's water bill is unusually high compared to previous months. Please verify meter reading and correct the bill.",
      status: "received",
      urgency_score: 38,
      sentiment: "neutral",
      confidence: 76,
      vulnerable_flag: false,
      is_recurring: false,
    },
    {
      citizen_name: "Suresh Yadav",
      citizen_phone: "+919700443322",
      citizen_address: "Yerwada, Pune",
      ward: "Ward 9",
      category: "Sanitation",
      sub_category: "Public toilet maintenance",
      department: "Sanitation",
      title: "Public toilet needs cleaning",
      description: "Public toilet near the park is not cleaned regularly and lacks water. Please send cleaning staff and ensure maintenance.",
      status: "resolved",
      urgency_score: 55,
      sentiment: "negative",
      confidence: 87,
      vulnerable_flag: false,
      is_recurring: true,
      assigned_to_name: "Anita Jadhav",
      resolved_offset_hours: 40,
    },
    {
      citizen_name: "Pooja Desai",
      citizen_phone: "+919822111222",
      citizen_address: "Kondhwa, Pune",
      ward: "Ward 11",
      category: "Roads & Infrastructure",
      sub_category: "Road digging not restored",
      department: "Roads & Infrastructure",
      title: "Road left dug and unsafe",
      description: "After cable work, the road was left dug and uneven. It is difficult for vehicles and pedestrians. Please restore properly.",
      status: "in_progress",
      urgency_score: 68,
      sentiment: "negative",
      confidence: 84,
      vulnerable_flag: false,
      is_recurring: false,
      assigned_to_name: "Rahul Deshmukh",
    },
    {
      citizen_name: "Rajesh Mishra",
      citizen_phone: "+919812777666",
      citizen_address: "Karve Nagar, Pune",
      ward: "Ward 13",
      category: "Water Supply",
      sub_category: "Contaminated water",
      department: "Water Supply",
      title: "Water is muddy and smells",
      description: "Tap water is muddy and smells bad since yesterday. We are worried about health issues. Please test and fix supply.",
      status: "assigned",
      urgency_score: 90,
      sentiment: "urgent",
      confidence: 91,
      vulnerable_flag: true,
      is_recurring: false,
      assigned_to_name: "Sachin Patil",
    },
    {
      citizen_name: "Anjali Gupta",
      citizen_phone: "+919700998877",
      citizen_address: "Nigdi, Pune",
      ward: "Ward 15",
      category: "Electricity",
      sub_category: "Power fluctuation",
      department: "Electricity",
      title: "Frequent power fluctuations",
      description: "Power is fluctuating frequently in our area, damaging appliances. Please check the line and stabilize supply.",
      status: "received",
      urgency_score: 62,
      sentiment: "negative",
      confidence: 80,
      vulnerable_flag: false,
      is_recurring: true,
    },
    {
      citizen_name: "Imran Sheikh",
      citizen_phone: "+919811223355",
      citizen_address: "Khadki, Pune",
      ward: "Ward 6",
      category: "General",
      sub_category: "Encroachment on footpath",
      department: "General",
      title: "Footpath blocked by vendors",
      description: "Footpath is blocked by vendors near the junction, forcing pedestrians onto the road. Please clear encroachment.",
      status: "closed",
      urgency_score: 44,
      sentiment: "neutral",
      confidence: 78,
      vulnerable_flag: false,
      is_recurring: true,
      resolved_offset_hours: 60,
    },
    {
      citizen_name: "Shalini Kapoor",
      citizen_phone: "+919812340987",
      citizen_address: "Bavdhan, Pune",
      ward: "Ward 4",
      category: "Tax & Finance",
      sub_category: "Trade license renewal",
      department: "Tax & Finance",
      title: "Trade license renewal pending",
      description: "Trade license renewal application is pending for weeks. Please update the status and process the renewal.",
      status: "assigned",
      urgency_score: 52,
      sentiment: "neutral",
      confidence: 79,
      vulnerable_flag: false,
      is_recurring: false,
      assigned_to_name: "Vijay Kadam",
    },
    {
      citizen_name: "Gopal Patil",
      citizen_phone: "+919899123456",
      citizen_address: "Kharadi, Pune",
      ward: "Ward 12",
      category: "Sanitation",
      sub_category: "Mosquito breeding",
      department: "Sanitation",
      title: "Stagnant water causing mosquitoes",
      description: "Stagnant water near the construction site is breeding mosquitoes. Please spray and ensure drainage.",
      status: "analysed",
      urgency_score: 59,
      sentiment: "negative",
      confidence: 82,
      vulnerable_flag: false,
      is_recurring: true,
    },
  ];
  return data;
}

export async function POST(req: NextRequest) {
  if (!demoAllowed(req)) return jsonError(403, "DEMO_FORBIDDEN", "Demo endpoints are restricted");

  const now = new Date();
  const nowMs = now.getTime();

  try {
    await deleteRecentCases(nowMs);
    await deactivateAlerts();

    const seeds = seedData();

    const batches: WriteBatch[] = [];
    let batch = firebaseAdminDb.batch();
    let ops = 0;

    for (let i = 0; i < seeds.length; i++) {
      const s = seeds[i]!;
      const caseId = randomUUID();
      const createdAt = new Date(nowMs - (i + 1) * 60 * 60 * 1000); // stagger hourly
      const createdMs = createdAt.getTime();

      const caseNumber = generateCaseNumber(createdAt);
      const slaHours = getSLADuration(s.category);
      const deadline = getSLADeadline(s.category, createdAt);

      const resolvedAt =
        (s.status === "resolved" || s.status === "closed") && typeof s.resolved_offset_hours === "number"
          ? new Date(createdMs + s.resolved_offset_hours * 60 * 60 * 1000)
          : null;

      const priority = calculatePriorityScore({
        urgency_score: s.urgency_score,
        sla_deadline: deadline,
        sla_created_at: createdAt,
        vulnerable_flag: s.vulnerable_flag,
        is_recurring: s.is_recurring,
      });

      const ref = firebaseAdminDb.collection("cases").doc(caseId);
      batch.set(ref, {
        id: caseId,
        case_number: caseNumber,
        citizen_name: s.citizen_name,
        citizen_phone: s.citizen_phone,
        citizen_email: null,
        citizen_address: s.citizen_address,
        ward: s.ward,
        title: s.title,
        description: s.description,
        category: s.category,
        sub_category: s.sub_category,
        department: s.department,
        attachments: [],
        photo: null,
        status: s.status,
        assigned_to_uid: null,
        assigned_to_name: s.assigned_to_name ?? null,
        assigned_at: s.assigned_to_name ? Timestamp.fromDate(new Date(createdMs + 2 * 60 * 60 * 1000)) : null,
        resolved_at: resolvedAt ? Timestamp.fromDate(resolvedAt) : null,
        closed_at: s.status === "closed" && resolvedAt ? Timestamp.fromDate(new Date(resolvedAt.getTime() + 6 * 60 * 60 * 1000)) : null,
        ai: {
          category: s.category,
          sub_category: s.sub_category,
          urgency_score: s.urgency_score,
          sentiment: s.sentiment,
          department: s.department,
          suggested_response:
            "We have noted your complaint and are coordinating with the concerned department. Updates will be shared on your tracking link.",
          confidence: s.confidence,
          vulnerable_flag: s.vulnerable_flag,
        },
        human_review_flag: s.confidence < 75,
        ai_classified_at: Timestamp.fromDate(new Date(createdMs + 5 * 60 * 1000)),
        is_recurring: s.is_recurring,
        vulnerable_flag: s.vulnerable_flag,
        sla_hours: slaHours,
        sla_deadline: Timestamp.fromDate(deadline),
        priority: {
          priority_score: priority.priority_score,
          sla_hours_left: priority.sla_hours_left,
          sla_percent_left: priority.sla_percent_left,
          sla_remaining_inverse: priority.sla_remaining_inverse,
        },
        created_at: Timestamp.fromDate(createdAt),
        updated_at: Timestamp.fromDate(new Date(createdMs + 30 * 60 * 1000)),
        created_at_ms: createdMs,
        updated_at_ms: createdMs + 30 * 60 * 1000,
        demo_seed: true,
      });
      ops += 1;

      const timelineRef = ref.collection("timeline").doc(randomUUID());
      batch.set(timelineRef, {
        id: timelineRef.id,
        case_id: caseId,
        type: "created",
        message: `Case created and received (Case No: ${caseNumber}).`,
        created_at: Timestamp.fromDate(createdAt),
        actor_name: "System",
      });
      ops += 1;

      if (ops >= 450) {
        batches.push(batch);
        batch = firebaseAdminDb.batch();
        ops = 0;
      }
    }

    if (ops > 0) batches.push(batch);
    await commitBatches(batches);

    return NextResponse.json({ success: true, casesSeeded: seeds.length }, { status: 200 });
  } catch {
    return jsonError(500, "DEMO_RESET_FAILED", "Failed to reset demo data");
  }
}

