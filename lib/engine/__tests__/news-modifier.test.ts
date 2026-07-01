import { describe, expect, it } from "vitest";

import { computeAllocationWithNewsModifiers } from "@/lib/engine/allocation";
import {
  applyNewsModifiers,
  mergeNewsSignalsBySymbol,
  resolveEffectiveBias,
} from "@/lib/engine/news-modifier";
import { buildRemainderSweepContext } from "@/lib/engine/sweep-remainder";
import type { AllocationAssetResult } from "@/lib/engine/types";
import { roundMoney, sumValues } from "@/lib/engine/math";

function makeResult(
  partial: Pick<
    AllocationAssetResult,
    "symbol" | "recommended_buy" | "allocation_gap" | "status"
  > & { reason?: string },
): AllocationAssetResult {
  return {
    current_value: 5000,
    current_weight: 0.25,
    target_weight: 0.55,
    target_value: 11000,
    reason: partial.reason ?? "Below drift band; eligible for monthly buys",
    drift_percent: -30,
    drift_status: "prioritize",
    priority: 1,
    action_status: "prioritize",
    ...partial,
  };
}

function findModifier(
  modifiers: ReturnType<typeof applyNewsModifiers>["modifiers"],
  symbol: string,
) {
  return modifiers.find((modifier) => modifier.symbol === symbol);
}

describe("applyNewsModifiers", () => {
  it("1. hold + confidence 80 leaves buy unchanged", () => {
    const results = [makeResult({ symbol: "NVDA", recommended_buy: 200, allocation_gap: 200, status: "underweight" })];
    const { results: adjusted, modifiers } = applyNewsModifiers(results, [
      {
        symbol: "NVDA",
        asset_type: "stock",
        ai_bias: "hold",
        news_confidence: 80,
      },
    ]);

    expect(adjusted[0].recommended_buy).toBe(200);
    expect(findModifier(modifiers, "NVDA")).toMatchObject({
      applied: false,
      effective_bias: "hold",
      blocked_amount: 0,
      manual_review_required: false,
    });
  });

  it("2. watch + confidence 70 halves the buy", () => {
    const results = [makeResult({ symbol: "NVDA", recommended_buy: 200, allocation_gap: 200, status: "underweight" })];
    const { results: adjusted, modifiers } = applyNewsModifiers(results, [
      {
        symbol: "NVDA",
        asset_type: "stock",
        ai_bias: "watch",
        news_confidence: 70,
      },
    ]);

    expect(adjusted[0].recommended_buy).toBe(100);
    expect(findModifier(modifiers, "NVDA")).toMatchObject({
      applied: true,
      effective_bias: "watch",
      blocked_amount: 100,
    });
    expect(adjusted[0].reason).toContain("buy reduced 50%");
  });

  it("3. reduce + confidence 75 zeroes the buy", () => {
    const results = [makeResult({ symbol: "NVDA", recommended_buy: 200, allocation_gap: 200, status: "underweight" })];
    const { results: adjusted, modifiers } = applyNewsModifiers(results, [
      {
        symbol: "NVDA",
        asset_type: "stock",
        ai_bias: "reduce",
        news_confidence: 75,
      },
    ]);

    expect(adjusted[0].recommended_buy).toBe(0);
    expect(findModifier(modifiers, "NVDA")).toMatchObject({
      applied: true,
      effective_bias: "reduce",
      blocked_amount: 200,
    });
  });

  it("4. avoid + confidence 80 zeroes buy and flags manual review", () => {
    const results = [makeResult({ symbol: "NVDA", recommended_buy: 200, allocation_gap: 200, status: "underweight" })];
    const { results: adjusted, modifiers } = applyNewsModifiers(results, [
      {
        symbol: "NVDA",
        asset_type: "stock",
        ai_bias: "avoid",
        news_confidence: 80,
      },
    ]);

    expect(adjusted[0].recommended_buy).toBe(0);
    expect(findModifier(modifiers, "NVDA")).toMatchObject({
      applied: true,
      effective_bias: "avoid",
      blocked_amount: 200,
      manual_review_required: true,
    });
    expect(adjusted[0].reason).toContain("manual review required");
  });

  it("5. watch + confidence 55 is ignored", () => {
    const results = [makeResult({ symbol: "NVDA", recommended_buy: 200, allocation_gap: 200, status: "underweight" })];
    const { results: adjusted, modifiers } = applyNewsModifiers(results, [
      {
        symbol: "NVDA",
        asset_type: "stock",
        ai_bias: "watch",
        news_confidence: 55,
      },
    ]);

    expect(adjusted[0].recommended_buy).toBe(200);
    expect(findModifier(modifiers, "NVDA")).toMatchObject({
      applied: false,
      effective_bias: "watch",
      blocked_amount: 0,
    });
  });

  it("6. VOO broad ETF + watch + short_term is ignored", () => {
    const results = [makeResult({ symbol: "VOO", recommended_buy: 2000, allocation_gap: 2000, status: "underweight" })];
    const { results: adjusted, modifiers } = applyNewsModifiers(results, [
      {
        symbol: "VOO",
        asset_type: "etf",
        ai_bias: "watch",
        news_confidence: 80,
        impact_horizon: "short_term",
      },
    ]);

    expect(adjusted[0].recommended_buy).toBe(2000);
    expect(findModifier(modifiers, "VOO")).toMatchObject({
      applied: false,
      blocked_amount: 0,
    });
  });

  it("7. NVDA watch + short_term still applies 50% reduction", () => {
    const results = [makeResult({ symbol: "NVDA", recommended_buy: 200, allocation_gap: 200, status: "underweight" })];
    const { results: adjusted } = applyNewsModifiers(results, [
      {
        symbol: "NVDA",
        asset_type: "stock",
        ai_bias: "watch",
        news_confidence: 72,
        impact_horizon: "short_term",
      },
    ]);

    expect(adjusted[0].recommended_buy).toBe(100);
  });

  it("8. add + disagreeing technical leaves buy unchanged", () => {
    const results = [makeResult({ symbol: "NVDA", recommended_buy: 200, allocation_gap: 200, status: "underweight" })];
    const { results: adjusted, modifiers } = applyNewsModifiers(
      results,
      [
        {
          symbol: "NVDA",
          asset_type: "stock",
          ai_bias: "add",
          news_confidence: 80,
        },
      ],
      new Map([
        [
          "NVDA",
          { momentum_score: 40, trend_score: 55, volatility_risk_score: 60 },
        ],
      ]),
    );

    expect(adjusted[0].recommended_buy).toBe(200);
    expect(findModifier(modifiers, "NVDA")).toMatchObject({
      applied: false,
      effective_bias: "hold",
    });
  });

  it("9. add + agreeing technical does not boost buys", () => {
    const results = [makeResult({ symbol: "NVDA", recommended_buy: 200, allocation_gap: 200, status: "underweight" })];
    const { results: adjusted, modifiers } = applyNewsModifiers(
      results,
      [
        {
          symbol: "NVDA",
          asset_type: "stock",
          ai_bias: "add",
          news_confidence: 80,
        },
      ],
      new Map([
        [
          "NVDA",
          { momentum_score: 60, trend_score: 55, volatility_risk_score: 45 },
        ],
      ]),
    );

    expect(adjusted[0].recommended_buy).toBe(200);
    expect(findModifier(modifiers, "NVDA")).toMatchObject({
      applied: false,
      effective_bias: "add",
    });
  });

  it("10. zero baseline buy with reduce bias stays unchanged", () => {
    const results = [
      makeResult({
        symbol: "NVDA",
        recommended_buy: 0,
        allocation_gap: -500,
        status: "overweight",
        reason: "Above drift band; no buy this month",
      }),
    ];
    const { results: adjusted, modifiers } = applyNewsModifiers(results, [
      {
        symbol: "NVDA",
        asset_type: "stock",
        ai_bias: "reduce",
        news_confidence: 90,
      },
    ]);

    expect(adjusted[0].recommended_buy).toBe(0);
    expect(findModifier(modifiers, "NVDA")).toMatchObject({
      applied: false,
      blocked_amount: 0,
    });
  });

  it("12. weekly reduce_new_buys maps to reduce behavior", () => {
    expect(
      resolveEffectiveBias({
        symbol: "QQQ",
        suggested_frontend_status: "reduce_new_buys",
      }),
    ).toBe("reduce");

    const results = [makeResult({ symbol: "QQQ", recommended_buy: 400, allocation_gap: 400, status: "underweight" })];
    const { results: adjusted } = applyNewsModifiers(results, [
      {
        symbol: "QQQ",
        suggested_frontend_status: "reduce_new_buys",
      },
    ]);

    expect(adjusted[0].recommended_buy).toBe(0);
  });

  it("13. strictest-wins merge picks avoid over hold", () => {
    const merged = mergeNewsSignalsBySymbol([
      { symbol: "NVDA", ai_bias: "hold", news_confidence: 80 },
      { symbol: "NVDA", ai_bias: "avoid", news_confidence: 85 },
    ]);

    expect(resolveEffectiveBias(merged.get("NVDA")!)).toBe("avoid");

    const results = [makeResult({ symbol: "NVDA", recommended_buy: 200, allocation_gap: 200, status: "underweight" })];
    const { results: adjusted } = applyNewsModifiers(results, [
      { symbol: "NVDA", ai_bias: "hold", news_confidence: 80 },
      { symbol: "NVDA", ai_bias: "avoid", news_confidence: 85 },
    ]);

    expect(adjusted[0].recommended_buy).toBe(0);
  });
});

describe("computeAllocationWithNewsModifiers", () => {
  it("11. blocked NVDA buy is re-swept to core ETF or cash with full budget", () => {
    const monthlyAmount = 4000;
    const sweepContext = buildRemainderSweepContext({
      monthlyAmount,
      targetAllocations: [
        { symbol: "VOO", target_weight: 0.55 },
        { symbol: "NVDA", target_weight: 0.25 },
        { symbol: "CASH", target_weight: 0.1 },
      ],
      bucketBySymbol: new Map([
        ["VOO", "core_etf"],
        ["NVDA", "growth_tech"],
        ["CASH", "cash_reserve"],
      ]),
      enabledBuckets: ["core_etf", "growth_tech", "cash_reserve"],
      cashBucketPercent: 10,
    });

    const holdings = [
      { symbol: "VOO", current_value: 4000 },
      { symbol: "NVDA", current_value: 1500 },
      { symbol: "CASH", current_value: 3500 },
    ];

    const { baseline, adjusted } = computeAllocationWithNewsModifiers({
      allocation: {
        holdings,
        target_allocations: [
          { symbol: "VOO", target_weight: 0.55 },
          { symbol: "NVDA", target_weight: 0.25 },
          { symbol: "CASH", target_weight: 0.1 },
        ],
        monthly_investment_amount: monthlyAmount,
      },
      newsSignals: [
        {
          symbol: "NVDA",
          asset_type: "stock",
          ai_bias: "reduce",
          news_confidence: 75,
        },
      ],
      sweepContext,
      holdings,
    });

    const baselineNvda = baseline.find((result) => result.symbol === "NVDA");
    const adjustedNvda = adjusted.find((result) => result.symbol === "NVDA");
    expect(baselineNvda!.recommended_buy).toBeGreaterThan(0);
    expect(adjustedNvda!.recommended_buy).toBe(0);

    const adjustedTotal = roundMoney(
      sumValues(adjusted.map((result) => result.recommended_buy)),
    );
    expect(adjustedTotal).toBe(monthlyAmount);

    const voo = adjusted.find((result) => result.symbol === "VOO");
    const cash = adjusted.find((result) => result.symbol === "CASH");
    const redirected = (voo?.recommended_buy ?? 0) + (cash?.recommended_buy ?? 0);
    expect(redirected).toBeGreaterThan(
      (baseline.find((result) => result.symbol === "VOO")?.recommended_buy ?? 0) +
        (baseline.find((result) => result.symbol === "CASH")?.recommended_buy ?? 0),
    );
  });
});
