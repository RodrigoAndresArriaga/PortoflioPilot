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
  technical_score: number;
  risk_adjusted_score: number;
  news_score?: number;
  diversification_score: number;
  user_fit_score: number;
  broad_etf_priority?: boolean;
};

type StockFinalScoreArgs = {
  technical_score: number;
  quality_score: number;
  news_score?: number;
  risk_adjusted_score: number;
  diversification_score: number;
  user_fit_score: number;
};

// composite technical score from momentum and trend
export function computeTechnicalCompositeScore(
  momentumScore: number,
  trendScore: number,
): number {
  return clampScore(0.55 * momentumScore + 0.45 * trendScore);
}

// composite ETF recommendation score
export function computeEtfFinalScore(args: EtfFinalScoreArgs): number {
  const technical = clampScore(args.technical_score);
  const riskAdjusted = clampScore(args.risk_adjusted_score);
  const news = clampScore(args.news_score ?? DEFAULT_NEUTRAL_NEWS_SCORE);
  const diversification = clampScore(args.diversification_score);
  const userFit = clampScore(args.user_fit_score);

  let score =
    0.3 * technical +
    0.2 * riskAdjusted +
    0.2 * news +
    0.15 * diversification +
    0.15 * userFit;

  if (
    args.broad_etf_priority !== false &&
    isBroadEtfSymbol(args.symbol)
  ) {
    score += BROAD_ETF_FINAL_SCORE_BOOST;
  }

  return clampScore(roundMoney(score, 2));
}

// composite stock recommendation score
export function computeStockFinalScore(args: StockFinalScoreArgs): number {
  const technical = clampScore(args.technical_score);
  const quality = clampScore(args.quality_score);
  const news = clampScore(args.news_score ?? DEFAULT_NEUTRAL_NEWS_SCORE);
  const riskAdjusted = clampScore(args.risk_adjusted_score);
  const diversification = clampScore(args.diversification_score);
  const userFit = clampScore(args.user_fit_score);

  const score =
    0.25 * technical +
    0.2 * quality +
    0.2 * news +
    0.15 * riskAdjusted +
    0.1 * diversification +
    0.1 * userFit;

  return clampScore(roundMoney(score, 2));
}

// compute all scores for one asset
export function computeAssetScores(input: AssetScoreInput): AssetScoreResult {
  const momentumScore = computeMomentumScore(input.momentum);
  const trendScore = computeTrendScore(input.trend);
  const volatilityRiskScore = computeVolatilityRiskScore(input.volatility);
  const technicalScore = computeTechnicalCompositeScore(
    momentumScore,
    trendScore,
  );
  const riskAdjustedScore = volatilitySafetyScore(volatilityRiskScore);

  if (input.asset_kind === "etf") {
    return {
      symbol: input.symbol,
      asset_kind: input.asset_kind,
      momentum_score: momentumScore,
      trend_score: trendScore,
      volatility_risk_score: volatilityRiskScore,
      technical_score: technicalScore,
      risk_adjusted_score: riskAdjustedScore,
      etf_final_score: computeEtfFinalScore({
        symbol: input.symbol,
        technical_score: technicalScore,
        risk_adjusted_score: riskAdjustedScore,
        news_score: input.news_score,
        diversification_score: input.diversification_score,
        user_fit_score: input.user_fit_score,
        broad_etf_priority: input.broad_etf_priority,
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
    technical_score: technicalScore,
    risk_adjusted_score: riskAdjustedScore,
    etf_final_score: null,
    stock_final_score: computeStockFinalScore({
      technical_score: technicalScore,
      quality_score: input.stock_factors.quality,
      news_score: input.news_score,
      risk_adjusted_score: riskAdjustedScore,
      diversification_score: input.diversification_score,
      user_fit_score: input.user_fit_score,
    }),
  };
}
