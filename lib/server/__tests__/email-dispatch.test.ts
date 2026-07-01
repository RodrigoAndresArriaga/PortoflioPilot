import { describe, expect, it } from "vitest";

import {
  buildConcentrationDedupKey,
  extractManualReviewReasons,
  isInvestmentDayToday,
} from "@/lib/server/email-dispatch";
import type { ManualNewsInput } from "@/types/database";

describe("buildConcentrationDedupKey", () => {
  it("builds a stable dedup key from warning code and symbols", () => {
    const key = buildConcentrationDedupKey({
      code: "single_stock_concentration",
      severity: "block",
      message: "NVDA exceeds 10%",
      symbols: ["NVDA"],
      blocksBuy: true,
    });

    expect(key).toBe("single_stock_concentration:NVDA");
  });
});

describe("isInvestmentDayToday", () => {
  it("matches the effective investment day in the current month", () => {
    const referenceDate = new Date(2026, 6, 15);
    expect(isInvestmentDayToday(15, referenceDate)).toBe(true);
    expect(isInvestmentDayToday(16, referenceDate)).toBe(false);
  });

  it("clamps investment day to the last day of short months", () => {
    const referenceDate = new Date(2026, 1, 28);
    expect(isInvestmentDayToday(31, referenceDate)).toBe(true);
  });
});

describe("extractManualReviewReasons", () => {
  it("extracts avoid and manual_review child rows", () => {
    const children: ManualNewsInput[] = [
      {
        id: "1",
        user_id: "user-1",
        portfolio_id: "portfolio-1",
        parent_id: "header-1",
        is_report_header: false,
        report_type: "weekly_market_review",
        report_period: "2026-06-27",
        payload: null,
        symbol: "NVDA",
        asset_type: "stock",
        news_score: null,
        news_direction: null,
        news_confidence: null,
        ai_bias: "avoid",
        impact_horizon: null,
        event_type: null,
        risk_flags: null,
        one_sentence_reason: "Avoid new buys pending review.",
        source_count: null,
        reason: null,
        risk_level: "high",
        suggested_frontend_status: null,
        created_at: "2026-07-01T00:00:00.000Z",
        updated_at: "2026-07-01T00:00:00.000Z",
      },
      {
        id: "2",
        user_id: "user-1",
        portfolio_id: "portfolio-1",
        parent_id: "header-1",
        is_report_header: false,
        report_type: "weekly_market_review",
        report_period: "2026-06-27",
        payload: null,
        symbol: "MSFT",
        asset_type: "stock",
        news_score: null,
        news_direction: null,
        news_confidence: null,
        ai_bias: "hold",
        impact_horizon: null,
        event_type: null,
        risk_flags: null,
        one_sentence_reason: null,
        source_count: null,
        reason: "Watch for volatility.",
        risk_level: "medium",
        suggested_frontend_status: "manual_review",
        created_at: "2026-07-01T00:00:00.000Z",
        updated_at: "2026-07-01T00:00:00.000Z",
      },
    ];

    const reasons = extractManualReviewReasons(
      "weekly_market_review",
      "2026-06-27",
      children,
    );

    expect(reasons).toHaveLength(2);
    expect(reasons[0]?.dedupKey).toContain("NVDA");
    expect(reasons[1]?.reason).toBe("Watch for volatility.");
  });
});
