import { maxZero, roundMoney, sumValues } from "@/lib/engine/math";
import type {
  AllocationAssetResult,
  AllocationEngineInput,
  AllocationEngineOutput,
  AllocationStatus,
} from "@/lib/engine/types";
import {
  buildValueMap,
  buildWeightMap,
  computeCurrentWeight,
  mergeSymbols,
} from "@/lib/engine/weights";

const ON_TARGET_EPSILON = 0.01;

// derive status and reason from allocation gap
function deriveStatus(allocationGap: number): {
  status: AllocationStatus;
  reason: string;
} {
  if (Math.abs(allocationGap) <= ON_TARGET_EPSILON) {
    return {
      status: "on_target",
      reason: "Near target allocation",
    };
  }

  if (allocationGap > 0) {
    return {
      status: "underweight",
      reason: "Below target; eligible for monthly buys",
    };
  }

  return {
    status: "overweight",
    reason: "At or above target; no buy this month",
  };
}

// sort underweight assets by largest buy gap first
function sortResults(results: AllocationAssetResult[]): AllocationAssetResult[] {
  return [...results].sort((left, right) => {
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
    const { status, reason } = deriveStatus(allocationGap);

    return {
      symbol,
      current_value: roundMoney(currentValue),
      current_weight: roundMoney(currentWeight, 4),
      target_weight: roundMoney(targetWeight, 4),
      target_value: targetValue,
      allocation_gap: allocationGap,
      recommended_buy: recommendedBuy,
      status,
      reason,
    };
  });

  return sortResults(results);
}

export type {
  AllocationAssetResult,
  AllocationEngineInput,
  AllocationEngineOutput,
  AllocationStatus,
  EngineHolding,
  EngineTargetAllocation,
} from "@/lib/engine/types";
