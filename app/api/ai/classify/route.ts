import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { complaintText } = body;

    if (!complaintText) {
      return NextResponse.json({ error: "Missing complaintText" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro", generationConfig: { responseMimeType: "application/json" } });
    
    const prompt = `Analyze this civic complaint. Return ONLY valid JSON with these exact fields: 
    {"category": string, "urgency_score": number (0-100), "sentiment": string, "department": string, "suggested_response": string, "confidence": number (0-1), "vulnerable_flag": boolean}
    
    Complaint: "${complaintText}"`;

    const result = await model.generateContent(prompt);
    const textResponse = result.response.text();
    const parsed = JSON.parse(textResponse);

    return NextResponse.json(parsed);

  } catch (error: any) {
    console.error("Error classifying complaint:", error);
    return NextResponse.json({ error: error.message || "Failed to classify" }, { status: 500 });
  }
}
