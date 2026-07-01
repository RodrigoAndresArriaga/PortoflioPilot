import { isCashSymbol } from "@/lib/monthly-plan/format";
import { applyDriftToResult } from "@/lib/engine/drift";
import { roundMoney, sumValues } from "@/lib/engine/math";
import type { AllocationAssetResult } from "@/lib/engine/types";

type TargetBucketKey =
  | "core_etf"
  | "growth_tech"
  | "cash_reserve"
  | "individual_stock";

const SWEEP_EPSILON = 0.01;

export type RemainderSweepContext = {
  monthlyAmount: number;
  bucketBySymbol: Map<string, TargetBucketKey>;
  enabledBuckets: Set<TargetBucketKey>;
  cashTargetWeight: number;
};

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

function isCoreEtfSymbol(
  symbol: string,
  bucketBySymbol: Map<string, TargetBucketKey>,
): boolean {
  return bucketBySymbol.get(normalizeSymbol(symbol)) === "core_etf";
}

function sweepReason(
  baseReason: string,
  destination: "cash" | "core" | "underweight",
): string {
  if (destination === "cash") {
    return "Remainder allocated to cash reserve after filling underweight targets";
  }
  if (destination === "core") {
    return "Remainder allocated to underweight core ETF";
  }
  if (baseReason.includes("Remainder")) {
    return baseReason;
  }
  return `${baseReason}. Includes remainder from overweight assets`;
}

type SweepDecision =
  | { action: "add"; symbol: string; destination: "cash" | "core" | "underweight" }
  | { action: "create_cash" };

function pickSweepTarget(
  results: AllocationAssetResult[],
  context: RemainderSweepContext,
): SweepDecision {
  const underweight = results
    .filter((result) => result.allocation_gap > SWEEP_EPSILON)
    .sort((left, right) => right.allocation_gap - left.allocation_gap);

  const underweightCore = underweight.filter((result) =>
    isCoreEtfSymbol(result.symbol, context.bucketBySymbol),
  );
  if (underweightCore.length > 0) {
    return {
      action: "add",
      symbol: underweightCore[0].symbol,
      destination: "core",
    };
  }

  if (underweight.length > 0) {
    return {
      action: "add",
      symbol: underweight[0].symbol,
      destination: "underweight",
    };
  }

  const cashResult = results.find((result) => isCashSymbol(result.symbol));
  if (cashResult) {
    return { action: "add", symbol: cashResult.symbol, destination: "cash" };
  }

  return { action: "create_cash" };
}

function createCashResult(
  remainder: number,
  context: RemainderSweepContext,
  holdings: { symbol: string; current_value: number }[],
): AllocationAssetResult {
  const cashHolding = holdings.find((holding) => isCashSymbol(holding.symbol));
  const symbol = cashHolding ? normalizeSymbol(cashHolding.symbol) : "CASH";
  const currentValue = roundMoney(cashHolding?.current_value ?? 0);
  const portfolioValue = roundMoney(sumValues(holdings.map((h) => h.current_value)));
  const currentWeight =
    portfolioValue > 0 ? roundMoney(currentValue / portfolioValue, 4) : 0;

  const base = applyDriftToResult({
    symbol,
    current_value: currentValue,
    current_weight: currentWeight,
    target_weight: roundMoney(context.cashTargetWeight, 4),
    target_value: roundMoney(currentValue + remainder),
    allocation_gap: remainder,
    recommended_buy: remainder,
    status: "on_target",
    reason: "",
  });

  return {
    ...base,
    recommended_buy: remainder,
    allocation_gap: remainder,
    status: "underweight",
    reason: sweepReason("", "cash"),
  };
}

function applySweepToResults(
  results: AllocationAssetResult[],
  decision: SweepDecision,
  remainder: number,
  context: RemainderSweepContext,
  holdings: { symbol: string; current_value: number }[],
): AllocationAssetResult[] {
  const nextResults = results.map((result) => ({ ...result }));

  if (decision.action === "create_cash") {
    const existingCashIndex = nextResults.findIndex((result) =>
      isCashSymbol(result.symbol),
    );
    if (existingCashIndex >= 0) {
      const cash = nextResults[existingCashIndex];
      cash.recommended_buy = roundMoney(cash.recommended_buy + remainder);
      cash.allocation_gap = roundMoney(cash.allocation_gap + remainder);
      cash.reason = sweepReason(cash.reason, "cash");
      return nextResults;
    }

    nextResults.push(createCashResult(remainder, context, holdings));
    return nextResults;
  }

  const index = nextResults.findIndex(
    (result) =>
      normalizeSymbol(result.symbol) === normalizeSymbol(decision.symbol),
  );
  if (index < 0) {
    nextResults.push(createCashResult(remainder, context, holdings));
    return nextResults;
  }

  const target = nextResults[index];
  target.recommended_buy = roundMoney(target.recommended_buy + remainder);
  target.allocation_gap = roundMoney(target.allocation_gap + remainder);
  target.reason = sweepReason(target.reason, decision.destination);
  return nextResults;
}

// scale buys down when engine total exceeds monthly budget
export function scaleDownToMonthlyBudget(
  results: AllocationAssetResult[],
  monthlyAmount: number,
): AllocationAssetResult[] {
  const totalBuy = roundMoney(
    sumValues(results.map((result) => result.recommended_buy)),
  );

  if (totalBuy <= monthlyAmount + SWEEP_EPSILON) {
    return results;
  }

  const ratio = monthlyAmount / totalBuy;
  const scaled = results.map((result) => {
    if (result.recommended_buy <= 0) {
      return { ...result };
    }

    return {
      ...result,
      recommended_buy: roundMoney(result.recommended_buy * ratio),
      reason:
        result.status === "underweight"
          ? "Below target; buy scaled to monthly budget"
          : result.reason,
    };
  });

  const scaledTotal = roundMoney(
    sumValues(scaled.map((result) => result.recommended_buy)),
  );
  const dust = roundMoney(monthlyAmount - scaledTotal);
  if (dust > 0) {
    const largestBuyIndex = scaled.reduce(
      (bestIndex, result, index, list) =>
        result.recommended_buy > list[bestIndex].recommended_buy ? index : bestIndex,
      0,
    );
    scaled[largestBuyIndex].recommended_buy = roundMoney(
      scaled[largestBuyIndex].recommended_buy + dust,
    );
  }

  return scaled;
}

// fit plan buys to exactly the monthly budget
export function normalizeBuysToMonthlyBudget(
  results: AllocationAssetResult[],
  context: RemainderSweepContext,
  holdings: { symbol: string; current_value: number }[],
): AllocationAssetResult[] {
  const scaled = scaleDownToMonthlyBudget(results, context.monthlyAmount);
  return applyRemainderSweep(scaled, context, holdings);
}

// deploy leftover monthly budget to cash or underweight core ETF
export function applyRemainderSweep(
  results: AllocationAssetResult[],
  context: RemainderSweepContext,
  holdings: { symbol: string; current_value: number }[],
): AllocationAssetResult[] {
  const totalBuy = roundMoney(
    sumValues(results.map((result) => result.recommended_buy)),
  );
  const remainder = roundMoney(context.monthlyAmount - totalBuy);

  if (remainder <= SWEEP_EPSILON) {
    return results;
  }

  const decision = pickSweepTarget(results, context);
  let nextResults = applySweepToResults(
    results,
    decision,
    remainder,
    context,
    holdings,
  );

  const finalTotal = roundMoney(
    sumValues(nextResults.map((result) => result.recommended_buy)),
  );
  const dust = roundMoney(context.monthlyAmount - finalTotal);
  if (dust > 0 && dust <= 0.05) {
    const largestBuyIndex = nextResults.reduce(
      (bestIndex, result, index, list) =>
        result.recommended_buy > list[bestIndex].recommended_buy ? index : bestIndex,
      0,
    );
    nextResults[largestBuyIndex].recommended_buy = roundMoney(
      nextResults[largestBuyIndex].recommended_buy + dust,
    );
  }

  return nextResults.sort((left, right) => {
    if (right.recommended_buy !== left.recommended_buy) {
      return right.recommended_buy - left.recommended_buy;
    }
    return right.allocation_gap - left.allocation_gap;
  });
}

export function buildRemainderSweepContext(input: {
  monthlyAmount: number;
  targetAllocations: { symbol: string; target_weight: number }[];
  bucketBySymbol: Map<string, TargetBucketKey>;
  enabledBuckets: Iterable<TargetBucketKey>;
  cashBucketPercent?: number;
}): RemainderSweepContext {
  const enabled = new Set(input.enabledBuckets);
  const cashFromTarget = input.targetAllocations.find((target) =>
    isCashSymbol(target.symbol),
  );

  let cashTargetWeight = cashFromTarget?.target_weight ?? 0;
  if (cashTargetWeight === 0 && enabled.has("cash_reserve")) {
    cashTargetWeight = roundMoney((input.cashBucketPercent ?? 10) / 100, 4);
  }

  return {
    monthlyAmount: input.monthlyAmount,
    bucketBySymbol: input.bucketBySymbol,
    enabledBuckets: enabled,
    cashTargetWeight,
  };
}
