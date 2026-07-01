import { roundMoney } from "@/lib/engine/math";
import { isBroadEtfSymbol } from "@/lib/engine/scores";
import type { AllocationAssetResult } from "@/lib/engine/types";
import { normalizePlanSymbol } from "@/lib/monthly-plan/format";

export type NewsModifierBias = "add" | "hold" | "watch" | "reduce" | "avoid";

export type NewsModifierSignal = {
  symbol: string;
  asset_type?: "etf" | "stock";
  ai_bias?: NewsModifierBias | null;
  news_confidence?: number | null;
  impact_horizon?: "short_term" | "medium_term" | "long_term" | null;
  suggested_frontend_status?:
    | "normal"
    | "watch"
    | "reduce_new_buys"
    | "manual_review"
    | null;
};

export type TechnicalAgreementScores = {
  momentum_score: number;
  trend_score: number;
  volatility_risk_score: number;
};

export type NewsModifierResult = {
  symbol: string;
  applied: boolean;
  effective_bias: NewsModifierBias;
  blocked_amount: number;
  manual_review_required: boolean;
  reason: string;
};

const BIAS_STRICTNESS: Record<NewsModifierBias, number> = {
  avoid: 5,
  reduce: 4,
  watch: 3,
  hold: 2,
  add: 1,
};

const CONFIDENCE_THRESHOLD = 60;
const TECHNICAL_AGREEMENT_MIN = 50;

// map weekly status to ai_bias when ai_bias is absent
export function resolveEffectiveBias(signal: NewsModifierSignal): NewsModifierBias {
  if (signal.ai_bias) {
    return signal.ai_bias;
  }

  switch (signal.suggested_frontend_status) {
    case "watch":
      return "watch";
    case "reduce_new_buys":
      return "reduce";
    case "manual_review":
      return "avoid";
    case "normal":
    default:
      return "hold";
  }
}

// skip modifier for low confidence or broad ETF short-term noise
export function shouldIgnoreNewsModifier(signal: NewsModifierSignal): boolean {
  if (
    signal.news_confidence != null &&
    signal.news_confidence < CONFIDENCE_THRESHOLD
  ) {
    return true;
  }

  const symbol = normalizePlanSymbol(signal.symbol);
  if (
    isBroadEtfSymbol(symbol) &&
    signal.impact_horizon === "short_term"
  ) {
    return true;
  }

  return false;
}

// technical/risk agreement gate for add bias
export function technicalScoresAgree(
  scores?: TechnicalAgreementScores,
): boolean {
  if (!scores) {
    return false;
  }

  return (
    scores.momentum_score >= TECHNICAL_AGREEMENT_MIN &&
    scores.trend_score >= TECHNICAL_AGREEMENT_MIN &&
    scores.volatility_risk_score <= TECHNICAL_AGREEMENT_MIN
  );
}

// apply bias multiplier to a buy amount
export function computeModifiedBuy(
  originalBuy: number,
  bias: NewsModifierBias,
): number {
  if (bias === "watch") {
    return roundMoney(originalBuy * 0.5);
  }
  if (bias === "reduce" || bias === "avoid") {
    return 0;
  }
  return originalBuy;
}

function appendNewsReason(
  baseReason: string,
  bias: NewsModifierBias,
  confidence: number | null | undefined,
  applied: boolean,
): string {
  if (!applied || bias === "hold" || bias === "add") {
    return baseReason;
  }

  const confidenceLabel =
    confidence != null ? ` (confidence ${confidence})` : "";
  const suffixByBias: Record<NewsModifierBias, string> = {
    hold: "",
    add: "",
    watch: `News modifier: watch${confidenceLabel} — buy reduced 50%.`,
    reduce: `News modifier: reduce${confidenceLabel} — no new buy this month.`,
    avoid: `News modifier: avoid${confidenceLabel} — no new buy; manual review required.`,
  };

  const suffix = suffixByBias[bias];
  if (!suffix) {
    return baseReason;
  }

  return baseReason ? `${baseReason}. ${suffix}` : suffix;
}

// pick strictest bias when multiple reports affect one symbol
export function mergeNewsSignalsBySymbol(
  signals: NewsModifierSignal[],
): Map<string, NewsModifierSignal> {
  const merged = new Map<string, NewsModifierSignal>();

  for (const signal of signals) {
    const symbol = normalizePlanSymbol(signal.symbol);
    const existing = merged.get(symbol);
    if (!existing) {
      merged.set(symbol, { ...signal, symbol });
      continue;
    }

    const existingBias = resolveEffectiveBias(existing);
    const nextBias = resolveEffectiveBias(signal);
    if (BIAS_STRICTNESS[nextBias] >= BIAS_STRICTNESS[existingBias]) {
      merged.set(symbol, { ...signal, symbol });
    }
  }

  return merged;
}

// apply news modifiers to allocation results (new buys only)
export function applyNewsModifiers(
  results: AllocationAssetResult[],
  signals: NewsModifierSignal[],
  technicalBySymbol?: Map<string, TechnicalAgreementScores>,
): { results: AllocationAssetResult[]; modifiers: NewsModifierResult[] } {
  const signalBySymbol = mergeNewsSignalsBySymbol(signals);
  const modifiers: NewsModifierResult[] = [];

  const nextResults = results.map((result) => {
    const symbol = normalizePlanSymbol(result.symbol);
    const signal = signalBySymbol.get(symbol);
    const originalBuy = result.recommended_buy;

    if (!signal || originalBuy <= 0) {
      if (signal) {
        modifiers.push({
          symbol,
          applied: false,
          effective_bias: resolveEffectiveBias(signal),
          blocked_amount: 0,
          manual_review_required: false,
          reason: result.reason,
        });
      }
      return { ...result };
    }

    let effectiveBias = resolveEffectiveBias(signal);

    if (effectiveBias === "add" && !technicalScoresAgree(technicalBySymbol?.get(symbol))) {
      effectiveBias = "hold";
    }

    const ignored = shouldIgnoreNewsModifier(signal);
    const applied =
      !ignored && effectiveBias !== "hold" && effectiveBias !== "add";

    const modifiedBuy = applied
      ? computeModifiedBuy(originalBuy, effectiveBias)
      : originalBuy;
    const blockedAmount = roundMoney(originalBuy - modifiedBuy);
    const manualReviewRequired = applied && effectiveBias === "avoid";

    const reason = appendNewsReason(
      result.reason,
      effectiveBias,
      signal.news_confidence,
      applied,
    );

    modifiers.push({
      symbol,
      applied,
      effective_bias: effectiveBias,
      blocked_amount: blockedAmount,
      manual_review_required: manualReviewRequired,
      reason,
    });

    return {
      ...result,
      recommended_buy: modifiedBuy,
      reason,
    };
  });

  return { results: nextResults, modifiers };
}
