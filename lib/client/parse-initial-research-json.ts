import { parseInitialResearchJson } from "@/lib/validation/initial-recommendation";
import { formatZodErrors } from "@/lib/validation/onboarding";
import type { InitialInvestmentResearch } from "@/lib/validation/initial-recommendation";
import { ZodError } from "zod";

export type ParseInitialResearchResult =
  | { ok: true; data: InitialInvestmentResearch }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export function parseInitialResearchJsonClient(
  raw: string,
): ParseInitialResearchResult {
  if (!raw.trim()) {
    return { ok: false, error: "Paste a JSON object to validate." };
  }

  try {
    const data = parseInitialResearchJson(raw);
    return { ok: true, data };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return { ok: false, error: "Invalid JSON format." };
    }
    if (error instanceof ZodError) {
      return {
        ok: false,
        error: error.issues[0]?.message ?? "Validation failed.",
        fieldErrors: formatZodErrors(error),
      };
    }
    return { ok: false, error: "Validation failed." };
  }
}
