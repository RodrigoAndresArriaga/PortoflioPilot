import { z } from "zod";

export const newsReportTypeSchema = z.enum([
  "daily_urgent_scan",
  "weekly_market_review",
  "monthly_allocation_review",
]);

export const newsDirectionSchema = z.enum([
  "positive",
  "neutral",
  "negative",
  "mixed",
]);

export const marketRegimeSchema = z.enum([
  "bullish",
  "neutral",
  "bearish",
  "volatile",
]);

export const overallRiskLevelSchema = z.enum(["low", "medium", "high"]);

export const impactHorizonSchema = z.enum([
  "short_term",
  "medium_term",
  "long_term",
]);

export const eventTypeSchema = z.enum([
  "macro",
  "earnings",
  "regulation",
  "lawsuit",
  "product",
  "sector",
  "geopolitical",
  "valuation",
  "other",
]);

export const aiBiasDailySchema = z.enum(["hold", "watch", "reduce", "avoid"]);

export const aiBiasMonthlySchema = z.enum([
  "add",
  "hold",
  "watch",
  "reduce",
  "avoid",
]);

export const suggestedFrontendStatusSchema = z.enum([
  "normal",
  "watch",
  "reduce_new_buys",
  "manual_review",
]);

export const allocationBiasSchema = z.enum([
  "normal",
  "cautious",
  "defensive",
  "risk_on",
]);

export const nextWeekBiasSchema = z.enum(["normal", "cautious", "defensive"]);

export const newsScoreSchema = z.coerce
  .number()
  .min(0, "news_score must be between 0 and 100")
  .max(100, "news_score must be between 0 and 100");

export const newsConfidenceSchema = z.coerce
  .number()
  .min(0, "news_confidence must be between 0 and 100")
  .max(100, "news_confidence must be between 0 and 100");

const reportDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format");

const reportMonthSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must use YYYY-MM format");

const promptAssetTypeSchema = z.enum(["ETF", "stock", "etf", "stock"]);

const dailyEventSchema = z.object({
  symbol: z.string().trim().min(1).max(20),
  asset_type: promptAssetTypeSchema,
  event_type: eventTypeSchema,
  news_direction: newsDirectionSchema,
  news_score: newsScoreSchema,
  news_confidence: newsConfidenceSchema,
  impact_horizon: impactHorizonSchema,
  ai_bias: aiBiasDailySchema,
  risk_flags: z.array(z.string().trim().min(1)).default([]),
  one_sentence_reason: z.string().trim().min(1).max(500),
  source_count: z.coerce.number().int().min(0),
});

const dailyNoUrgentSchema = z.object({
  report_type: z.literal("daily_urgent_scan"),
  report_date: reportDateSchema,
  urgent_news: z.literal(false),
  action_required: z.literal(false),
  summary: z.string().trim().min(1).max(1000),
});

const dailyUrgentSchema = z.object({
  report_type: z.literal("daily_urgent_scan"),
  report_date: reportDateSchema,
  urgent_news: z.literal(true),
  action_required: z.literal(true),
  overall_risk_level: overallRiskLevelSchema,
  market_regime: marketRegimeSchema,
  events: z.array(dailyEventSchema).min(1, "At least one event is required"),
  frontend_input_required: z.literal(true),
});

export const dailyUrgentScanSchema = z.discriminatedUnion("urgent_news", [
  dailyNoUrgentSchema,
  dailyUrgentSchema,
]);

const weeklySymbolSchema = z.object({
  symbol: z.string().trim().min(1).max(20),
  reason: z.string().trim().min(1).max(500),
  risk_level: overallRiskLevelSchema,
  suggested_frontend_status: suggestedFrontendStatusSchema,
});

export const weeklyMarketReviewSchema = z.object({
  report_type: z.literal("weekly_market_review"),
  week_ending: reportDateSchema,
  market_regime: marketRegimeSchema,
  overall_risk_level: overallRiskLevelSchema,
  weekly_summary: z.string().trim().min(1).max(2000),
  next_week_bias: nextWeekBiasSchema,
  major_events: z.array(z.string().trim().min(1)).default([]),
  symbols_to_watch: z.array(weeklySymbolSchema).default([]),
  frontend_input_recommended: z.boolean().default(true),
});

const monthlySymbolSchema = z.object({
  symbol: z.string().trim().min(1).max(20),
  asset_type: promptAssetTypeSchema,
  news_direction: newsDirectionSchema,
  news_score: newsScoreSchema,
  news_confidence: newsConfidenceSchema,
  impact_horizon: impactHorizonSchema,
  event_type: eventTypeSchema,
  risk_flags: z.array(z.string().trim().min(1)).default([]),
  ai_bias: aiBiasMonthlySchema,
  one_sentence_reason: z.string().trim().min(1).max(500),
  source_count: z.coerce.number().int().min(0),
});

export const monthlyAllocationReviewSchema = z.object({
  report_type: z.literal("monthly_allocation_review"),
  report_month: reportMonthSchema,
  market_regime: marketRegimeSchema,
  overall_risk_level: overallRiskLevelSchema,
  monthly_summary: z.string().trim().min(1).max(2000),
  allocation_bias: allocationBiasSchema,
  symbols: z.array(monthlySymbolSchema).min(1, "At least one symbol is required"),
  frontend_input_required: z.literal(true),
});

export const newsReportSchema = z.union([
  dailyUrgentScanSchema,
  weeklyMarketReviewSchema,
  monthlyAllocationReviewSchema,
]);

export const saveNewsInputSchema = z.object({
  payload: newsReportSchema,
});

export type NewsReportType = z.infer<typeof newsReportTypeSchema>;
export type DailyUrgentScanReport = z.infer<typeof dailyUrgentScanSchema>;
export type WeeklyMarketReviewReport = z.infer<typeof weeklyMarketReviewSchema>;
export type MonthlyAllocationReviewReport = z.infer<
  typeof monthlyAllocationReviewSchema
>;
export type NewsReport = z.infer<typeof newsReportSchema>;
export type SaveNewsInputPayload = z.infer<typeof saveNewsInputSchema>;

// parse pasted JSON string or object into validated report
export function parsePastedNewsJson(raw: unknown): NewsReport {
  let parsed: unknown = raw;

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) {
      throw new Error("JSON input is empty.");
    }
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      throw new Error("Invalid JSON. Paste a valid ChatGPT report object.");
    }
  }

  return newsReportSchema.parse(parsed);
}

export function getReportPeriod(report: NewsReport): string {
  switch (report.report_type) {
    case "daily_urgent_scan":
      return report.report_date;
    case "weekly_market_review":
      return report.week_ending;
    case "monthly_allocation_review":
      return report.report_month;
  }
}
