import { roundMoney } from "@/lib/engine/math";
import { normalizePlanSymbol } from "@/lib/monthly-plan/format";

export const SCORE_MIN = 0;
export const SCORE_MAX = 100;
export const DEFAULT_NEUTRAL_NEWS_SCORE = 50;
export const BROAD_ETF_FINAL_SCORE_BOOST = 5;

export const BROAD_ETF_SYMBOLS = new Set([
  "BND",
  "IVV",
  "SCHD",
  "SPY",
  "VOO",
  "VTI",
  "VXUS",
]);

export type MomentumInputs = {
  return_12m: number;
  return_6m: number;
  return_3m: number;
  price_above_200dma: number;
};

export type TrendInputs = {
  price_above_200dma: number;
  price_above_50dma: number;
  ma50_above_200dma: number;
};

export type VolatilityInputs = {
  volatility_90d: number;
  max_drawdown_1y: number;
  beta: number;
  downside_volatility: number;
};

export type StockFactorInputs = {
  quality: number;
  value: number;
  growth: number;
};

export type AssetScoreInput = {
  symbol: string;
  asset_kind: "etf" | "stock";
  target_allocation_gap_score: number;
  momentum: MomentumInputs;
  trend: TrendInputs;
  volatility: VolatilityInputs;
  stock_factors?: StockFactorInputs;
  news_score?: number;
};

export type AssetScoreResult = {
  symbol: string;
  asset_kind: "etf" | "stock";
  momentum_score: number;
  trend_score: number;
  volatility_risk_score: number;
  etf_final_score: number | null;
  stock_final_score: number | null;
};

// clamp score to 0-100
export function clampScore(value: number): number {
  return roundMoney(Math.min(SCORE_MAX, Math.max(SCORE_MIN, value)), 2);
}

export function isBroadEtfSymbol(symbol: string): boolean {
  return BROAD_ETF_SYMBOLS.has(normalizePlanSymbol(symbol));
}

// invert risk for final-score weighting
export function volatilitySafetyScore(volatilityRiskScore: number): number {
  return clampScore(SCORE_MAX - clampScore(volatilityRiskScore));
}
