import { describe, expect, it } from "vitest";

import { computeMonthlyPlanSummary } from "@/lib/monthly-plan/summary";

describe("computeMonthlyPlanSummary", () => {
  it("separates cash reserve from asset allocations", () => {
    const summary = computeMonthlyPlanSummary(4000, [
      { symbol: "VOO", adjusted_amount: 1800 },
      { symbol: "QQQ", adjusted_amount: 1200 },
      { symbol: "CASH", adjusted_amount: 500 },
    ]);

    expect(summary).toEqual({
      cashReserve: 500,
      allocatedToAssets: 3000,
      manualTradeCount: 2,
      totalAllocated: 3500,
      unallocated: 500,
    });
  });

  it("counts zero-buy assets separately from manual trades", () => {
    const summary = computeMonthlyPlanSummary(4000, [
      { symbol: "VOO", adjusted_amount: 0 },
      { symbol: "QQQ", adjusted_amount: 500 },
    ]);

    expect(summary.manualTradeCount).toBe(1);
    expect(summary.allocatedToAssets).toBe(500);
  });
});
