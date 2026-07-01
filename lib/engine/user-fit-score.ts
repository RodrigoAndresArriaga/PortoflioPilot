import { clampScore, isBroadEtfSymbol } from "@/lib/engine/scores";
import { normalizePlanSymbol } from "@/lib/monthly-plan/format";

type UserFitInput = {
  risk_profile: string;
  time_horizon: string;
  broad_etf_priority: boolean;
  symbol: string;
  assetKind: "etf" | "stock";
};

const RISK_ETF_BIAS: Record<string, number> = {
  conservative: 85,
  balanced: 75,
  growth: 65,
  aggressive_growth: 55,
};

const RISK_STOCK_BIAS: Record<string, number> = {
  conservative: 35,
  balanced: 50,
  growth: 65,
  aggressive_growth: 80,
};

const HORIZON_BONUS: Record<string, number> = {
  "1_3_years": -5,
  "3_5_years": 0,
  "5_10_years": 5,
  "10_plus_years": 10,
};

// map profile and strategy prefs to asset fit score
export function computeUserFitScore(input: UserFitInput): number {
  const normalized = normalizePlanSymbol(input.symbol);
  const riskBase =
    input.assetKind === "etf"
      ? (RISK_ETF_BIAS[input.risk_profile] ?? 65)
      : (RISK_STOCK_BIAS[input.risk_profile] ?? 55);

  const horizonBonus = HORIZON_BONUS[input.time_horizon] ?? 0;
  let score = riskBase + horizonBonus;

  if (
    input.broad_etf_priority &&
    input.assetKind === "etf" &&
    isBroadEtfSymbol(normalized)
  ) {
    score += 10;
  }

  if (
    input.risk_profile === "conservative" &&
    input.assetKind === "stock" &&
    !isBroadEtfSymbol(normalized)
  ) {
    score -= 10;
  }

  return clampScore(score);
}
