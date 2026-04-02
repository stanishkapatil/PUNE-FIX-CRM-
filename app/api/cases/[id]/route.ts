import { NextResponse } from "next/server";
import { getFirebaseAdminDb } from "../../../../lib/firebase/admin";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
       return NextResponse.json({ error: "Missing case ID" }, { status: 400 });
    }

    const db = getFirebaseAdminDb();
    const docRef = db.collection("cases").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, case: docSnap.data() });
  } catch (error: any) {
    console.error("Error fetching case:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch" }, { status: 500 });
  }
}
