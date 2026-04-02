import { NextResponse } from "next/server";
import { getFirebaseAdminDb } from "../../../../lib/firebase/admin";
import { GoogleGenerativeAI } from "@google/generative-ai";



// LAYER 2: In-memory rate limit store (demo purposes — use Redis in production)
const rateLimitStore = new Map<string, { count: number; firstRequest: number }>();
const RATE_LIMIT_MAX = 3;        // max 3 complaints
const RATE_LIMIT_WINDOW = 3600000; // per 1 hour (in ms)

function getRateLimitKey(request: Request): string {
  // Get IP from headers (works on Vercel and local)
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  return ip;
}

function checkRateLimit(key: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now - record.firstRequest > RATE_LIMIT_WINDOW) {
    // New window — reset
    rateLimitStore.set(key, { count: 1, firstRequest: now });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetIn: RATE_LIMIT_WINDOW };
  }

  if (record.count >= RATE_LIMIT_MAX) {
    const resetIn = RATE_LIMIT_WINDOW - (now - record.firstRequest);
    return { allowed: false, remaining: 0, resetIn };
  }

  record.count += 1;
  rateLimitStore.set(key, record);
  return { allowed: true, remaining: RATE_LIMIT_MAX - record.count, resetIn: RATE_LIMIT_WINDOW - (now - record.firstRequest) };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { description, category, ward, phone, photoBase64 } = body;

    if (!description || !category || !ward || !phone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }



    // Layer 2: Rate Limiting Check
    const rateLimitKey = getRateLimitKey(req);
    const rateLimit = checkRateLimit(rateLimitKey);

    if (!rateLimit.allowed) {
      const minutesLeft = Math.ceil(rateLimit.resetIn / 60000);
      return NextResponse.json(
        {
          error: `Too many submissions. Maximum ${RATE_LIMIT_MAX} complaints per hour allowed. Try again in ${minutesLeft} minutes.`,
          code: 'RATE_LIMIT_EXCEEDED'
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
            'X-RateLimit-Remaining': '0',
            'Retry-After': String(Math.ceil(rateLimit.resetIn / 1000)),
          }
        }
      );
    }

    // Layer 3: AI Bouncer validation
    let requiresManualReview = false;
    let aiValidationFlags: string[] = [];

    try {
      // Get the origin for relative absolute URL
      const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const validationResponse = await fetch(
        `${origin}/api/ai/validate-complaint`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description, category, ward }),
        }
      );
      
      if (validationResponse.ok) {
          const validation = await validationResponse.json();

          if (!validation.isGenuine && validation.confidence > 80) {
            return NextResponse.json(
              {
                error: 'Your submission could not be processed. Please describe your civic issue clearly.',
                reason: validation.reason,
                code: 'AI_BOUNCER_REJECTED'
              },
              { status: 422 }
            );
          }

          // If flagged but not certain, log it and allow with a review flag
          if (!validation.isGenuine && validation.confidence <= 80) {
            requiresManualReview = true;
            aiValidationFlags = validation.flags || [];
          }
      }
    } catch (e) {
      // Fail open — never block citizen due to AI error
      console.warn('AI validation skipped due to error', e);
    }

    const random4Digit = Math.floor(1000 + Math.random() * 9000);
    const caseId = `PCRM-2024-${random4Digit}`;

    let aiAnalysis = null;
    let urgencyScore = 0;

    // Inline Gemini Call
    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro", generationConfig: { responseMimeType: "application/json" } });
        
        const prompt = `Analyze this civic complaint. Return ONLY valid JSON with these exact fields: 
        {"category": string, "urgency_score": number (0-100), "sentiment": string, "department": string, "suggested_response": string, "confidence": number (0-1), "vulnerable_flag": boolean}
        
        Complaint: "${description}"
        User Selected Category: "${category}"`;

        const result = await model.generateContent(prompt);
        const textResponse = result.response.text();
        const parsed = JSON.parse(textResponse);
        
        aiAnalysis = parsed;
        urgencyScore = parsed.urgency_score || 0;
      } catch (geminiError) {
        console.error("Gemini AI API Error:", geminiError);
        // We continue saving even if AI fails
      }
    } else {
        console.warn("GEMINI_API_KEY is not defined, skipping AI analysis.");
    }

    const newCase = {
      id: caseId,
      description,
      category,
      ward,
      phone,
      photoBase64: photoBase64 || null,
      status: "received",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      urgencyScore,
      aiAnalysis,
      requiresManualReview,
      aiValidationFlags,
      timeline: [
        {
          id: 1,
          status: "received",
          title: "Received",
          timestamp: new Date().toISOString()
        }
      ]
    };

    if (aiAnalysis) {
        newCase.timeline.push({
            id: 2,
            status: "ai_analysed",
            title: "AI Analysed",
            timestamp: new Date().toISOString()
        });
    }

    const db = getFirebaseAdminDb();
    await db.collection("cases").doc(caseId).set(newCase);

    return NextResponse.json(
      { success: true, caseId },
      { headers: { 'X-RateLimit-Remaining': String(rateLimit.remaining) } }
    );

  } catch (error: any) {
    console.error("Error submitting complaint:", error);
    return NextResponse.json({ error: error.message || "Failed to submit" }, { status: 500 });
  }
}
