import { computeDiversificationScore } from "@/lib/engine/diversification-score";
import { computeAssetScores } from "@/lib/engine/final-score";
import { roundMoney } from "@/lib/engine/math";
import {
  computeModifiedBuy,
  mergeNewsSignalsBySymbol,
  resolveEffectiveBias,
  shouldIgnoreNewsModifier,
  type NewsModifierSignal,
} from "@/lib/engine/news-modifier";
import { buildPortfolioWeights } from "@/lib/engine/portfolio-weights";
import {
  DEFAULT_NEUTRAL_NEWS_SCORE,
  clampScore,
} from "@/lib/engine/scores";
import type { RecommendationCandidate } from "@/lib/engine/types";
import { computeUserFitScore } from "@/lib/engine/user-fit-score";
import { buildAssetScoreInput } from "@/lib/market-data/build-asset-scores";
import { normalizePlanSymbol } from "@/lib/monthly-plan/format";
import type { AssetScoreResult } from "@/lib/engine/scores";
import type { PriceBar } from "@/lib/market-data/types";
import type { AssetType, Holding, Profile, WatchlistItem } from "@/types/database";

const NEUTRAL = 50;

export type RecommendationEngineInput = {
  profile: Profile;
  holdings: Holding[];
  watchlist: WatchlistItem[];
  newsSignals: NewsModifierSignal[];
  technicalScores: AssetScoreResult[];
  priceBarsBySymbol?: Map<string, PriceBar[]>;
  benchmarkBars?: PriceBar[];
};

type CandidateMeta = {
  symbol: string;
  asset_kind: "etf" | "stock";
  asset_type: AssetType;
};

function resolveAssetKind(
  assetType: AssetType | null | undefined,
): "etf" | "stock" {
  return assetType === "stock" ? "stock" : "etf";
}

// build deduped candidate list from holdings and watchlist
export function buildCandidateUniverse(
  holdings: Holding[],
  watchlist: WatchlistItem[],
): CandidateMeta[] {
  const bySymbol = new Map<string, CandidateMeta>();

  for (const holding of holdings) {
    if (holding.asset_type === "cash") {
      continue;
    }
    const symbol = normalizePlanSymbol(holding.symbol);
    bySymbol.set(symbol, {
      symbol,
      asset_kind: resolveAssetKind(holding.asset_type),
      asset_type: holding.asset_type,
    });
  }

  for (const item of watchlist) {
    if (!item.enabled) {
      continue;
    }
    const symbol = normalizePlanSymbol(item.symbol);
    if (bySymbol.has(symbol)) {
      continue;
    }
    bySymbol.set(symbol, {
      symbol,
      asset_kind: resolveAssetKind(item.asset_type),
      asset_type: item.asset_type ?? "etf",
    });
  }

  return Array.from(bySymbol.values());
}

function newsScoreFromBias(bias: ReturnType<typeof resolveEffectiveBias>): number {
  switch (bias) {
    case "add":
      return 75;
    case "hold":
      return NEUTRAL;
    case "watch":
      return 40;
    case "reduce":
      return 25;
    case "avoid":
      return 10;
    default:
      return NEUTRAL;
  }
}

function isConcentrationBlocked(
  symbol: string,
  assetKind: "etf" | "stock",
  holdings: Holding[],
  maxStockPercent: number,
): boolean {
  if (assetKind !== "stock") {
    return false;
  }

  const weights = buildPortfolioWeights(
    holdings.map((holding) => ({
      symbol: holding.symbol,
      asset_type: holding.asset_type,
      current_value: holding.current_value,
    })),
  );

  const entry = weights.find(
    (weight) => weight.symbol === normalizePlanSymbol(symbol),
  );

  return (entry?.weightPercent ?? 0) >= maxStockPercent;
}

function buildDecisionBasis(
  score: AssetScoreResult,
  recommendationScore: number,
  newsBias: ReturnType<typeof resolveEffectiveBias> | null,
): string {
  const finalScore =
    score.asset_kind === "etf"
      ? score.etf_final_score
      : score.stock_final_score;

  const parts = [
    `Recommendation score ${recommendationScore.toFixed(1)}`,
    `technical ${score.technical_score.toFixed(1)}`,
    `risk-adjusted ${score.risk_adjusted_score.toFixed(1)}`,
  ];

  if (finalScore != null) {
    parts.push(`composite ${finalScore.toFixed(1)}`);
  }

  if (newsBias && newsBias !== "hold") {
    parts.push(`news bias ${newsBias}`);
  }

  return parts.join("; ");
}

// score and rank eligible assets for monthly buys
export function computeRecommendations(
  input: RecommendationEngineInput,
): RecommendationCandidate[] {
  const candidates = buildCandidateUniverse(input.holdings, input.watchlist);
  const scoreBySymbol = new Map(
    input.technicalScores.map((score) => [
      normalizePlanSymbol(score.symbol),
      score,
    ]),
  );
  const newsBySymbol = mergeNewsSignalsBySymbol(input.newsSignals);
  const holdingInputs = input.holdings.map((holding) => ({
    symbol: holding.symbol,
    asset_type: holding.asset_type,
    current_value: holding.current_value,
  }));

  const results: RecommendationCandidate[] = [];

  for (const candidate of candidates) {
    const symbol = candidate.symbol;
    let scoreResult = scoreBySymbol.get(symbol);

    if (!scoreResult && input.priceBarsBySymbol?.has(symbol)) {
      const bars = input.priceBarsBySymbol.get(symbol)!;
      const diversificationScore = computeDiversificationScore(
        symbol,
        candidate.asset_kind,
        holdingInputs,
      );
      const userFitScore = computeUserFitScore({
        risk_profile: input.profile.risk_profile,
        time_horizon: input.profile.time_horizon,
        broad_etf_priority: input.profile.broad_etf_priority,
        symbol,
        assetKind: candidate.asset_kind,
      });

      const scoreInput = buildAssetScoreInput({
        symbol,
        assetType: candidate.asset_type === "stock" ? "stock" : "etf",
        bars,
        benchmarkBars: input.benchmarkBars,
        diversificationScore,
        userFitScore,
        broadEtfPriority: input.profile.broad_etf_priority,
      });

      scoreResult = computeAssetScores(scoreInput);
    }

    const technicalScore = scoreResult?.technical_score ?? NEUTRAL;
    const riskScore = scoreResult?.risk_adjusted_score ?? NEUTRAL;
    const recommendationScore =
      scoreResult?.asset_kind === "etf"
        ? (scoreResult.etf_final_score ?? NEUTRAL)
        : (scoreResult?.stock_final_score ?? NEUTRAL);

    const newsSignal = newsBySymbol.get(symbol);
    const newsBias = newsSignal ? resolveEffectiveBias(newsSignal) : null;
    const newsModifierScore = newsSignal
      ? newsScoreFromBias(newsBias!)
      : DEFAULT_NEUTRAL_NEWS_SCORE;

    const concentrationFlag = isConcentrationBlocked(
      symbol,
      candidate.asset_kind,
      input.holdings,
      input.profile.max_individual_stock_percent,
    );

    let blocked = false;
    let blockedReason: string | null = null;
    let manualReviewRequired = false;

    if (concentrationFlag) {
      blocked = true;
      blockedReason = `Single-stock concentration at or above ${input.profile.max_individual_stock_percent}% blocks additional buys.`;
    }

    if (newsSignal && !shouldIgnoreNewsModifier(newsSignal)) {
      if (newsBias === "avoid") {
        blocked = true;
        manualReviewRequired = true;
        blockedReason =
          blockedReason ??
          "News modifier: avoid — no new buy; manual review required.";
      }
      if (
        newsSignal.suggested_frontend_status === "manual_review" &&
        newsBias !== "avoid"
      ) {
        manualReviewRequired = true;
        blocked = true;
        blockedReason =
          blockedReason ?? "Manual review required before new buys.";
      }
    }

    const decisionBasis = scoreResult
      ? buildDecisionBasis(scoreResult, recommendationScore, newsBias)
      : `Recommendation score ${recommendationScore.toFixed(1)} (limited market data)`;

    let reason = `Ranked by recommendation engine (score ${recommendationScore.toFixed(1)}).`;

    if (blocked && blockedReason) {
      reason = blockedReason;
    } else if (newsBias === "watch") {
      reason = `${reason} News watch — buy may be reduced.`;
    } else if (newsBias === "reduce") {
      reason = `${reason} News reduce — buy may be reduced.`;
    }

    results.push({
      symbol,
      asset_kind: candidate.asset_kind,
      recommendation_score: roundMoney(recommendationScore, 2),
      technical_score: roundMoney(technicalScore, 2),
      news_modifier_score: roundMoney(newsModifierScore, 2),
      risk_score: roundMoney(riskScore, 2),
      concentration_flag: concentrationFlag,
      manual_review_required: manualReviewRequired,
      blocked,
      blocked_reason: blockedReason,
      decision_basis: decisionBasis,
      reason,
      recommended_amount: 0,
    });
  }

  results.sort(
    (left, right) =>
      right.recommendation_score - left.recommendation_score ||
      left.symbol.localeCompare(right.symbol),
  );

  return results;
}

// apply news and volatility reductions to a raw buy amount
export function applyBuyModifiers(
  amount: number,
  candidate: RecommendationCandidate,
  newsSignals: NewsModifierSignal[],
): number {
  if (amount <= 0 || candidate.blocked) {
    return 0;
  }

  const newsBySymbol = mergeNewsSignalsBySymbol(newsSignals);
  const signal = newsBySymbol.get(normalizePlanSymbol(candidate.symbol));

  let modified = amount;

  if (signal && !shouldIgnoreNewsModifier(signal)) {
    const bias = resolveEffectiveBias(signal);
    modified = computeModifiedBuy(modified, bias);
  }

  if (candidate.risk_score < 25) {
    modified = roundMoney(modified * 0.5);
  }

  return modified;
}
