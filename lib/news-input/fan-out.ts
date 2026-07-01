import { normalizePlanSymbol } from "@/lib/monthly-plan/format";
import type { NewsReport } from "@/lib/validation/news-input";
import { getReportPeriod } from "@/lib/validation/news-input";
import type { ManualNewsInputInsert } from "@/types/database";

type FanOutContext = {
  userId: string;
  portfolioId: string;
  headerId: string;
};

type NewsChildInsert = ManualNewsInputInsert & { symbol: string | null };

function normalizeAssetType(value: string): "etf" | "stock" {
  return value.toLowerCase() === "etf" ? "etf" : "stock";
}

function baseChildRow(
  context: FanOutContext,
  report: NewsReport,
): Omit<NewsChildInsert, "symbol"> {
  return {
    user_id: context.userId,
    portfolio_id: context.portfolioId,
    parent_id: context.headerId,
    is_report_header: false,
    report_type: report.report_type,
    report_period: getReportPeriod(report),
    payload: null,
    asset_type: null,
    news_score: null,
    news_direction: null,
    news_confidence: null,
    ai_bias: null,
    impact_horizon: null,
    event_type: null,
    risk_flags: null,
    one_sentence_reason: null,
    source_count: null,
    reason: null,
    risk_level: null,
    suggested_frontend_status: null,
  };
}

// map validated report to child insert rows
export function buildNewsInputChildRows(
  report: NewsReport,
  context: FanOutContext,
): NewsChildInsert[] {
  const base = baseChildRow(context, report);

  if (report.report_type === "daily_urgent_scan") {
    if (!report.urgent_news) {
      return [];
    }

    return report.events.map((event) => ({
      ...base,
      symbol: normalizePlanSymbol(event.symbol),
      asset_type: normalizeAssetType(event.asset_type),
      news_score: event.news_score,
      news_direction: event.news_direction,
      news_confidence: event.news_confidence,
      ai_bias: event.ai_bias,
      impact_horizon: event.impact_horizon,
      event_type: event.event_type,
      risk_flags: event.risk_flags,
      one_sentence_reason: event.one_sentence_reason,
      source_count: event.source_count,
    }));
  }

  if (report.report_type === "weekly_market_review") {
    return report.symbols_to_watch.map((item) => ({
      ...base,
      symbol: normalizePlanSymbol(item.symbol),
      reason: item.reason,
      risk_level: item.risk_level,
      suggested_frontend_status: item.suggested_frontend_status,
    }));
  }

  return report.symbols.map((item) => ({
    ...base,
    symbol: normalizePlanSymbol(item.symbol),
    asset_type: normalizeAssetType(item.asset_type),
    news_score: item.news_score,
    news_direction: item.news_direction,
    news_confidence: item.news_confidence,
    ai_bias: item.ai_bias,
    impact_horizon: item.impact_horizon,
    event_type: item.event_type,
    risk_flags: item.risk_flags,
    one_sentence_reason: item.one_sentence_reason,
    source_count: item.source_count,
  }));
}

export function buildNewsInputHeaderRow(
  report: NewsReport,
  userId: string,
  portfolioId: string,
): ManualNewsInputInsert {
  return {
    user_id: userId,
    portfolio_id: portfolioId,
    parent_id: null,
    is_report_header: true,
    report_type: report.report_type,
    report_period: getReportPeriod(report),
    payload: report,
    symbol: null,
    asset_type: null,
    news_score: null,
    news_direction: null,
    news_confidence: null,
    ai_bias: null,
    impact_horizon: null,
    event_type: null,
    risk_flags: null,
    one_sentence_reason: null,
    source_count: null,
    reason: null,
    risk_level: null,
    suggested_frontend_status: null,
  };
}
