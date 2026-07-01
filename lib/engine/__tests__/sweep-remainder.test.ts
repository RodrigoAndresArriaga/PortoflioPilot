import { describe, expect, it } from "vitest";

import {
  applyRemainderSweep,
  buildRemainderSweepContext,
  normalizeBuysToMonthlyBudget,
  scaleDownToMonthlyBudget,
} from "@/lib/engine/sweep-remainder";
import type { AllocationAssetResult } from "@/lib/engine/types";
import { roundMoney, sumValues } from "@/lib/engine/math";

function makeResult(
  partial: Pick<
    AllocationAssetResult,
    "symbol" | "recommended_buy" | "allocation_gap" | "status"
  >,
): AllocationAssetResult {
  return {
    current_value: 5000,
    current_weight: 0.25,
    target_weight: 0.55,
    target_value: 11000,
    reason: "Below drift band; eligible for monthly buys",
    drift_percent: -30,
    drift_status: "prioritize",
    priority: 1,
    action_status: "prioritize",
    ...partial,
  };
}

describe("applyRemainderSweep", () => {
  it("sweeps remainder to cash when all assets are overweight", () => {
    const results = [
      makeResult({
        symbol: "VOO",
        recommended_buy: 0,
        allocation_gap: -1800,
        status: "overweight",
      }),
      makeResult({
        symbol: "CASH",
        recommended_buy: 0,
        allocation_gap: -500,
        status: "overweight",
      }),
    ];

    const swept = applyRemainderSweep(
      results,
      buildRemainderSweepContext({
        monthlyAmount: 4000,
        targetAllocations: [
          { symbol: "VOO", target_weight: 0.55 },
          { symbol: "CASH", target_weight: 0.1 },
        ],
        bucketBySymbol: new Map([
          ["VOO", "core_etf"],
          ["CASH", "cash_reserve"],
        ]),
        enabledBuckets: ["core_etf", "cash_reserve"],
        cashBucketPercent: 10,
      }),
      [
        { symbol: "VOO", current_value: 15000 },
        { symbol: "CASH", current_value: 5000 },
      ],
    );

    const totalBuy = roundMoney(
      sumValues(swept.map((result) => result.recommended_buy)),
    );

    expect(totalBuy).toBe(4000);

    const cash = swept.find((result) => result.symbol === "CASH");
    expect(cash?.recommended_buy).toBe(4000);
    expect(cash?.reason).toContain("Remainder allocated to cash reserve");
  });

  it("sweeps remainder to underweight core ETF before cash", () => {
    const results = [
      makeResult({
        symbol: "VOO",
        recommended_buy: 1500,
        allocation_gap: 1500,
        status: "underweight",
      }),
      makeResult({
        symbol: "QQQ",
        recommended_buy: 1000,
        allocation_gap: 1000,
        status: "underweight",
      }),
      makeResult({
        symbol: "CASH",
        recommended_buy: 0,
        allocation_gap: -200,
        status: "overweight",
      }),
    ];

    const swept = applyRemainderSweep(
      results,
      buildRemainderSweepContext({
        monthlyAmount: 4000,
        targetAllocations: [
          { symbol: "VOO", target_weight: 0.55 },
          { symbol: "QQQ", target_weight: 0.35 },
          { symbol: "CASH", target_weight: 0.1 },
        ],
        bucketBySymbol: new Map([
          ["VOO", "core_etf"],
          ["QQQ", "growth_tech"],
          ["CASH", "cash_reserve"],
        ]),
        enabledBuckets: ["core_etf", "growth_tech", "cash_reserve"],
        cashBucketPercent: 10,
      }),
      [
        { symbol: "VOO", current_value: 5000 },
        { symbol: "QQQ", current_value: 4000 },
        { symbol: "CASH", current_value: 3000 },
      ],
    );

    const totalBuy = roundMoney(
      sumValues(swept.map((result) => result.recommended_buy)),
    );

    expect(totalBuy).toBe(4000);

    const voo = swept.find((result) => result.symbol === "VOO");
    expect(voo?.recommended_buy).toBe(3000);
    expect(voo?.reason).toContain("Remainder allocated to underweight core ETF");
  });

  it("scales down when engine recommends more than the monthly budget", () => {
    const results = [
      makeResult({
        symbol: "VOO",
        recommended_buy: 5000,
        allocation_gap: 5000,
        status: "underweight",
      }),
      makeResult({
        symbol: "QQQ",
        recommended_buy: 3400,
        allocation_gap: 3400,
        status: "underweight",
      }),
    ];

    const scaled = scaleDownToMonthlyBudget(results, 4000);
    const totalBuy = roundMoney(
      sumValues(scaled.map((result) => result.recommended_buy)),
    );

    expect(totalBuy).toBe(4000);
  });

  it("normalizes under- and over-budget plans to the monthly amount", () => {
    const overResults = [
      makeResult({
        symbol: "VOO",
        recommended_buy: 5000,
        allocation_gap: 5000,
        status: "underweight",
      }),
      makeResult({
        symbol: "QQQ",
        recommended_buy: 3400,
        allocation_gap: 3400,
        status: "underweight",
      }),
    ];

    const context = buildRemainderSweepContext({
      monthlyAmount: 4000,
      targetAllocations: [{ symbol: "VOO", target_weight: 0.55 }],
      bucketBySymbol: new Map([["VOO", "core_etf"]]),
      enabledBuckets: ["core_etf"],
    });

    const normalized = normalizeBuysToMonthlyBudget(
      overResults,
      context,
      [{ symbol: "VOO", current_value: 5000 }],
    );

    expect(
      roundMoney(sumValues(normalized.map((result) => result.recommended_buy))),
    ).toBe(4000);
  });
});
