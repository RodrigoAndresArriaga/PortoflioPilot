import { z } from "zod";

import { normalizePlanSymbol } from "@/lib/monthly-plan/format";
import { formatZodErrors } from "@/lib/validation/onboarding";
import {
  getReportPeriod,
  newsReportSchema,
  parsePastedNewsJson,
  type NewsReport,
  type NewsReportType,
} from "@/lib/validation/news-input";

export type ParseNewsJsonResult =
  | { ok: true; data: NewsReport }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export type ManualSymbolFormInput = {
  reportType: NewsReportType;
  reportPeriod: string;
  symbol: string;
  asset_type?: "etf" | "stock" | "ETF";
  event_type?: string;
  news_direction?: string;
  news_score?: number;
  news_confidence?: number;
  impact_horizon?: string;
  ai_bias?: string;
  risk_flags?: string[];
  one_sentence_reason?: string;
  source_count?: number;
  reason?: string;
  risk_level?: string;
  suggested_frontend_status?: string;
};

export function parseNewsJson(raw: unknown): ParseNewsJsonResult {
  try {
    const data = parsePastedNewsJson(raw);
    return { ok: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = formatZodErrors(error);
      const firstError = Object.values(fieldErrors)[0];
      return {
        ok: false,
        error: firstError ?? "Report validation failed.",
        fieldErrors,
      };
    }

    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Failed to parse report JSON.",
    };
  }
}

export function formatReportTypeLabel(type: NewsReportType): string {
  switch (type) {
    case "daily_urgent_scan":
      return "Daily urgent scan";
    case "weekly_market_review":
      return "Weekly market review";
    case "monthly_allocation_review":
      return "Monthly allocation review";
  }
}

export function countReportSymbols(report: NewsReport): number {
  switch (report.report_type) {
    case "daily_urgent_scan":
      return report.urgent_news ? report.events.length : 0;
    case "weekly_market_review":
      return report.symbols_to_watch.length;
    case "monthly_allocation_review":
      return report.symbols.length;
  }
}

function upsertBySymbol<T extends { symbol: string }>(
  items: T[],
  next: T,
): T[] {
  const symbol = normalizePlanSymbol(next.symbol);
  const filtered = items.filter(
    (item) => normalizePlanSymbol(item.symbol) !== symbol,
  );
  return [...filtered, { ...next, symbol }];
}

function buildDailyEvent(input: ManualSymbolFormInput) {
  return {
    symbol: normalizePlanSymbol(input.symbol),
    asset_type: (input.asset_type ?? "stock") as "etf" | "stock" | "ETF",
    event_type: (input.event_type ?? "other") as
      | "macro"
      | "earnings"
      | "regulation"
      | "lawsuit"
      | "product"
      | "sector"
      | "geopolitical"
      | "valuation"
      | "other",
    news_direction: (input.news_direction ?? "neutral") as
      | "positive"
      | "neutral"
      | "negative"
      | "mixed",
    news_score: input.news_score ?? 50,
    news_confidence: input.news_confidence ?? 50,
    impact_horizon: (input.impact_horizon ?? "short_term") as
      | "short_term"
      | "medium_term"
      | "long_term",
    ai_bias: (input.ai_bias ?? "watch") as "hold" | "watch" | "reduce" | "avoid",
    risk_flags: input.risk_flags ?? [],
    one_sentence_reason: input.one_sentence_reason?.trim() || "Manual entry.",
    source_count: input.source_count ?? 0,
  };
}

function buildMonthlySymbol(input: ManualSymbolFormInput) {
  return {
    symbol: normalizePlanSymbol(input.symbol),
    asset_type: (input.asset_type ?? "stock") as "etf" | "stock" | "ETF",
    news_direction: (input.news_direction ?? "neutral") as
      | "positive"
      | "neutral"
      | "negative"
      | "mixed",
    news_score: input.news_score ?? 50,
    news_confidence: input.news_confidence ?? 50,
    impact_horizon: (input.impact_horizon ?? "medium_term") as
      | "short_term"
      | "medium_term"
      | "long_term",
    event_type: (input.event_type ?? "other") as
      | "macro"
      | "earnings"
      | "regulation"
      | "lawsuit"
      | "product"
      | "sector"
      | "geopolitical"
      | "valuation"
      | "other",
    risk_flags: input.risk_flags ?? [],
    ai_bias: (input.ai_bias ?? "hold") as
      | "add"
      | "hold"
      | "watch"
      | "reduce"
      | "avoid",
    one_sentence_reason: input.one_sentence_reason?.trim() || "Manual entry.",
    source_count: input.source_count ?? 0,
  };
}

function buildWeeklySymbol(input: ManualSymbolFormInput) {
  return {
    symbol: normalizePlanSymbol(input.symbol),
    reason: input.reason?.trim() || "Manual entry.",
    risk_level: (input.risk_level ?? "medium") as "low" | "medium" | "high",
    suggested_frontend_status: (input.suggested_frontend_status ??
      "watch") as
      | "normal"
      | "watch"
      | "reduce_new_buys"
      | "manual_review",
  };
}

// merge one symbol into an existing report or build a minimal new report
export function buildMergedSymbolReport(
  existing: NewsReport | null,
  input: ManualSymbolFormInput,
): NewsReport {
  const period = input.reportPeriod.trim();

  if (input.reportType === "daily_urgent_scan") {
    const event = buildDailyEvent(input);

    if (
      existing?.report_type === "daily_urgent_scan" &&
      existing.urgent_news
    ) {
      return {
        ...existing,
        report_date: period,
        events: upsertBySymbol(existing.events, event),
        frontend_input_required: true,
      };
    }

    return {
      report_type: "daily_urgent_scan",
      report_date: period,
      urgent_news: true,
      action_required: true,
      overall_risk_level: "medium",
      market_regime: "neutral",
      events: [event],
      frontend_input_required: true,
    };
  }

  if (input.reportType === "weekly_market_review") {
    const symbolEntry = buildWeeklySymbol(input);

    if (existing?.report_type === "weekly_market_review") {
      return {
        ...existing,
        week_ending: period,
        symbols_to_watch: upsertBySymbol(
          existing.symbols_to_watch,
          symbolEntry,
        ),
      };
    }

    return {
      report_type: "weekly_market_review",
      week_ending: period,
      market_regime: "neutral",
      overall_risk_level: "medium",
      weekly_summary: "Manual entry.",
      next_week_bias: "normal",
      major_events: [],
      symbols_to_watch: [symbolEntry],
      frontend_input_recommended: true,
    };
  }

  const symbolEntry = buildMonthlySymbol(input);

  if (existing?.report_type === "monthly_allocation_review") {
    return {
      ...existing,
      report_month: period,
      symbols: upsertBySymbol(existing.symbols, symbolEntry),
      frontend_input_required: true,
    };
  }

  return {
    report_type: "monthly_allocation_review",
    report_month: period,
    market_regime: "neutral",
    overall_risk_level: "medium",
    monthly_summary: "Manual entry.",
    allocation_bias: "normal",
    symbols: [symbolEntry],
    frontend_input_required: true,
  };
}

export function getReportPeriodFromReport(report: NewsReport): string {
  return getReportPeriod(report);
}

export function validateMergedReport(report: NewsReport): ParseNewsJsonResult {
  try {
    const data = newsReportSchema.parse(report);
    return { ok: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = formatZodErrors(error);
      const firstError = Object.values(fieldErrors)[0];
      return {
        ok: false,
        error: firstError ?? "Report validation failed.",
        fieldErrors,
      };
    }

    return { ok: false, error: "Failed to validate merged report." };
  }
}
