import "server-only";

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIClassification, Sentiment } from "../../types";

export type ClassificationResult = AIClassification & { human_review_flag: boolean };

function getGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key.trim() === "") throw new Error("Missing GEMINI_API_KEY in environment");
  return key;
}

function safeJsonParse<T>(text: string): T {
  const raw = text.trim();

  // First try direct JSON
  try {
    return JSON.parse(raw) as T;
  } catch {
    // continue
  }

  // Try to extract the first JSON object from markdown/code-fences
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Gemini output did not contain a JSON object");
  }

  const candidate = raw.slice(start, end + 1);
  return JSON.parse(candidate) as T;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function normalizeSentiment(s: unknown): Sentiment {
  if (s === "positive" || s === "neutral" || s === "negative" || s === "urgent") return s;
  return "neutral";
}

function toBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return v.toLowerCase() === "true";
  if (typeof v === "number") return v !== 0;
  return false;
}

function sanitizeClassification(obj: any): AIClassification {
  const urgency_score = clamp(Number(obj?.urgency_score) || 1, 1, 100);
  const confidence = clamp(Number(obj?.confidence) || 0, 0, 100);

  return {
    category: String(obj?.category ?? "Unclassified"),
    sub_category: String(obj?.sub_category ?? ""),
    urgency_score,
    sentiment: normalizeSentiment(obj?.sentiment),
    department: String(obj?.department ?? "General"),
    suggested_response: String(obj?.suggested_response ?? ""),
    confidence,
    vulnerable_flag: toBool(obj?.vulnerable_flag),
  };
}

const CLASSIFICATION_SCHEMA_TEXT = `Return JSON:
{
  category: string,
  sub_category: string,
  urgency_score: number (1-100),
  sentiment: "positive" | "neutral" | "negative" | "urgent",
  department: string,
  suggested_response: string,
  confidence: number (0-100),
  vulnerable_flag: boolean
}`;

export async function classifyComplaint(
  description: string,
  ward: string,
  category?: string,
): Promise<ClassificationResult> {
  const fallback: ClassificationResult = {
    category: "Unclassified",
    sub_category: "",
    urgency_score: 50,
    sentiment: "neutral",
    department: "General",
    suggested_response: "",
    confidence: 0,
    vulnerable_flag: false,
    human_review_flag: true,
  };

  try {
    if (!description?.trim()) return fallback;

    const genAI = new GoogleGenerativeAI(getGeminiApiKey());
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = [
      "You are an expert municipal grievance classifier for an Indian municipal corporation CRM.",
      "Classify the following citizen complaint into the required JSON fields.",
      "Important rules:",
      "- Output MUST be valid JSON only (no markdown, no extra text).",
      "- urgency_score must be an integer 1-100.",
      "- confidence must be 0-100.",
      "- If the complaint suggests vulnerable citizen context (elderly, disabled, medical emergency, safety risk), set vulnerable_flag=true.",
      "",
      CLASSIFICATION_SCHEMA_TEXT,
      "",
      `Ward: ${ward ?? ""}`,
      category ? `Citizen-selected category (optional hint): ${category}` : "",
      "Complaint description:",
      description,
    ]
      .filter(Boolean)
      .join("\n");

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const parsed = safeJsonParse<Record<string, unknown>>(text);
    const ai = sanitizeClassification(parsed);

    const human_review_flag = ai.confidence < 75;

    return { ...ai, human_review_flag };
  } catch {
    return fallback;
  }
}

