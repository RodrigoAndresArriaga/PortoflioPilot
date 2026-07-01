import { describe, expect, it } from "vitest";

import {
  buildDashboardAllocationView,
  computeTotalPortfolioValue,
} from "@/lib/dashboard/allocation";
import {
  computeNextInvestmentDate,
  formatInvestmentDate,
} from "@/lib/dashboard/dates";
import type { TargetAllocationsSnapshot } from "@/lib/server/targets";
import type { Holding } from "@/types/database";

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

describe("computeTotalPortfolioValue", () => {
  it("sums holding current values", () => {
    expect(computeTotalPortfolioValue(holdings)).toBe(20000);
  });
});

describe("buildDashboardAllocationView", () => {
  it("rolls up bucket current weights from holdings", () => {
    const view = buildDashboardAllocationView(holdings, bucketSnapshot);

    expect(view.mode).toBe("bucket");
    expect(view.currentSlices).toHaveLength(3);

    const core = view.currentSlices.find((slice) => slice.key === "core_etf");
    const growth = view.currentSlices.find((slice) => slice.key === "growth_tech");
    const cash = view.currentSlices.find((slice) => slice.key === "cash_reserve");

    expect(core?.percent).toBeCloseTo(46, 0);
    expect(growth?.percent).toBeCloseTo(20, 0);
    expect(cash?.percent).toBeCloseTo(34, 0);
  });

  it("derives drift signs for under and over weight buckets", () => {
    const view = buildDashboardAllocationView(holdings, bucketSnapshot);
    const coreDrift = view.driftRows.find((row) => row.key === "core_etf");
    const cashDrift = view.driftRows.find((row) => row.key === "cash_reserve");

    expect(coreDrift?.status).toBe("underweight");
    expect(cashDrift?.status).toBe("overweight");
    expect(coreDrift?.driftPercent).toBeLessThan(0);
    expect(cashDrift?.driftPercent).toBeGreaterThan(0);
  });
});

describe("computeNextInvestmentDate", () => {
  it("returns this month when day is still ahead", () => {
    const reference = new Date(2026, 6, 1);
    const next = computeNextInvestmentDate(15, reference);

    expect(next.getFullYear()).toBe(2026);
    expect(next.getMonth()).toBe(6);
    expect(next.getDate()).toBe(15);
  });

  it("returns next month when day already passed", () => {
    const reference = new Date(2026, 6, 20);
    const next = computeNextInvestmentDate(15, reference);

    expect(next.getFullYear()).toBe(2026);
    expect(next.getMonth()).toBe(7);
    expect(next.getDate()).toBe(15);
  });

  it("clamps day 31 to last day of February", () => {
    const reference = new Date(2026, 0, 10);
    const next = computeNextInvestmentDate(31, reference);

    expect(next.getFullYear()).toBe(2026);
    expect(next.getMonth()).toBe(0);
    expect(next.getDate()).toBe(31);
  });

  it("formats a readable date string", () => {
    const formatted = formatInvestmentDate(new Date(2026, 6, 15));
    expect(formatted).toContain("2026");
    expect(formatted).toContain("15");
  });
});
