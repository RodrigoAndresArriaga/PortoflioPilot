import { computeAssetScores } from "@/lib/engine/final-score";
import type { AssetScoreInput, AssetScoreResult } from "@/lib/engine/scores";
import { buildTechnicalInputsFromHistory } from "@/lib/market-data/build-technical-inputs";
import type { PriceBar } from "@/lib/market-data/types";
import type { AssetType } from "@/types/database";

const NEUTRAL_FACTOR = 50;

type BuildAssetScoreArgs = {
  symbol: string;
  assetType: AssetType;
  bars: PriceBar[];
  benchmarkBars?: PriceBar[];
  diversificationScore?: number;
  userFitScore?: number;
  newsScore?: number;
  broadEtfPriority?: boolean;
};

// build AssetScoreInput from live price history
export function buildAssetScoreInput(args: BuildAssetScoreArgs): AssetScoreInput {
  const technical = buildTechnicalInputsFromHistory(
    args.bars,
    args.benchmarkBars,
  );
  const assetKind =
    args.assetType === "etf" ? "etf" : ("stock" as const);

  return {
    symbol: args.symbol,
    asset_kind: assetKind,
    momentum: technical.momentum,
    trend: technical.trend,
    volatility: technical.volatility,
    diversification_score: args.diversificationScore ?? NEUTRAL_FACTOR,
    user_fit_score: args.userFitScore ?? NEUTRAL_FACTOR,
    news_score: args.newsScore,
    broad_etf_priority: args.broadEtfPriority,
    stock_factors:
      assetKind === "stock"
        ? {
            quality: NEUTRAL_FACTOR,
            value: NEUTRAL_FACTOR,
            growth: NEUTRAL_FACTOR,
          }
        : undefined,
  };
}

export function buildAssetScoresFromHistory(
  args: BuildAssetScoreArgs,
): AssetScoreResult {
  return computeAssetScores(buildAssetScoreInput(args));
}
