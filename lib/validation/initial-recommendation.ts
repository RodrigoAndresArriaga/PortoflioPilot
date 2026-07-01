import { z } from "zod";

import {
  aiBiasMonthlySchema,
  eventTypeSchema,
  impactHorizonSchema,
  marketRegimeSchema,
  newsConfidenceSchema,
  newsDirectionSchema,
  newsScoreSchema,
  overallRiskLevelSchema,
} from "@/lib/validation/news-input";
import {
  riskProfileSchema,
  timeHorizonSchema,
} from "@/lib/validation/common";

export const initialReportTypeSchema = z.literal("initial_investment_research");

export const suggestedRoleSchema = z.enum([
  "core",
  "growth",
  "satellite",
  "cash_reserve",
  "avoid",
  "manual_review",
]);

export const recommendationDirectionSchema = z.enum([
  "consider",
  "neutral",
  "cautious",
  "avoid",
]);

export const valuationRiskSchema = z.enum(["low", "medium", "high"]);

export const initialAssetTypeSchema = z.enum([
  "ETF",
  "stock",
  "cash",
  "other",
  "etf",
]);

const reportDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format");

const riskScoreSchema = z.coerce
  .number()
  .min(0, "risk_score must be between 0 and 100")
  .max(100, "risk_score must be between 0 and 100");

const fundamentalScoreSchema = z.coerce
  .number()
  .min(0, "fundamental_score must be between 0 and 100")
  .max(100, "fundamental_score must be between 0 and 100");

export const initialResearchSymbolSchema = z.object({
  symbol: z.string().trim().min(1).max(20),
  asset_name: z.string().trim().min(1).max(200),
  asset_type: initialAssetTypeSchema,
  suggested_role: suggestedRoleSchema,
  recommendation_direction: recommendationDirectionSchema,
  ai_bias: aiBiasMonthlySchema,
  news_direction: newsDirectionSchema,
  fundamental_score: fundamentalScoreSchema,
  news_score: newsScoreSchema,
  news_confidence: newsConfidenceSchema,
  risk_score: riskScoreSchema,
  valuation_risk: valuationRiskSchema,
  impact_horizon: impactHorizonSchema,
  event_type: eventTypeSchema,
  risk_flags: z.array(z.string().trim().min(1)).default([]),
  one_sentence_reason: z.string().trim().min(1).max(500),
  source_count: z.coerce.number().int().min(0),
});

export const initialInvestmentContextSchema = z.object({
  currency: z.string().trim().min(1).max(10),
  initial_investment_amount: z.coerce.number().min(0),
  monthly_investment_amount: z.coerce.number().min(0),
  risk_profile: riskProfileSchema,
  time_horizon: timeHorizonSchema,
});

export const initialInvestmentResearchSchema = z.object({
  report_type: initialReportTypeSchema,
  report_date: reportDateSchema,
  market_regime: marketRegimeSchema,
  overall_risk_level: overallRiskLevelSchema,
  summary: z.string().trim().min(1).max(2000),
  initial_investment_context: initialInvestmentContextSchema,
  symbols: z.array(initialResearchSymbolSchema).min(1, "At least one symbol is required"),
  frontend_input_required: z.literal(true),
});

export type InitialInvestmentResearch = z.infer<
  typeof initialInvestmentResearchSchema
>;
export type InitialResearchSymbol = z.infer<typeof initialResearchSymbolSchema>;

export function parseInitialResearchJson(
  raw: unknown,
): InitialInvestmentResearch {
  const parsed =
    typeof raw === "string"
      ? (JSON.parse(raw) as unknown)
      : raw;
  return initialInvestmentResearchSchema.parse(parsed);
}

export const saveInitialResearchSchema = z.object({
  payload: initialInvestmentResearchSchema,
});

export type SaveInitialResearchInput = z.infer<
  typeof saveInitialResearchSchema
>;
