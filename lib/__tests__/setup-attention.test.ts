import { describe, expect, it } from "vitest";

import { getSetupAttentionContext } from "@/lib/setup-attention";
import type { Profile } from "@/types/database";

const baseProfile: Profile = {
  id: "u1",
  full_name: null,
  base_currency: "MXN",
  monthly_investment_amount: 4000,
  investment_day: 1,
  risk_profile: "growth",
  time_horizon: "10_plus_years",
  investment_status: "not_invested_yet",
  initial_investment_amount: null,
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

describe("getSetupAttentionContext", () => {
  it("shows banner when not invested yet", () => {
    const context = getSetupAttentionContext(baseProfile, 0);
    expect(context.shouldShow).toBe(true);
    expect(context.isNotInvestedYet).toBe(true);
  });

  it("shows banner when holdings count is zero", () => {
    const context = getSetupAttentionContext(
      { ...baseProfile, investment_status: "has_investments" },
      0,
    );
    expect(context.shouldShow).toBe(true);
    expect(context.hasNoHoldings).toBe(true);
  });

  it("hides banner when dismissed and no attention needed", () => {
    const context = getSetupAttentionContext(
      {
        ...baseProfile,
        investment_status: "has_investments",
        setup_attention_dismissed: true,
      },
      3,
    );
    expect(context.shouldShow).toBe(false);
  });

  it("hides banner when dismissed even if still not invested", () => {
    const context = getSetupAttentionContext(
      { ...baseProfile, setup_attention_dismissed: true },
      0,
    );
    expect(context.shouldShow).toBe(false);
  });
});
