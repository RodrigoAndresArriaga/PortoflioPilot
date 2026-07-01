import { computeAssetScores } from "@/lib/engine/final-score";
import type { AssetScoreInput, AssetScoreResult } from "@/lib/engine/scores";
import { buildTechnicalInputsFromHistory } from "@/lib/market-data/build-technical-inputs";
import type { PriceBar } from "@/lib/market-data/types";
import type { AssetType } from "@/types/database";

const NEUTRAL_FACTOR = 50;

export function allocationGapToScore(allocationGap: number): number {
  if (allocationGap <= 0) {
    return 40;
  }
  if (allocationGap >= 5000) {
    return 100;
  }
  return Math.round(40 + (allocationGap / 5000) * 60);
}

type BuildAssetScoreArgs = {
  symbol: string;
  assetType: AssetType;
  bars: PriceBar[];
  benchmarkBars?: PriceBar[];
  targetAllocationGapScore?: number;
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
    target_allocation_gap_score:
      args.targetAllocationGapScore ?? NEUTRAL_FACTOR,
    momentum: technical.momentum,
    trend: technical.trend,
    volatility: technical.volatility,
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
