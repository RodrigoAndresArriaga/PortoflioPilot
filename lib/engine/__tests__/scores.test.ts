import { describe, expect, it } from "vitest";

import {
  computeAssetScores,
  computeEtfFinalScore,
  computeStockFinalScore,
  computeTechnicalCompositeScore,
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
    momentum: uniformMomentum,
    trend: uniformTrend,
    volatility: uniformVolatility,
    diversification_score: 65,
    user_fit_score: 70,
    ...partial,
  };
}

describe("computeEtfFinalScore", () => {
  it("uses recommendation-first weights with neutral news", () => {
    const technical = computeTechnicalCompositeScore(80, 60);
    const riskAdjusted = volatilitySafetyScore(40);

    const score = computeEtfFinalScore({
      symbol: "QQQ",
      technical_score: technical,
      risk_adjusted_score: riskAdjusted,
      diversification_score: 65,
      user_fit_score: 70,
    });

    const expected =
      0.3 * technical +
      0.2 * riskAdjusted +
      0.2 * DEFAULT_NEUTRAL_NEWS_SCORE +
      0.15 * 65 +
      0.15 * 70;

    expect(score).toBe(clampScore(expected));
  });

  it("applies a broad ETF boost for VOO", () => {
    const args = {
      technical_score: 70,
      risk_adjusted_score: 60,
      diversification_score: 65,
      user_fit_score: 70,
    };

    const qqq = computeEtfFinalScore({ symbol: "QQQ", ...args });
    const voo = computeEtfFinalScore({ symbol: "VOO", ...args, broad_etf_priority: true });

    expect(voo - qqq).toBe(BROAD_ETF_FINAL_SCORE_BOOST);
    expect(isBroadEtfSymbol("VOO")).toBe(true);
  });
});

describe("computeStockFinalScore", () => {
  it("uses recommendation-first weights with neutral news", () => {
    const score = computeStockFinalScore({
      technical_score: 70,
      quality_score: 75,
      news_score: DEFAULT_NEUTRAL_NEWS_SCORE,
      risk_adjusted_score: volatilitySafetyScore(40),
      diversification_score: 55,
      user_fit_score: 65,
    });

    const expected =
      0.25 * 70 +
      0.2 * 75 +
      0.2 * DEFAULT_NEUTRAL_NEWS_SCORE +
      0.15 * volatilitySafetyScore(40) +
      0.1 * 55 +
      0.1 * 65;

    expect(score).toBe(clampScore(expected));
  });
});

describe("computeAssetScores", () => {
  it("returns ETF final score only for ETFs", () => {
    const result = computeAssetScores(etfInput({ symbol: "VOO" }));

    expect(result.etf_final_score).not.toBeNull();
    expect(result.stock_final_score).toBeNull();
    expect(result.technical_score).toBeGreaterThan(0);
  });

  it("does not export buy or sell amounts", () => {
    const result = computeAssetScores(etfInput({ symbol: "VOO" }));

    expect(result).not.toHaveProperty("recommended_buy");
    expect(JSON.stringify(result).toLowerCase()).not.toContain("sell");
  });
});

describe("technical helpers", () => {
  it("computes momentum score", () => {
    expect(computeMomentumScore(uniformMomentum)).toBe(80);
  });

  it("computes trend score", () => {
    expect(computeTrendScore(uniformTrend)).toBe(80);
  });

  it("computes volatility risk score", () => {
    expect(computeVolatilityRiskScore(uniformVolatility)).toBe(80);
  });
});
