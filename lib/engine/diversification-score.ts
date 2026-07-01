import { clampScore, isBroadEtfSymbol } from "@/lib/engine/scores";
import { buildPortfolioWeights } from "@/lib/engine/portfolio-weights";
import { normalizePlanSymbol } from "@/lib/monthly-plan/format";
import type { AssetType } from "@/types/database";

const NEUTRAL = 50;

type DiversificationHolding = {
  symbol: string;
  asset_type: AssetType;
  current_value: number;
};

// score how much a candidate improves portfolio diversification
export function computeDiversificationScore(
  symbol: string,
  assetKind: "etf" | "stock",
  holdings: DiversificationHolding[],
): number {
  const normalized = normalizePlanSymbol(symbol);
  const totalValue = holdings.reduce(
    (sum, holding) => sum + holding.current_value,
    0,
  );

  if (totalValue <= 0) {
    if (assetKind === "etf" && isBroadEtfSymbol(normalized)) {
      return 75;
    }
    return NEUTRAL;
  }

  const weights = buildPortfolioWeights(holdings);
  const existing = weights.find((entry) => entry.symbol === normalized);
  const currentWeight = existing?.weightPercent ?? 0;

  if (assetKind === "etf" && isBroadEtfSymbol(normalized)) {
    if (currentWeight < 10) {
      return 80;
    }
    if (currentWeight < 25) {
      return 65;
    }
    return 45;
  }

  if (assetKind === "stock") {
    if (currentWeight === 0) {
      return 60;
    }
    if (currentWeight < 5) {
      return 55;
    }
    if (currentWeight > 15) {
      return 30;
    }
    return 45;
  }

  if (currentWeight === 0) {
    return 58;
  }

  return NEUTRAL;
}
