import { roundMoney } from "@/lib/engine/math";
import {
  BROAD_ETF_FINAL_SCORE_BOOST,
  clampScore,
  DEFAULT_NEUTRAL_NEWS_SCORE,
  isBroadEtfSymbol,
  volatilitySafetyScore,
  type AssetScoreInput,
  type AssetScoreResult,
} from "@/lib/engine/scores";
import {
  computeMomentumScore,
  computeTrendScore,
  computeVolatilityRiskScore,
} from "@/lib/engine/technical";

type EtfFinalScoreArgs = {
  symbol: string;
  target_allocation_gap_score: number;
  trend_score: number;
  momentum_score: number;
  volatility_risk_score: number;
  news_score?: number;
};

type StockFinalScoreArgs = {
  target_allocation_gap_score: number;
  quality_score: number;
  momentum_score: number;
  value_score: number;
  volatility_risk_score: number;
  growth_score: number;
  news_score?: number;
};

// composite ETF score with broad-ETF priority boost
export function computeEtfFinalScore(args: EtfFinalScoreArgs): number {
  const gap = clampScore(args.target_allocation_gap_score);
  const trend = clampScore(args.trend_score);
  const momentum = clampScore(args.momentum_score);
  const safety = volatilitySafetyScore(args.volatility_risk_score);
  const news = clampScore(args.news_score ?? DEFAULT_NEUTRAL_NEWS_SCORE);

  let score =
    0.35 * gap +
    0.25 * trend +
    0.2 * momentum +
    0.15 * safety +
    0.05 * news;

  if (isBroadEtfSymbol(args.symbol)) {
    score += BROAD_ETF_FINAL_SCORE_BOOST;
  }

  return clampScore(roundMoney(score, 2));
}

// composite stock score
export function computeStockFinalScore(args: StockFinalScoreArgs): number {
  const gap = clampScore(args.target_allocation_gap_score);
  const quality = clampScore(args.quality_score);
  const momentum = clampScore(args.momentum_score);
  const value = clampScore(args.value_score);
  const safety = volatilitySafetyScore(args.volatility_risk_score);
  const growth = clampScore(args.growth_score);
  const news = clampScore(args.news_score ?? DEFAULT_NEUTRAL_NEWS_SCORE);

  const score =
    0.25 * gap +
    0.2 * quality +
    0.2 * momentum +
    0.15 * value +
    0.1 * safety +
    0.1 * news;

  return clampScore(roundMoney(score, 2));
}

// compute all scores for one asset
export function computeAssetScores(input: AssetScoreInput): AssetScoreResult {
  const momentumScore = computeMomentumScore(input.momentum);
  const trendScore = computeTrendScore(input.trend);
  const volatilityRiskScore = computeVolatilityRiskScore(input.volatility);

  if (input.asset_kind === "etf") {
    return {
      symbol: input.symbol,
      asset_kind: input.asset_kind,
      momentum_score: momentumScore,
      trend_score: trendScore,
      volatility_risk_score: volatilityRiskScore,
      etf_final_score: computeEtfFinalScore({
        symbol: input.symbol,
        target_allocation_gap_score: input.target_allocation_gap_score,
        trend_score: trendScore,
        momentum_score: momentumScore,
        volatility_risk_score: volatilityRiskScore,
        news_score: input.news_score,
      }),
      stock_final_score: null,
    };
  }

  if (!input.stock_factors) {
    throw new Error("stock_factors are required for stock assets");
  }

  return {
    symbol: input.symbol,
    asset_kind: input.asset_kind,
    momentum_score: momentumScore,
    trend_score: trendScore,
    volatility_risk_score: volatilityRiskScore,
    etf_final_score: null,
    stock_final_score: computeStockFinalScore({
      target_allocation_gap_score: input.target_allocation_gap_score,
      quality_score: input.stock_factors.quality,
      momentum_score: momentumScore,
      value_score: input.stock_factors.value,
      volatility_risk_score: volatilityRiskScore,
      growth_score: input.stock_factors.growth,
      news_score: input.news_score,
    }),
  };
}
