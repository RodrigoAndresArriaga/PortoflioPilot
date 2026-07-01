import { describe, expect, it } from "vitest";

import { allocateMonthlyBudget } from "@/lib/engine/final-position-sizing";
import { buildMonthlyPlanPayload } from "@/lib/server/monthly-plan-generation";
import { roundMoney, sumValues } from "@/lib/engine/math";
import type { Holding, Profile, WatchlistItem } from "@/types/database";

const profile: Profile = {
  id: "u1",
  full_name: null,
  base_currency: "MXN",
  monthly_investment_amount: 4000,
  investment_day: 1,
  risk_profile: "growth",
  time_horizon: "10_plus_years",
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

const holdings: Holding[] = [
  {
    id: "1",
    user_id: "u1",
    portfolio_id: "p1",
    symbol: "VOO",
    asset_name: null,
    asset_type: "etf",
    currency: "USD",
    shares: null,
    current_value: 9200,
    last_price: null,
    last_price_at: null,
    price_source: null,
    cost_basis: null,
    broker: null,
    created_at: "",
    updated_at: "",
  },
  {
    id: "2",
    user_id: "u1",
    portfolio_id: "p1",
    symbol: "QQQ",
    asset_name: null,
    asset_type: "etf",
    currency: "USD",
    shares: null,
    current_value: 4000,
    last_price: null,
    last_price_at: null,
    price_source: null,
    cost_basis: null,
    broker: null,
    created_at: "",
    updated_at: "",
  },
];

const watchlist: WatchlistItem[] = [
  {
    id: "w1",
    user_id: "u1",
    symbol: "SCHD",
    asset_name: "Schwab US Dividend Equity ETF",
    asset_type: "etf",
    bucket: "core_etf",
    enabled: true,
    sort_order: 0,
    created_at: "",
    updated_at: "",
  },
];

describe("buildMonthlyPlanPayload", () => {
  it("generates a plan without target allocations", () => {
    const result = buildMonthlyPlanPayload({
      profile,
      holdings,
      watchlist,
      month: "2026-07",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.data.items.length).toBeGreaterThan(0);
    expect(result.data.items.every((item) => item.recommended_amount >= 0)).toBe(
      true,
    );
  });

  it("deploys the full monthly budget", () => {
    const sized = allocateMonthlyBudget({
      profile,
      holdings,
      watchlist,
      newsSignals: [],
      technicalScores: [],
      monthlyAmount: profile.monthly_investment_amount,
    });

    const totalAllocated = roundMoney(
      sumValues(sized.map((candidate) => candidate.recommended_amount)),
    );

    expect(totalAllocated).toBe(4000);
  });

  it("does not generate sell instructions", () => {
    const result = buildMonthlyPlanPayload({
      profile,
      holdings,
      watchlist,
      month: "2026-07",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const serialized = JSON.stringify(result.data).toLowerCase();
    expect(serialized).not.toContain("sell");
  });
});
