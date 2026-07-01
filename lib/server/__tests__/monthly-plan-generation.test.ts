import { describe, expect, it } from "vitest";

import { resolveEngineTargets, buildMonthlyPlanPayload } from "@/lib/server/monthly-plan-generation";
import type { TargetAllocationsSnapshot } from "@/lib/server/targets";
import type { Holding, Profile } from "@/types/database";
import { roundMoney, sumValues } from "@/lib/engine/math";

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
  {
    id: "3",
    user_id: "u1",
    portfolio_id: "p1",
    symbol: "CASH",
    asset_name: null,
    asset_type: "cash",
    currency: "USD",
    shares: null,
    current_value: 6800,
    last_price: null,
    last_price_at: null,
    price_source: null,
    cost_basis: null,
    broker: null,
    created_at: "",
    updated_at: "",
  },
];

const bucketSnapshot: TargetAllocationsSnapshot = {
  allocation_mode: "bucket",
  target_buckets: [
    {
      id: "b1",
      user_id: "u1",
      portfolio_id: "p1",
      bucket_key: "core_etf",
      target_percent: 55,
      min_percent: null,
      max_percent: null,
      enabled: true,
      created_at: "",
      updated_at: "",
    },
    {
      id: "b2",
      user_id: "u1",
      portfolio_id: "p1",
      bucket_key: "growth_tech",
      target_percent: 35,
      min_percent: null,
      max_percent: null,
      enabled: true,
      created_at: "",
      updated_at: "",
    },
    {
      id: "b3",
      user_id: "u1",
      portfolio_id: "p1",
      bucket_key: "cash_reserve",
      target_percent: 10,
      min_percent: null,
      max_percent: null,
      enabled: true,
      created_at: "",
      updated_at: "",
    },
  ],
  target_assets: [],
};

const profile: Profile = {
  id: "u1",
  full_name: null,
  base_currency: "MXN",
  monthly_investment_amount: 4000,
  investment_day: 1,
  risk_profile: "growth",
  time_horizon: "10_plus_years",
  onboarding_completed: true,
  created_at: "",
  updated_at: "",
};

describe("resolveEngineTargets", () => {
  it("infers bucket assignments from holdings when target_assets are empty", () => {
    const result = resolveEngineTargets(bucketSnapshot, holdings);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const voo = result.data.find((item) => item.symbol === "VOO");
    const qqq = result.data.find((item) => item.symbol === "QQQ");
    const cash = result.data.find((item) => item.symbol === "CASH");

    expect(voo?.target_weight).toBeCloseTo(0.55, 4);
    expect(qqq?.target_weight).toBeCloseTo(0.35, 4);
    expect(cash?.target_weight).toBeCloseTo(0.1, 4);
  });
});

describe("buildMonthlyPlanPayload", () => {
  it("deploys the full monthly budget after remainder sweep", () => {
    const result = buildMonthlyPlanPayload({
      profile,
      holdings,
      targets: bucketSnapshot,
      month: "2026-07",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const totalAllocated = roundMoney(
      sumValues(result.data.items.map((item) => item.recommended_amount)),
    );

    expect(totalAllocated).toBe(4000);
    expect(result.data.items.every((item) => item.recommended_amount >= 0)).toBe(
      true,
    );
  });
});
