import { roundMoney } from "@/lib/engine/math";
import {
  applyBuyModifiers,
  type RecommendationEngineInput,
  computeRecommendations,
} from "@/lib/engine/recommendation-engine";
import type { RecommendationCandidate } from "@/lib/engine/types";
import { normalizePlanSymbol } from "@/lib/monthly-plan/format";

const CASH_SYMBOL = "CASH";
const MIN_BUY_AMOUNT = 1;

type AllocateInput = RecommendationEngineInput & {
  monthlyAmount: number;
};

function distributeProportional(
  eligible: RecommendationCandidate[],
  budget: number,
): Map<string, number> {
  const amounts = new Map<string, number>();
  if (budget <= 0 || eligible.length === 0) {
    return amounts;
  }

  const totalScore = eligible.reduce(
    (sum, candidate) => sum + candidate.recommendation_score,
    0,
  );

  if (totalScore <= 0) {
    const each = roundMoney(budget / eligible.length);
    for (const candidate of eligible) {
      amounts.set(candidate.symbol, each);
    }
    return amounts;
  }

  let allocated = 0;
  for (let index = 0; index < eligible.length; index += 1) {
    const candidate = eligible[index];
    const isLast = index === eligible.length - 1;
    const raw = isLast
      ? roundMoney(budget - allocated)
      : roundMoney(
          (budget * candidate.recommendation_score) / totalScore,
        );
    amounts.set(candidate.symbol, raw);
    allocated = roundMoney(allocated + raw);
  }

  return amounts;
}

function fixRoundingDrift(
  amounts: Map<string, number>,
  budget: number,
): Map<string, number> {
  const next = new Map(amounts);
  let total = roundMoney(
    Array.from(next.values()).reduce((sum, value) => sum + value, 0),
  );
  const drift = roundMoney(budget - total);

  if (drift === 0) {
    return next;
  }

  const topSymbol = Array.from(next.entries()).sort(
    (left, right) => right[1] - left[1],
  )[0]?.[0];

  if (topSymbol) {
    next.set(topSymbol, roundMoney((next.get(topSymbol) ?? 0) + drift));
  }

  return next;
}

// allocate monthly budget across ranked recommendations
export function allocateMonthlyBudget(
  input: AllocateInput,
): RecommendationCandidate[] {
  const ranked = computeRecommendations(input);
  const cashReserve = roundMoney(
    (input.monthlyAmount * input.profile.cash_reserve_percent) / 100,
  );
  const investableBudget = roundMoney(
    Math.max(0, input.monthlyAmount - cashReserve),
  );

  const eligible = ranked.filter((candidate) => !candidate.blocked);
  const topCandidates = eligible.slice(0, Math.min(5, eligible.length));

  const rawAmounts = distributeProportional(topCandidates, investableBudget);
  const adjustedAmounts = fixRoundingDrift(rawAmounts, investableBudget);

  const resultBySymbol = new Map<string, RecommendationCandidate>();

  for (const candidate of ranked) {
    const raw = adjustedAmounts.get(candidate.symbol) ?? 0;
    const modified = applyBuyModifiers(
      raw,
      candidate,
      input.newsSignals,
    );

    resultBySymbol.set(candidate.symbol, {
      ...candidate,
      recommended_amount: modified,
      reason:
        modified > 0
          ? candidate.reason
          : candidate.blocked
            ? candidate.reason
            : modified < raw
              ? `${candidate.reason} Buy reduced by risk/news modifiers.`
              : candidate.reason,
    });
  }

  let totalAllocated = roundMoney(
    Array.from(resultBySymbol.values()).reduce(
      (sum, candidate) => sum + candidate.recommended_amount,
      0,
    ),
  );

  const cashAmount = roundMoney(input.monthlyAmount - totalAllocated);
  const cashLine: RecommendationCandidate = {
    symbol: CASH_SYMBOL,
    asset_kind: "etf",
    recommendation_score: 0,
    technical_score: 0,
    news_modifier_score: 0,
    risk_score: 0,
    concentration_flag: false,
    manual_review_required: false,
    blocked: false,
    blocked_reason: null,
    decision_basis: "Remainder held as brokerage cash per cash reserve preference.",
    reason: "Hold as brokerage cash until next month or manual deployment.",
    recommended_amount: Math.max(0, cashAmount),
  };

  const output = Array.from(resultBySymbol.values());

  if (cashLine.recommended_amount >= MIN_BUY_AMOUNT) {
    output.push(cashLine);
  } else if (cashLine.recommended_amount > 0 && output.length > 0) {
    const top = output
      .filter((candidate) => candidate.symbol !== CASH_SYMBOL)
      .sort(
        (left, right) =>
          right.recommended_amount - left.recommended_amount,
      )[0];
    if (top) {
      const idx = output.findIndex((c) => c.symbol === top.symbol);
      output[idx] = {
        ...top,
        recommended_amount: roundMoney(
          top.recommended_amount + cashLine.recommended_amount,
        ),
      };
    }
  }

  for (const candidate of output) {
    if (
      candidate.symbol !== CASH_SYMBOL &&
      candidate.recommended_amount > 0 &&
      candidate.recommended_amount < MIN_BUY_AMOUNT
    ) {
      const idx = output.findIndex((c) => c.symbol === candidate.symbol);
      output[idx] = { ...candidate, recommended_amount: 0 };
    }
  }

  totalAllocated = roundMoney(
    output.reduce((sum, candidate) => sum + candidate.recommended_amount, 0),
  );
  const remainder = roundMoney(input.monthlyAmount - totalAllocated);

  if (remainder > 0) {
    const existingCash = output.find((c) => c.symbol === CASH_SYMBOL);
    if (existingCash) {
      const idx = output.findIndex((c) => c.symbol === CASH_SYMBOL);
      output[idx] = {
        ...existingCash,
        recommended_amount: roundMoney(
          existingCash.recommended_amount + remainder,
        ),
      };
    } else {
      output.push({
        ...cashLine,
        recommended_amount: remainder,
      });
    }
  }

  return output.sort(
    (left, right) =>
      right.recommended_amount - left.recommended_amount ||
      normalizePlanSymbol(left.symbol).localeCompare(
        normalizePlanSymbol(right.symbol),
      ),
  );
}
