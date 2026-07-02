import { describe, expect, it } from "vitest";

import {
  createWatchlistItemFromCustomInput,
  onboardingPayloadSchema,
} from "@/lib/validation/onboarding";

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

  it("allows empty watchlist when not invested yet", () => {
    const result = onboardingPayloadSchema.safeParse({
      ...basePayload,
      investment_status: "not_invested_yet",
      holdings: [],
      watchlist: [],
    });

    expect(result.success).toBe(true);
  });

  it("requires watchlist when user has investments", () => {
    const result = onboardingPayloadSchema.safeParse({
      ...basePayload,
      investment_status: "has_investments",
      holdings: [
        {
          symbol: "VOO",
          asset_name: "Vanguard S&P 500 ETF",
          asset_type: "etf" as const,
          currency: "MXN" as const,
          shares: 10,
          cost_basis: 4800,
          broker: null,
        },
      ],
      watchlist: [],
    });

    expect(result.success).toBe(false);
  });
});

describe("createWatchlistItemFromCustomInput", () => {
  it("normalizes symbol to uppercase", () => {
    const item = createWatchlistItemFromCustomInput(
      {
        symbol: "iwda",
        asset_name: "iShares Core MSCI World",
        asset_type: "etf",
        bucket: "core_etf",
      },
      0,
    );

    expect(item.symbol).toBe("IWDA");
    expect(item.asset_name).toBe("iShares Core MSCI World");
    expect(item.sort_order).toBe(0);
  });
});
