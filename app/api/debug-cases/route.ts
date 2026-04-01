import { NextResponse } from "next/server";
import { getFirebaseAdminDb } from "../../../lib/firebase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getFirebaseAdminDb();
    const q = db.collection("cases")
      .where("status", "in", ["received", "analysed", "assigned", "in_progress", "resolved"])
      .limit(20);
    const snap = await q.get();
    return NextResponse.json({ ok: true, count: snap.size });
  } catch(e: any) {
    return NextResponse.json({ error: e.message });
  }
}
