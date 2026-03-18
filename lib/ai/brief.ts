import "server-only";

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Case } from "../../types";

function getGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key.trim() === "") throw new Error("Missing GEMINI_API_KEY in environment");
  return key;
}

function pickTopPriorityCaseIds(cases: Case[], max: number): string[] {
  return [...cases]
    .sort((a, b) => {
      const ap = a.priority?.priority_score ?? -1;
      const bp = b.priority?.priority_score ?? -1;
      if (bp !== ap) return bp - ap;
      const ad = typeof a.created_at === "string" ? Date.parse(a.created_at) : a.created_at instanceof Date ? a.created_at.getTime() : 0;
      const bd = typeof b.created_at === "string" ? Date.parse(b.created_at) : b.created_at instanceof Date ? b.created_at.getTime() : 0;
      return bd - ad;
    })
    .slice(0, max)
    .map((c) => c.id);
}

export async function generateBrief(
  cases: Case[],
): Promise<{ brief: string; topPriorityCaseIds: string[] }> {
  const safeCases = Array.isArray(cases) ? cases : [];
  const topPriorityCaseIds = pickTopPriorityCaseIds(safeCases, 5);

  if (safeCases.length === 0) {
    return {
      brief: "No cases are currently available to summarize. Please check back after new submissions are recorded. The dashboard will update automatically as new cases come in.",
      topPriorityCaseIds,
    };
  }

  const genAI = new GoogleGenerativeAI(getGeminiApiKey());
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  const compact = safeCases.slice(0, 50).map((c) => ({
    id: c.id,
    case_number: c.case_number,
    ward: c.ward,
    category: c.category,
    status: c.status,
    urgency_score: c.ai?.urgency_score ?? null,
    vulnerable_flag: c.vulnerable_flag ?? c.ai?.vulnerable_flag ?? false,
    priority_score: c.priority?.priority_score ?? null,
  }));

  const prompt = [
    "You are a municipal operations analyst for an Indian municipal corporation.",
    "Write a situation brief for staff leadership.",
    "Output requirements:",
    "- Exactly 3 sentences.",
    "- Plain English (no bullet points).",
    "- Mention overall volume, key problem areas (categories/wards), and urgent/vulnerable signals.",
    "- Do not include any IDs in the text.",
    "",
    "Cases (JSON):",
    JSON.stringify(compact),
  ].join("\n");

  const result = await model.generateContent(prompt);
  const brief = result.response.text().trim().replace(/\s+/g, " ");

  return { brief, topPriorityCaseIds };
}

