import { describe, expect, it } from "vitest";

import {
  computeAssetScores,
  computeEtfFinalScore,
  computeStockFinalScore,
} from "@/lib/engine/final-score";
import {
  BROAD_ETF_FINAL_SCORE_BOOST,
  clampScore,
  DEFAULT_NEUTRAL_NEWS_SCORE,
  isBroadEtfSymbol,
  volatilitySafetyScore,
  type AssetScoreInput,
  type MomentumInputs,
  type TrendInputs,
  type VolatilityInputs,
} from "@/lib/engine/scores";
import {
  computeMomentumScore,
  computeTrendScore,
  computeVolatilityRiskScore,
} from "@/lib/engine/technical";

const uniformMomentum: MomentumInputs = {
  return_12m: 80,
  return_6m: 80,
  return_3m: 80,
  price_above_200dma: 80,
};

const uniformTrend: TrendInputs = {
  price_above_200dma: 80,
  price_above_50dma: 80,
  ma50_above_200dma: 80,
};

const uniformVolatility: VolatilityInputs = {
  volatility_90d: 80,
  max_drawdown_1y: 80,
  beta: 80,
  downside_volatility: 80,
};

function etfInput(
  partial: Partial<AssetScoreInput> & Pick<AssetScoreInput, "symbol">,
): AssetScoreInput {
  return {
    asset_kind: "etf",
    target_allocation_gap_score: 70,
    momentum: uniformMomentum,
    trend: uniformTrend,
    volatility: uniformVolatility,
    ...partial,
  };
}

describe("computeMomentumScore", () => {
  it("returns the weighted average for uniform inputs", () => {
    expect(computeMomentumScore(uniformMomentum)).toBe(80);
  });

  it("weights 12-month return the most", () => {
    const score = computeMomentumScore({
      return_12m: 100,
      return_6m: 0,
      return_3m: 0,
      price_above_200dma: 0,
    });

    expect(score).toBe(40);
  });

  it("clamps out-of-range components", () => {
    const score = computeMomentumScore({
      return_12m: 150,
      return_6m: -20,
      return_3m: 80,
      price_above_200dma: 80,
    });

    expect(score).toBe(64);
  });
});

describe("computeTrendScore", () => {
  it("returns the weighted average for uniform inputs", () => {
    expect(computeTrendScore(uniformTrend)).toBe(80);
  });

  it("weights the 200-day signal the most", () => {
    const score = computeTrendScore({
      price_above_200dma: 100,
      price_above_50dma: 0,
      ma50_above_200dma: 0,
    });

    expect(score).toBe(40);
  });
});

describe("computeVolatilityRiskScore", () => {
  it("returns the weighted average for uniform inputs", () => {
    expect(computeVolatilityRiskScore(uniformVolatility)).toBe(80);
  });

  it("weights 90-day volatility the most", () => {
    const score = computeVolatilityRiskScore({
      volatility_90d: 100,
      max_drawdown_1y: 0,
      beta: 0,
      downside_volatility: 0,
    });

    expect(score).toBe(35);
  });
});

describe("computeEtfFinalScore", () => {
  it("uses the spec weights with neutral news", () => {
    const score = computeEtfFinalScore({
      symbol: "QQQ",
      target_allocation_gap_score: 70,
      trend_score: 80,
      momentum_score: 60,
      volatility_risk_score: 40,
    });

    const expected =
      0.35 * 70 +
      0.25 * 80 +
      0.2 * 60 +
      0.15 * volatilitySafetyScore(40) +
      0.05 * DEFAULT_NEUTRAL_NEWS_SCORE;

    expect(score).toBe(clampScore(expected));
  });

  it("applies a broad ETF boost for VOO", () => {
    const baseArgs = {
      target_allocation_gap_score: 70,
      trend_score: 80,
      momentum_score: 60,
      volatility_risk_score: 40,
    };

    const qqq = computeEtfFinalScore({ symbol: "QQQ", ...baseArgs });
    const voo = computeEtfFinalScore({ symbol: "VOO", ...baseArgs });

    expect(voo - qqq).toBe(BROAD_ETF_FINAL_SCORE_BOOST);
    expect(isBroadEtfSymbol("VOO")).toBe(true);
  });

  it("lowers the final score when volatility risk is high", () => {
    const lowRisk = computeEtfFinalScore({
      symbol: "QQQ",
      target_allocation_gap_score: 70,
      trend_score: 80,
      momentum_score: 60,
      volatility_risk_score: 20,
    });
    const highRisk = computeEtfFinalScore({
      symbol: "QQQ",
      target_allocation_gap_score: 70,
      trend_score: 80,
      momentum_score: 60,
      volatility_risk_score: 80,
    });

    expect(lowRisk).toBeGreaterThan(highRisk);
  });
});

describe("computeStockFinalScore", () => {
  it("uses the spec weights with neutral news", () => {
    const score = computeStockFinalScore({
      target_allocation_gap_score: 70,
      quality_score: 75,
      momentum_score: 60,
      value_score: 55,
      volatility_risk_score: 40,
      growth_score: 65,
    });

    const expected =
      0.25 * 70 +
      0.2 * 75 +
      0.2 * 60 +
      0.15 * 55 +
      0.1 * volatilitySafetyScore(40) +
      0.1 * DEFAULT_NEUTRAL_NEWS_SCORE;

    expect(score).toBe(clampScore(expected));
  });
});

describe("computeAssetScores", () => {
  it("is deterministic for repeated calls", () => {
    const input = etfInput({ symbol: "VOO" });
    const first = computeAssetScores(input);
    const second = computeAssetScores(input);

    expect(first).toEqual(second);
  });

  it("returns ETF final score only for ETFs", () => {
    const result = computeAssetScores(etfInput({ symbol: "VOO" }));

    expect(result).toMatchObject({
      symbol: "VOO",
      asset_kind: "etf",
      momentum_score: 80,
      trend_score: 80,
      volatility_risk_score: 80,
      stock_final_score: null,
    });
    expect(result.etf_final_score).not.toBeNull();
  });

  it("returns stock final score only for stocks", () => {
    const result = computeAssetScores({
      symbol: "NVDA",
      asset_kind: "stock",
      target_allocation_gap_score: 70,
      momentum: uniformMomentum,
      trend: uniformTrend,
      volatility: uniformVolatility,
      stock_factors: {
        quality: 75,
        value: 55,
        growth: 65,
      },
    });

    expect(result.etf_final_score).toBeNull();
    expect(result.stock_final_score).not.toBeNull();
  });

  it("lets target allocation gap dominate ETF ranking", () => {
    const highGap = computeEtfFinalScore({
      symbol: "QQQ",
      target_allocation_gap_score: 90,
      trend_score: 70,
      momentum_score: 30,
      volatility_risk_score: 40,
    });
    const highMomentum = computeEtfFinalScore({
      symbol: "QQQ",
      target_allocation_gap_score: 40,
      trend_score: 70,
      momentum_score: 90,
      volatility_risk_score: 40,
    });

    expect(highGap).toBeGreaterThan(highMomentum);
  });

  it("does not export buy or sell amounts", () => {
    const result = computeAssetScores(etfInput({ symbol: "VOO" }));

    expect(result).not.toHaveProperty("recommended_buy");
    expect(result).not.toHaveProperty("recommended_sell");
    expect(JSON.stringify(result).toLowerCase()).not.toContain("sell");
  });
});
