import { clampScore, isBroadEtfSymbol } from "@/lib/engine/scores";
import { computeDiversificationScore } from "@/lib/engine/diversification-score";
import { roundMoney } from "@/lib/engine/math";
import { computeUserFitScore } from "@/lib/engine/user-fit-score";
import type { AssetScoreResult } from "@/lib/engine/scores";
import { normalizePlanSymbol } from "@/lib/monthly-plan/format";
import type { Holding, InitialRecommendationItem, Profile, WatchlistItem } from "@/types/database";

const CASH_SYMBOL = "CASH";
const MIN_BUY_AMOUNT = 1;
const NEUTRAL = 50;

export type InitialInvestmentCandidate = {
  symbol: string;
  asset_name: string | null;
  asset_type: string;
  suggested_role: string | null;
  final_score: number;
  final_amount: number;
  risk_badge: "low" | "medium" | "high";
  manual_review_required: boolean;
  reason: string;
  technical_score: number;
  news_modifier_score: number;
  risk_score: number;
  decision_basis: string;
};

export type InitialInvestmentInput = {
  profile: Profile;
  watchlist: WatchlistItem[];
  items: InitialRecommendationItem[];
  technicalScores: AssetScoreResult[];
  holdings: Holding[];
  initialInvestmentAmount: number;
  overallRiskLevel?: string | null;
};

function normalizeAssetKind(assetType: string): "etf" | "stock" {
  const lower = assetType.toLowerCase();
  if (lower === "etf") {
    return "etf";
  }
  return "stock";
}

function getTechnicalScore(
  symbol: string,
  technicalScores: AssetScoreResult[],
): number {
  const normalized = normalizePlanSymbol(symbol);
  const match = technicalScores.find(
    (score) => normalizePlanSymbol(score.symbol) === normalized,
  );
  if (!match) {
    return NEUTRAL;
  }
  return match.technical_score;
}

function getRiskAdjustedScore(
  symbol: string,
  technicalScores: AssetScoreResult[],
): number {
  const normalized = normalizePlanSymbol(symbol);
  const match = technicalScores.find(
    (score) => normalizePlanSymbol(score.symbol) === normalized,
  );
  if (!match) {
    return NEUTRAL;
  }
  return match.risk_adjusted_score;
}

function effectiveNewsScore(item: InitialRecommendationItem): number {
  const newsScore = item.news_score ?? NEUTRAL;
  const confidence = item.news_confidence ?? 0;
  if (confidence < 60) {
    return NEUTRAL + (newsScore - NEUTRAL) * 0.5;
  }
  return newsScore;
}

function computeEtfInitialScore(
  item: InitialRecommendationItem,
  profile: Profile,
  holdings: Holding[],
  technicalScores: AssetScoreResult[],
): number {
  const assetKind = "etf";
  const userFit = computeUserFitScore({
    risk_profile: profile.risk_profile,
    time_horizon: profile.time_horizon,
    broad_etf_priority: profile.broad_etf_priority,
    symbol: item.symbol,
    assetKind,
  });
  const technical = getTechnicalScore(item.symbol, technicalScores);
  const riskAdjusted = getRiskAdjustedScore(item.symbol, technicalScores);
  const news = effectiveNewsScore(item);
  const diversification = computeDiversificationScore(
    item.symbol,
    assetKind,
    holdings,
  );

  let score =
    0.3 * userFit +
    0.25 * technical +
    0.2 * riskAdjusted +
    0.15 * news +
    0.1 * diversification;

  if (
    item.suggested_role === "core" &&
    isBroadEtfSymbol(item.symbol)
  ) {
    score += 5;
  }

  return clampScore(score);
}

function computeStockInitialScore(
  item: InitialRecommendationItem,
  profile: Profile,
  holdings: Holding[],
  technicalScores: AssetScoreResult[],
): number {
  const assetKind = "stock";
  const fundamental = item.fundamental_score ?? NEUTRAL;
  const technical = getTechnicalScore(item.symbol, technicalScores);
  const riskAdjusted = getRiskAdjustedScore(item.symbol, technicalScores);
  const news = effectiveNewsScore(item);
  const userFit = computeUserFitScore({
    risk_profile: profile.risk_profile,
    time_horizon: profile.time_horizon,
    broad_etf_priority: profile.broad_etf_priority,
    symbol: item.symbol,
    assetKind,
  });
  const diversification = computeDiversificationScore(
    item.symbol,
    assetKind,
    holdings,
  );

  return clampScore(
    0.25 * fundamental +
      0.2 * technical +
      0.2 * riskAdjusted +
      0.15 * news +
      0.1 * userFit +
      0.1 * diversification,
  );
}

function riskBadgeFromItem(item: InitialRecommendationItem): "low" | "medium" | "high" {
  const risk = item.risk_score ?? NEUTRAL;
  if (risk >= 65) {
    return "high";
  }
  if (risk >= 40) {
    return "medium";
  }
  return "low";
}

function isEligible(item: InitialRecommendationItem): boolean {
  if (item.suggested_role === "avoid") {
    return false;
  }
  if (item.ai_bias === "avoid") {
    return false;
  }
  if (item.recommendation_direction === "avoid") {
    return false;
  }
  return true;
}

function roleWeight(item: InitialRecommendationItem, assetKind: "etf" | "stock"): number {
  if (item.suggested_role === "core" && assetKind === "etf") {
    return 1.4;
  }
  if (item.suggested_role === "growth" || item.suggested_role === "satellite") {
    return 0.85;
  }
  if (item.suggested_role === "cash_reserve") {
    return 0.2;
  }
  if (item.suggested_role === "manual_review") {
    return 0.5;
  }
  return 1;
}

// generate initial manual investment recommendations from research items
export function computeInitialInvestmentRecommendations(
  input: InitialInvestmentInput,
): InitialInvestmentCandidate[] {
  const {
    profile,
    items,
    technicalScores,
    holdings,
    initialInvestmentAmount,
    overallRiskLevel,
  } = input;

  let cashReservePercent = profile.cash_reserve_percent;
  if (overallRiskLevel === "high") {
    cashReservePercent = Math.min(50, cashReservePercent + 5);
  }

  const cashReserve = roundMoney(
    initialInvestmentAmount * (cashReservePercent / 100),
  );
  const investableBudget = roundMoney(
    Math.max(0, initialInvestmentAmount - cashReserve),
  );

  const scored = items
    .filter(isEligible)
    .map((item) => {
      const assetKind = normalizeAssetKind(item.asset_type);
      const finalScore =
        assetKind === "etf"
          ? computeEtfInitialScore(item, profile, holdings, technicalScores)
          : computeStockInitialScore(item, profile, holdings, technicalScores);

      return {
        item,
        assetKind,
        finalScore,
        weightedScore: finalScore * roleWeight(item, assetKind),
      };
    })
    .sort((left, right) => {
      if (right.weightedScore !== left.weightedScore) {
        return right.weightedScore - left.weightedScore;
      }
      return left.item.symbol.localeCompare(right.item.symbol);
    });

  const topCandidates = scored.slice(0, 8);
  const totalWeighted = topCandidates.reduce(
    (sum, entry) => sum + entry.weightedScore,
    0,
  );

  const stockCap = roundMoney(
    initialInvestmentAmount * (profile.max_individual_stock_percent / 100),
  );

  const amounts = new Map<string, number>();

  for (const entry of topCandidates) {
    const { item, assetKind, weightedScore } = entry;
    let amount =
      totalWeighted > 0
        ? roundMoney((investableBudget * weightedScore) / totalWeighted)
        : roundMoney(investableBudget / Math.max(topCandidates.length, 1));

    if (item.ai_bias === "avoid") {
      amount = 0;
    } else if (item.ai_bias === "watch") {
      amount = roundMoney(amount * 0.5);
    }

    if (assetKind === "stock") {
      if (item.valuation_risk === "high") {
        amount = roundMoney(amount * 0.7);
      }
      amount = Math.min(amount, stockCap);
    }

    if (amount > 0 && amount < MIN_BUY_AMOUNT) {
      amount = 0;
    }

    amounts.set(item.symbol, amount);
  }

  for (const entry of topCandidates) {
    if (entry.assetKind !== "stock") {
      continue;
    }
    const current = amounts.get(entry.item.symbol) ?? 0;
    if (current > stockCap) {
      amounts.set(entry.item.symbol, stockCap);
    }
    if (current > investableBudget * 0.5) {
      amounts.set(entry.item.symbol, roundMoney(investableBudget * 0.5));
    }
  }

  const adjustedAmounts = new Map(amounts);
  const allocatedTotal = roundMoney(
    Array.from(adjustedAmounts.values()).reduce((sum, value) => sum + value, 0),
  );
  const leftoverBudget = roundMoney(Math.max(0, investableBudget - allocatedTotal));

  const results: InitialInvestmentCandidate[] = topCandidates.map((entry) => {
    const { item, finalScore } = entry;
    const amount = adjustedAmounts.get(item.symbol) ?? 0;
    const manualReviewRequired =
      item.suggested_role === "manual_review" ||
      item.ai_bias === "watch" ||
      item.ai_bias === "avoid";

    return {
      symbol: normalizePlanSymbol(item.symbol),
      asset_name: item.asset_name,
      asset_type: item.asset_type,
      suggested_role: item.suggested_role,
      final_score: finalScore,
      final_amount: amount,
      risk_badge: riskBadgeFromItem(item),
      manual_review_required: manualReviewRequired,
      reason:
        item.one_sentence_reason ??
        "Initial manual investment recommendation based on research and engine scoring.",
      technical_score: getTechnicalScore(item.symbol, technicalScores),
      news_modifier_score: effectiveNewsScore(item),
      risk_score: item.risk_score ?? getRiskAdjustedScore(item.symbol, technicalScores),
      decision_basis: "initial_investment_engine",
    };
  });

  if (cashReserve > 0 || leftoverBudget > 0) {
    results.push({
      symbol: CASH_SYMBOL,
      asset_name: "Cash reserve",
      asset_type: "cash",
      suggested_role: "cash_reserve",
      final_score: NEUTRAL,
      final_amount: roundMoney(cashReserve + leftoverBudget),
      risk_badge: "low",
      manual_review_required: false,
      reason: "Small cash buffer for flexibility before your next monthly contribution.",
      technical_score: NEUTRAL,
      news_modifier_score: NEUTRAL,
      risk_score: NEUTRAL,
      decision_basis: "initial_investment_engine",
    });
  }

  for (const item of items.filter((entry) => !isEligible(entry))) {
    results.push({
      symbol: normalizePlanSymbol(item.symbol),
      asset_name: item.asset_name,
      asset_type: item.asset_type,
      suggested_role: item.suggested_role,
      final_score: 0,
      final_amount: 0,
      risk_badge: riskBadgeFromItem(item),
      manual_review_required: true,
      reason:
        item.one_sentence_reason ??
        "Marked for manual review — not included in initial allocation.",
      technical_score: getTechnicalScore(item.symbol, technicalScores),
      news_modifier_score: effectiveNewsScore(item),
      risk_score: item.risk_score ?? NEUTRAL,
      decision_basis: "initial_investment_engine",
    });
  }

  return results.sort((left, right) => right.final_amount - left.final_amount);
}

export function resolveInitialInvestmentAmount(profile: Profile): number {
  if (
    profile.initial_investment_amount !== null &&
    profile.initial_investment_amount > 0
  ) {
    return profile.initial_investment_amount;
  }
  return profile.monthly_investment_amount;
}
