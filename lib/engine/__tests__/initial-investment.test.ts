import { describe, expect, it } from "vitest";

import {
  computeInitialInvestmentRecommendations,
  resolveInitialInvestmentAmount,
} from "@/lib/engine/initial-investment";
import type { InitialRecommendationItem, Profile } from "@/types/database";

const baseProfile: Profile = {
  id: "u1",
  full_name: null,
  base_currency: "MXN",
  monthly_investment_amount: 10000,
  investment_day: 1,
  risk_profile: "growth",
  time_horizon: "10_plus_years",
  investment_status: "not_invested_yet",
  initial_investment_amount: 10000,
  setup_attention_dismissed: false,
  broad_etf_priority: true,
  cash_reserve_percent: 5,
  max_individual_stock_percent: 15,
  onboarding_completed: true,
  email_alerts_enabled: true,
  email_monthly_plan_ready: true,
  email_urgent_risk: true,
  email_weekly_summary: true,
  email_investment_reminder: true,
  email_concentration_warning: true,
  email_manual_review: true,
  created_at: "",
  updated_at: "",
};

function makeItem(
  overrides: Partial<InitialRecommendationItem> & Pick<InitialRecommendationItem, "symbol" | "asset_type">,
): InitialRecommendationItem {
  return {
    id: overrides.symbol,
    user_id: "u1",
    portfolio_id: "p1",
    report_id: "r1",
    asset_name: overrides.asset_name ?? overrides.symbol,
    suggested_role: overrides.suggested_role ?? "core",
    recommendation_direction: overrides.recommendation_direction ?? "consider",
    ai_bias: overrides.ai_bias ?? "add",
    news_direction: overrides.news_direction ?? "neutral",
    fundamental_score: overrides.fundamental_score ?? 70,
    news_score: overrides.news_score ?? 65,
    news_confidence: overrides.news_confidence ?? 75,
    risk_score: overrides.risk_score ?? 35,
    valuation_risk: overrides.valuation_risk ?? "medium",
    event_type: overrides.event_type ?? "macro",
    impact_horizon: overrides.impact_horizon ?? "long_term",
    risk_flags: overrides.risk_flags ?? [],
    source_count: overrides.source_count ?? 1,
    one_sentence_reason: overrides.one_sentence_reason ?? "Test reason",
    manual_notes: null,
    created_at: "",
    ...overrides,
  };
}

describe("computeInitialInvestmentRecommendations", () => {
  it("generates final amounts for eligible symbols", () => {
    const results = computeInitialInvestmentRecommendations({
      profile: baseProfile,
      watchlist: [],
      items: [
        makeItem({ symbol: "VOO", asset_type: "etf", suggested_role: "core" }),
        makeItem({ symbol: "VXUS", asset_type: "etf", suggested_role: "core" }),
      ],
      technicalScores: [],
      holdings: [],
      initialInvestmentAmount: 10000,
    });

    const buys = results.filter(
      (item) => item.symbol !== "CASH" && item.final_amount > 0,
    );

    expect(buys.length).toBeGreaterThan(0);
    expect(buys.reduce((sum, item) => sum + item.final_amount, 0)).toBeLessThanOrEqual(
      9500,
    );
  });

  it("caps individual stock allocation", () => {
    const results = computeInitialInvestmentRecommendations({
      profile: baseProfile,
      watchlist: [],
      items: [
        makeItem({
          symbol: "NVDA",
          asset_type: "stock",
          suggested_role: "satellite",
          fundamental_score: 90,
        }),
      ],
      technicalScores: [],
      holdings: [],
      initialInvestmentAmount: 10000,
    });

    const nvda = results.find((item) => item.symbol === "NVDA");
    expect(nvda?.final_amount ?? 0).toBeLessThanOrEqual(1500);
  });

  it("zeroes avoid bias and flags manual review", () => {
    const results = computeInitialInvestmentRecommendations({
      profile: baseProfile,
      watchlist: [],
      items: [
        makeItem({
          symbol: "TSLA",
          asset_type: "stock",
          ai_bias: "avoid",
          suggested_role: "avoid",
        }),
      ],
      technicalScores: [],
      holdings: [],
      initialInvestmentAmount: 10000,
    });

    const tsla = results.find((item) => item.symbol === "TSLA");
    expect(tsla?.final_amount).toBe(0);
    expect(tsla?.manual_review_required).toBe(true);
  });

  it("reduces watch bias amounts", () => {
    const baseline = computeInitialInvestmentRecommendations({
      profile: baseProfile,
      watchlist: [],
      items: [
        makeItem({ symbol: "MSFT", asset_type: "stock", ai_bias: "add" }),
      ],
      technicalScores: [],
      holdings: [],
      initialInvestmentAmount: 10000,
    });

    const watched = computeInitialInvestmentRecommendations({
      profile: baseProfile,
      watchlist: [],
      items: [
        makeItem({ symbol: "MSFT", asset_type: "stock", ai_bias: "watch" }),
      ],
      technicalScores: [],
      holdings: [],
      initialInvestmentAmount: 10000,
    });

    const baselineAmount =
      baseline.find((item) => item.symbol === "MSFT")?.final_amount ?? 0;
    const watchAmount =
      watched.find((item) => item.symbol === "MSFT")?.final_amount ?? 0;

    expect(watchAmount).toBeLessThanOrEqual(baselineAmount);
  });
});

describe("resolveInitialInvestmentAmount", () => {
  it("defaults to monthly amount when initial amount is empty", () => {
    expect(
      resolveInitialInvestmentAmount({
        ...baseProfile,
        initial_investment_amount: null,
      }),
    ).toBe(10000);
  });
});
