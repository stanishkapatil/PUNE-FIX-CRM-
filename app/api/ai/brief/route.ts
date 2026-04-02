import { NextResponse } from "next/server";
import { getFirebaseAdminDb } from "../../../../lib/firebase/admin";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function GET(req: Request) {
  try {
    const db = getFirebaseAdminDb();
    
    // Attempt to fetch open cases
    const casesSnap = await db.collection("cases")
        .where("status", "!=", "resolved")
        .limit(5)
        .get();

    const cases = casesSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));

    if (cases.length === 0) {
        return NextResponse.json({ brief: "There are currently no open cases. The city system is running smoothly." });
    }

    if (!process.env.GEMINI_API_KEY) {
        // Fallback brief if no Gemini key
        return NextResponse.json({ brief: `There are ${cases.length} active cases right now. The highest priority is ${cases[0]?.category} in ${cases[0]?.ward}.` });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    const casesText = cases.map(c => `ID: ${c.id}, Category: ${c.category}, Ward: ${c.ward}, Urgency: ${c.urgencyScore}, Description: ${c.description}`).join("\n");

    const prompt = `You are an AI assistant for a city municipal corporation. Summarize the following open cases into a brief 3-sentence plain English summary for a dashboard. Emphasize urgent issues and patterns if any.

    Cases:
    ${casesText}`;

    const result = await model.generateContent(prompt);
    let brief = result.response.text().trim();

    return NextResponse.json({ brief });

  } catch (error: any) {
    console.error("Error generating brief:", error);
    return NextResponse.json({ error: error.message || "Failed to generate brief" }, { status: 500 });
  }
}
