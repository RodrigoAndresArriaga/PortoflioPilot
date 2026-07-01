import { applyDriftToResult, assignPriorities } from "@/lib/engine/drift";
import { maxZero, roundMoney, sumValues } from "@/lib/engine/math";
import {
  applyNewsModifiers,
  type NewsModifierResult,
  type NewsModifierSignal,
  type TechnicalAgreementScores,
} from "@/lib/engine/news-modifier";
import {
  applyRemainderSweep,
  normalizeBuysToMonthlyBudget,
  type RemainderSweepContext,
} from "@/lib/engine/sweep-remainder";
import type {
  AllocationAssetResult,
  AllocationEngineInput,
  AllocationEngineOutput,
  EngineHolding,
} from "@/lib/engine/types";
import {
  buildValueMap,
  buildWeightMap,
  computeCurrentWeight,
  mergeSymbols,
} from "@/lib/engine/weights";

// sort prioritize assets first, then by buy amount
function sortResults(results: AllocationAssetResult[]): AllocationAssetResult[] {
  return [...results].sort((left, right) => {
    const leftPriority = left.priority ?? Number.MAX_SAFE_INTEGER;
    const rightPriority = right.priority ?? Number.MAX_SAFE_INTEGER;
    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }

    if (right.recommended_buy !== left.recommended_buy) {
      return right.recommended_buy - left.recommended_buy;
    }

    return right.allocation_gap - left.allocation_gap;
  });
}

// compute target allocation gaps and recommended buys
export function computeTargetAllocation(
  input: AllocationEngineInput,
): AllocationEngineOutput {
  const portfolioValue = sumValues(
    input.holdings.map((holding) => holding.current_value),
  );
  const portfolioAfterContribution =
    portfolioValue + input.monthly_investment_amount;

  const valueMap = buildValueMap(input.holdings);
  const weightMap = buildWeightMap(input.target_allocations);
  const symbols = mergeSymbols(input.holdings, input.target_allocations);

  const results = symbols.map((symbol) => {
    const currentValue = valueMap.get(symbol) ?? 0;
    const targetWeight = weightMap.get(symbol) ?? 0;
    const currentWeight = computeCurrentWeight(currentValue, portfolioValue);
    const targetValue = roundMoney(
      portfolioAfterContribution * targetWeight,
    );
    const allocationGap = roundMoney(targetValue - currentValue);
    const recommendedBuy = roundMoney(maxZero(allocationGap));

    return applyDriftToResult({
      symbol,
      current_value: roundMoney(currentValue),
      current_weight: roundMoney(currentWeight, 4),
      target_weight: roundMoney(targetWeight, 4),
      target_value: targetValue,
      allocation_gap: allocationGap,
      recommended_buy: recommendedBuy,
      status: "on_target",
      reason: "",
    });
  });

  return sortResults(assignPriorities(results));
}

// run E1 + sweep baseline, apply news modifiers, re-sweep blocked amounts
export function computeAllocationWithNewsModifiers(input: {
  allocation: AllocationEngineInput;
  newsSignals: NewsModifierSignal[];
  sweepContext: RemainderSweepContext;
  holdings: EngineHolding[];
  technicalBySymbol?: Map<string, TechnicalAgreementScores>;
}): {
  baseline: AllocationEngineOutput;
  adjusted: AllocationEngineOutput;
  modifiers: NewsModifierResult[];
} {
  const baseline = normalizeBuysToMonthlyBudget(
    computeTargetAllocation(input.allocation),
    input.sweepContext,
    input.holdings,
  );

  const { results: newsAdjusted, modifiers } = applyNewsModifiers(
    baseline,
    input.newsSignals,
    input.technicalBySymbol,
  );

  const adjusted = applyRemainderSweep(
    newsAdjusted,
    input.sweepContext,
    input.holdings,
  );

  return { baseline, adjusted, modifiers };
}

export type {
  ActionStatus,
  AllocationAssetResult,
  AllocationEngineInput,
  AllocationEngineOutput,
  AllocationStatus,
  DriftStatus,
  EngineHolding,
  EngineTargetAllocation,
} from "@/lib/engine/types";

export type {
  NewsModifierBias,
  NewsModifierResult,
  NewsModifierSignal,
  TechnicalAgreementScores,
} from "@/lib/engine/news-modifier";

export {
  applyNewsModifiers,
  computeModifiedBuy,
  mergeNewsSignalsBySymbol,
  resolveEffectiveBias,
  shouldIgnoreNewsModifier,
  technicalScoresAgree,
} from "@/lib/engine/news-modifier";

export { DEFAULT_DRIFT_BAND_PERCENT } from "@/lib/engine/drift";
export type { RemainderSweepContext } from "@/lib/engine/sweep-remainder";
