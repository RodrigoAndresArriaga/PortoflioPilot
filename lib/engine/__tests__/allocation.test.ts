import { describe, expect, it } from "vitest";

import { computeTargetAllocation } from "@/lib/engine/allocation";

function findSymbol(
  results: ReturnType<typeof computeTargetAllocation>,
  symbol: string,
) {
  return results.find((result) => result.symbol === symbol);
}

function expectDriftFields(result: NonNullable<ReturnType<typeof findSymbol>>) {
  expect(result.drift_percent).toBeDefined();
  expect(result.drift_status).toBeDefined();
  expect(result.action_status).toBeDefined();
  expect(result).toHaveProperty("priority");
}

describe("computeTargetAllocation", () => {
  it("matches the algorithm spec VOO example inside the drift band", () => {
    const results = computeTargetAllocation({
      holdings: [
        { symbol: "VOO", current_value: 9200 },
        { symbol: "CASH", current_value: 6800 },
      ],
      target_allocations: [{ symbol: "VOO", target_weight: 0.55 }],
      monthly_investment_amount: 4000,
    });

    const voo = findSymbol(results, "VOO");
    expect(voo).toBeDefined();
    expectDriftFields(voo!);

    expect(voo).toMatchObject({
      current_value: 9200,
      current_weight: 0.575,
      target_weight: 0.55,
      target_value: 11000,
      allocation_gap: 1800,
      recommended_buy: 0,
      drift_percent: 2.5,
      drift_status: "normal",
      action_status: "normal",
      status: "on_target",
      priority: null,
    });
  });

  it("never returns negative recommended buys", () => {
    const results = computeTargetAllocation({
      holdings: [{ symbol: "VOO", current_value: 15000 }],
      target_allocations: [{ symbol: "VOO", target_weight: 0.55 }],
      monthly_investment_amount: 4000,
    });

    for (const result of results) {
      expect(result.recommended_buy).toBeGreaterThanOrEqual(0);
      expect(result.allocation_gap).toBeLessThan(0);
      expect(result.recommended_buy).toBe(0);
      expectDriftFields(result);
    }
  });

  it("gives overweight assets zero recommended buys", () => {
    const results = computeTargetAllocation({
      holdings: [
        { symbol: "VOO", current_value: 12000 },
        { symbol: "QQQ", current_value: 4000 },
      ],
      target_allocations: [
        { symbol: "VOO", target_weight: 0.55 },
        { symbol: "QQQ", target_weight: 0.25 },
      ],
      monthly_investment_amount: 0,
    });

    const voo = findSymbol(results, "VOO");
    expect(voo).toBeDefined();
    expectDriftFields(voo!);

    expect(voo).toMatchObject({
      recommended_buy: 0,
      drift_status: "stop_buying",
      action_status: "stop_buying",
      status: "overweight",
      reason: "Above drift band; no buy this month",
    });
  });

  it("prioritizes underweight assets by recommended buy amount", () => {
    const results = computeTargetAllocation({
      holdings: [
        { symbol: "VOO", current_value: 5000 },
        { symbol: "QQQ", current_value: 2000 },
        { symbol: "VXUS", current_value: 9000 },
      ],
      target_allocations: [
        { symbol: "VOO", target_weight: 0.55 },
        { symbol: "QQQ", target_weight: 0.25 },
        { symbol: "VXUS", target_weight: 0.2 },
      ],
      monthly_investment_amount: 4000,
    });

    const underweight = results.filter(
      (result) => result.drift_status === "prioritize",
    );
    const overweight = results.filter(
      (result) => result.drift_status === "stop_buying",
    );

    expect(underweight.length).toBeGreaterThan(0);
    expect(overweight.length).toBeGreaterThan(0);

    for (const result of results) {
      expectDriftFields(result);
    }

    for (let index = 0; index < underweight.length - 1; index += 1) {
      expect(underweight[index].priority).toBeLessThan(
        underweight[index + 1].priority ?? Number.MAX_SAFE_INTEGER,
      );
      expect(underweight[index].recommended_buy).toBeGreaterThanOrEqual(
        underweight[index + 1].recommended_buy,
      );
    }

    const firstOverweightIndex = results.findIndex(
      (result) => result.drift_status === "stop_buying",
    );
    const lastUnderweightIndex = results.findLastIndex(
      (result) => result.drift_status === "prioritize",
    );

    if (firstOverweightIndex >= 0 && lastUnderweightIndex >= 0) {
      expect(lastUnderweightIndex).toBeLessThan(firstOverweightIndex);
    }
  });

  it("handles target-only symbols with zero current value", () => {
    const results = computeTargetAllocation({
      holdings: [{ symbol: "CASH", current_value: 10000 }],
      target_allocations: [
        { symbol: "VOO", target_weight: 0.55 },
        { symbol: "CASH", target_weight: 0.45 },
      ],
      monthly_investment_amount: 4000,
    });

    const voo = findSymbol(results, "VOO");
    expect(voo).toBeDefined();
    expectDriftFields(voo!);

    expect(voo).toMatchObject({
      current_value: 0,
      current_weight: 0,
      target_value: 7700,
      allocation_gap: 7700,
      recommended_buy: 7700,
      drift_status: "prioritize",
      action_status: "prioritize",
      status: "underweight",
      priority: 1,
    });
  });

  it("handles holding-only symbols with zero target weight", () => {
    const results = computeTargetAllocation({
      holdings: [
        { symbol: "VOO", current_value: 8000 },
        { symbol: "LEGACY", current_value: 2000 },
      ],
      target_allocations: [{ symbol: "VOO", target_weight: 1 }],
      monthly_investment_amount: 0,
    });

    const legacy = findSymbol(results, "LEGACY");
    expect(legacy).toBeDefined();
    expectDriftFields(legacy!);

    expect(legacy).toMatchObject({
      current_value: 2000,
      target_weight: 0,
      target_value: 0,
      allocation_gap: -2000,
      recommended_buy: 0,
      drift_status: "stop_buying",
      status: "overweight",
    });
  });

  it("allocates from monthly contribution when portfolio value is zero", () => {
    const results = computeTargetAllocation({
      holdings: [],
      target_allocations: [
        { symbol: "VOO", target_weight: 0.7 },
        { symbol: "QQQ", target_weight: 0.3 },
      ],
      monthly_investment_amount: 4000,
    });

    expect(findSymbol(results, "VOO")).toMatchObject({
      current_value: 0,
      target_value: 2800,
      recommended_buy: 2800,
      drift_status: "prioritize",
      priority: 1,
    });
    expect(findSymbol(results, "QQQ")).toMatchObject({
      current_value: 0,
      target_value: 1200,
      recommended_buy: 1200,
      drift_status: "prioritize",
      priority: 2,
    });
  });

  it("computes gaps without monthly contribution", () => {
    const results = computeTargetAllocation({
      holdings: [{ symbol: "VOO", current_value: 9200 }],
      target_allocations: [{ symbol: "VOO", target_weight: 0.55 }],
      monthly_investment_amount: 0,
    });

    expect(findSymbol(results, "VOO")).toMatchObject({
      target_value: 5060,
      allocation_gap: -4140,
      recommended_buy: 0,
      drift_status: "stop_buying",
      status: "overweight",
    });
  });

  it("normalizes symbol casing and merges duplicate holdings", () => {
    const results = computeTargetAllocation({
      holdings: [
        { symbol: " voo ", current_value: 5000 },
        { symbol: "Voo", current_value: 4200 },
        { symbol: "CASH", current_value: 6800 },
      ],
      target_allocations: [{ symbol: "voo", target_weight: 0.55 }],
      monthly_investment_amount: 4000,
    });

    expect(results).toHaveLength(2);
    expect(findSymbol(results, "VOO")).toMatchObject({
      symbol: "VOO",
      current_value: 9200,
      recommended_buy: 0,
      drift_status: "normal",
    });
  });
});
