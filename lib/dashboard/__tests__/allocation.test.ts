import { describe, expect, it } from "vitest";

import { buildDashboardExposureView, computeTotalPortfolioValue } from "@/lib/dashboard/allocation";
import type { Holding } from "@/types/database";

const holdings: Holding[] = [
  {
    id: "1",
    user_id: "u1",
    portfolio_id: "p1",
    symbol: "VOO",
    asset_name: "Vanguard S&P 500 ETF",
    asset_type: "etf",
    currency: "USD",
    shares: null,
    current_value: 7000,
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
    current_value: 3000,
    last_price: null,
    last_price_at: null,
    price_source: null,
    cost_basis: null,
    broker: null,
    created_at: "",
    updated_at: "",
  },
];

describe("buildDashboardExposureView", () => {
  it("builds current exposure slices without targets", () => {
    const view = buildDashboardExposureView(holdings);

    expect(view.currentSlices).toHaveLength(2);
    expect(view.currentSlices[0]?.key).toBe("VOO");
    expect(view.currentSlices[0]?.percent).toBeCloseTo(70, 1);
    expect(view.currentSlices[1]?.percent).toBeCloseTo(30, 1);
  });

  it("computes total portfolio value", () => {
    expect(computeTotalPortfolioValue(holdings)).toBe(10000);
  });
});
