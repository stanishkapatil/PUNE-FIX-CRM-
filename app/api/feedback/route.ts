import { NextResponse } from "next/server";
import { getFirebaseAdminDb } from "../../../lib/firebase/admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { caseId, rating, comment } = body;

    if (!caseId || typeof rating !== "number") {
      return NextResponse.json({ error: "Missing required fields: caseId or rating" }, { status: 400 });
    }

    const db = getFirebaseAdminDb();
    
    // Save the feedback
    const feedbackRef = db.collection("feedback").doc();
    await feedbackRef.set({
        caseId,
        rating,
        comment: comment || "",
        createdAt: new Date().toISOString()
    });

    // If rating is bad, flag the case
    if (rating <= 2) {
        const caseRef = db.collection("cases").doc(caseId);
        await caseRef.update({
            requiresSupervisorReview: true,
            supervisorFlagReason: "Low citizen rating received after resolution",
            updatedAt: new Date().toISOString()
        });
    }

    return NextResponse.json({ success: true, message: "Feedback submitted successfully" });

  } catch (error: any) {
    console.error("Error submitting feedback:", error);
    return NextResponse.json({ error: error.message || "Failed to submit feedback" }, { status: 500 });
  }
}
