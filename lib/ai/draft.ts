import "server-only";

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Case, Department, UrgencyLevel } from "../../types";

function getGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key.trim() === "") throw new Error("Missing GEMINI_API_KEY in environment");
  return key;
}

export type DraftInput = {
  caseId: string;
  caseNumber?: string;
  citizenName?: string;
  ward?: string;
  department?: Department;
  category?: string;
  urgencyLevel?: UrgencyLevel;
  description: string;
};

export async function generateDraft(caseDetails: DraftInput | Case): Promise<{ draft: string }> {
  const details: DraftInput = "description" in caseDetails
    ? {
        caseId: (caseDetails as any).caseId ?? (caseDetails as any).id ?? "",
        caseNumber: (caseDetails as any).caseNumber ?? (caseDetails as any).case_number,
        citizenName: (caseDetails as any).citizenName ?? (caseDetails as any).citizen_name,
        ward: (caseDetails as any).ward,
        department: (caseDetails as any).department ?? (caseDetails as any).ai?.department,
        category: (caseDetails as any).category,
        urgencyLevel: (caseDetails as any).urgencyLevel,
        description: (caseDetails as any).description,
      }
    : { caseId: "", description: "" };

  if (!details.description?.trim()) {
    return { draft: "We have received your grievance and are reviewing it. Please share additional details so we may assist you promptly." };
  }

  const genAI = new GoogleGenerativeAI(getGeminiApiKey());
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  const prompt = [
    "You are drafting an official response from an Indian municipal corporation grievance cell.",
    "Tone requirements:",
    "- Empathetic, formal, respectful.",
    "- Clear next steps and expected action.",
    "- Avoid promises that cannot be guaranteed.",
    "- Do not request sensitive information publicly.",
    "",
    "Format requirements:",
    "- 1 short subject line, then 2-3 short paragraphs.",
    "- Keep it under 180 words.",
    "- Include case number if provided.",
    "",
    "Context (JSON):",
    JSON.stringify({
      caseId: details.caseId,
      caseNumber: details.caseNumber ?? null,
      citizenName: details.citizenName ?? null,
      ward: details.ward ?? null,
      department: details.department ?? null,
      category: details.category ?? null,
      urgencyLevel: details.urgencyLevel ?? null,
      description: details.description,
    }),
  ].join("\n");

  const result = await model.generateContent(prompt);
  const draft = result.response.text().trim();

  return { draft };
}

