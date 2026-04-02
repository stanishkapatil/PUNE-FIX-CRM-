import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface ValidationResult {
  isGenuine: boolean;
  confidence: number;
  reason: string;
  flags: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { description, category, ward } = await request.json();

    // Quick local checks first (no AI cost)
    const localFlags: string[] = [];

    // Check 1: Too short
    if (!description || description.trim().length < 15) {
      return NextResponse.json({
        isGenuine: false,
        confidence: 99,
        reason: 'Complaint description is too short to be a real grievance.',
        flags: ['TOO_SHORT']
      });
    }

    // Check 2: Gibberish detection (keyboard mashing pattern)
    const gibberishPattern = /^[^aeiou\\s]{6,}|(.)\\1{4,}/i;
    if (gibberishPattern.test(description.replace(/\\s/g, ''))) {
      localFlags.push('POSSIBLE_GIBBERISH');
    }

    // Check 3: All same characters / keyboard spam
    const uniqueChars = new Set(description.toLowerCase().replace(/\\s/g, '')).size;
    if (uniqueChars < 5 && description.length > 10) {
      return NextResponse.json({
        isGenuine: false,
        confidence: 95,
        reason: 'Text appears to be keyboard spam.',
        flags: ['KEYBOARD_SPAM']
      });
    }

    // Check 4: Category-description mismatch via Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const prompt = `
You are a complaint validation AI for a government grievance portal in Pune, India.
Analyze this citizen complaint submission and determine if it is a genuine civic complaint.

Complaint text: "${description}"
Selected category: "${category}"
Selected ward: "${ward}"

Return ONLY valid JSON with no extra text:
{
  "isGenuine": true or false,
  "confidence": number between 0-100,
  "reason": "one sentence explanation",
  "flags": ["array of flags: GIBBERISH | SPAM | CATEGORY_MISMATCH | OFFENSIVE | TEST_SUBMISSION | GENUINE"]
}

Rules:
- Mark as NOT genuine if: text is random characters, clearly a test like "test test test", offensive/abusive language, completely unrelated to the selected category, or makes no logical sense as a civic complaint
- Mark as genuine if: describes a real problem a citizen in Pune might face, even if grammar is poor or written in broken English
- Be lenient — a frustrated citizen may write poorly but still have a real problem
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    // Clean and parse JSON
    const cleanJson = responseText.replace(/\`\`\`json|\`\`\`/g, '').trim();
    const validation: ValidationResult = JSON.parse(cleanJson);

    // Add any local flags
    if (localFlags.length > 0) {
      validation.flags = [...(validation.flags || []), ...localFlags];
    }

    return NextResponse.json(validation);

  } catch (error) {
    console.error('AI validation error:', error);
    // FAIL OPEN — if AI validation fails, allow the submission
    // (never block a genuine citizen because of an AI error)
    return NextResponse.json({
      isGenuine: true,
      confidence: 50,
      reason: 'Validation service unavailable — submission allowed.',
      flags: ['VALIDATION_SKIPPED']
    });
  }
}
