import { describe, expect, it } from "vitest";

import { allocateMonthlyBudget } from "@/lib/engine/final-position-sizing";
import { computeRecommendations } from "@/lib/engine/recommendation-engine";
import type { Holding, Profile, WatchlistItem } from "@/types/database";

const baseProfile: Profile = {
  id: "u1",
  full_name: null,
  base_currency: "MXN",
  monthly_investment_amount: 1000,
  investment_day: 1,
  risk_profile: "growth",
  time_horizon: "10_plus_years",
  investment_status: "has_investments",
  initial_investment_amount: null,
  setup_attention_dismissed: true,
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

function makeHolding(
  symbol: string,
  currentValue: number,
  assetType: "etf" | "stock" = "etf",
): Holding {
  return {
    id: symbol,
    user_id: "u1",
    portfolio_id: "p1",
    symbol,
    asset_name: null,
    asset_type: assetType,
    currency: "USD",
    shares: null,
    current_value: currentValue,
    last_price: null,
    last_price_at: null,
    price_source: null,
    cost_basis: null,
    broker: null,
    created_at: "",
    updated_at: "",
  };
}

describe("computeRecommendations", () => {
  it("works without target allocations", () => {
    const recommendations = computeRecommendations({
      profile: baseProfile,
      holdings: [makeHolding("VOO", 8000), makeHolding("QQQ", 2000)],
      watchlist: [],
      newsSignals: [],
      technicalScores: [],
    });

    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations.every((item) => item.recommendation_score >= 0)).toBe(
      true,
    );
  });

  it("defaults missing scores to neutral range", () => {
    const recommendations = computeRecommendations({
      profile: baseProfile,
      holdings: [makeHolding("VOO", 5000)],
      watchlist: [],
      newsSignals: [],
      technicalScores: [],
    });

    const voo = recommendations.find((item) => item.symbol === "VOO");
    expect(voo?.technical_score).toBe(50);
    expect(voo?.risk_score).toBe(50);
  });

  it("blocks high concentration single stocks", () => {
    const recommendations = computeRecommendations({
      profile: baseProfile,
      holdings: [makeHolding("NVDA", 9000, "stock"), makeHolding("VOO", 1000)],
      watchlist: [],
      newsSignals: [],
      technicalScores: [],
    });

    const nvda = recommendations.find((item) => item.symbol === "NVDA");
    expect(nvda?.blocked).toBe(true);
    expect(nvda?.concentration_flag).toBe(true);
  });

  it("blocks buys when ai_bias is avoid", () => {
    const recommendations = computeRecommendations({
      profile: baseProfile,
      holdings: [makeHolding("VOO", 5000)],
      watchlist: [],
      newsSignals: [
        {
          symbol: "VOO",
          asset_type: "etf",
          ai_bias: "avoid",
          news_confidence: 85,
        },
      ],
      technicalScores: [],
    });

    const voo = recommendations.find((item) => item.symbol === "VOO");
    expect(voo?.blocked).toBe(true);
    expect(voo?.manual_review_required).toBe(true);
  });

  it("allows overweight holdings to remain ranked", () => {
    const recommendations = computeRecommendations({
      profile: baseProfile,
      holdings: [makeHolding("VOO", 9500), makeHolding("QQQ", 500)],
      watchlist: [],
      newsSignals: [],
      technicalScores: [],
    });

    const voo = recommendations.find((item) => item.symbol === "VOO");
    expect(voo?.blocked).toBe(false);
    expect(voo!.recommendation_score).toBeGreaterThan(0);
  });
});

describe("allocateMonthlyBudget", () => {
  it("sums allocated amounts to the monthly budget", () => {
    const watchlist: WatchlistItem[] = [
      {
        id: "w1",
        user_id: "u1",
        symbol: "SCHD",
        asset_name: null,
        asset_type: "etf",
        bucket: "core_etf",
        enabled: true,
        sort_order: 0,
        created_at: "",
        updated_at: "",
      },
    ];

    const sized = allocateMonthlyBudget({
      profile: { ...baseProfile, monthly_investment_amount: 2000 },
      holdings: [makeHolding("VOO", 5000)],
      watchlist,
      newsSignals: [],
      technicalScores: [],
      monthlyAmount: 2000,
    });

    const total = sized.reduce(
      (sum, candidate) => sum + candidate.recommended_amount,
      0,
    );

    expect(Math.round(total * 100) / 100).toBe(2000);
  });
});
