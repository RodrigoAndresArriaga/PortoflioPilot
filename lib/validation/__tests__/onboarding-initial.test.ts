import { describe, expect, it } from "vitest";

import { onboardingPayloadSchema } from "@/lib/validation/onboarding";

describe("onboardingPayloadSchema initial investment flow", () => {
  const basePayload = {
    base_currency: "MXN" as const,
    monthly_investment_amount: 4000,
    investment_day: 1,
    initial_investment_amount: 4000,
    risk_profile: "growth" as const,
    time_horizon: "10_plus_years" as const,
    watchlist: [
      {
        symbol: "VOO",
        asset_name: "Vanguard S&P 500 ETF",
        asset_type: "etf" as const,
        bucket: "core_etf" as const,
        sort_order: 0,
      },
    ],
  };

  it("allows completing onboarding with no holdings when not invested yet", () => {
    const result = onboardingPayloadSchema.safeParse({
      ...basePayload,
      investment_status: "not_invested_yet",
      holdings: [],
    });

    expect(result.success).toBe(true);
  });

  it("requires holdings when user has investments", () => {
    const result = onboardingPayloadSchema.safeParse({
      ...basePayload,
      investment_status: "has_investments",
      holdings: [],
    });

    expect(result.success).toBe(false);
  });

  it("persists investment_status in parsed payload", () => {
    const result = onboardingPayloadSchema.parse({
      ...basePayload,
      investment_status: "not_invested_yet",
      holdings: [],
    });

    expect(result.investment_status).toBe("not_invested_yet");
  });
});
