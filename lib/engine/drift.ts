import { roundMoney } from "@/lib/engine/math";
import type {
  ActionStatus,
  AllocationAssetResult,
  AllocationStatus,
  DriftStatus,
} from "@/lib/engine/types";

export const DEFAULT_DRIFT_BAND_PERCENT = 5;

export type PreDriftAllocationResult = Omit<
  AllocationAssetResult,
  "drift_percent" | "drift_status" | "priority" | "action_status"
>;

// weight drift in percentage points
export function computeDriftPercent(
  currentWeight: number,
  targetWeight: number,
): number {
  return roundMoney((currentWeight - targetWeight) * 100, 2);
}

// classify drift relative to band
export function deriveDriftStatus(
  driftPercent: number,
  bandPercent: number = DEFAULT_DRIFT_BAND_PERCENT,
): DriftStatus {
  if (driftPercent < -bandPercent) {
    return "prioritize";
  }

  if (driftPercent > bandPercent) {
    return "stop_buying";
  }

  return "normal";
}

export function deriveActionStatus(driftStatus: DriftStatus): ActionStatus {
  return driftStatus;
}

function deriveAllocationStatus(driftStatus: DriftStatus): AllocationStatus {
  if (driftStatus === "prioritize") {
    return "underweight";
  }

  if (driftStatus === "stop_buying") {
    return "overweight";
  }

  return "on_target";
}

function deriveReason(driftStatus: DriftStatus): string {
  if (driftStatus === "prioritize") {
    return "Below drift band; eligible for monthly buys";
  }

  if (driftStatus === "stop_buying") {
    return "Above drift band; no buy this month";
  }

  return "Within drift band; no buy this month";
}

// apply drift band and gate recommended buys
export function applyDriftToResult(
  result: PreDriftAllocationResult,
  bandPercent: number = DEFAULT_DRIFT_BAND_PERCENT,
): AllocationAssetResult {
  const driftPercent = computeDriftPercent(
    result.current_weight,
    result.target_weight,
  );
  const driftStatus = deriveDriftStatus(driftPercent, bandPercent);
  const actionStatus = deriveActionStatus(driftStatus);
  const rawRecommendedBuy = result.recommended_buy;
  const recommendedBuy =
    driftStatus === "prioritize" ? rawRecommendedBuy : 0;

  return {
    ...result,
    drift_percent: driftPercent,
    drift_status: driftStatus,
    action_status: actionStatus,
    priority: null,
    recommended_buy: recommendedBuy,
    status: deriveAllocationStatus(driftStatus),
    reason: deriveReason(driftStatus),
  };
}

// rank prioritize assets by drift magnitude then gap
export function assignPriorities(
  results: AllocationAssetResult[],
): AllocationAssetResult[] {
  const prioritize = results
    .filter((result) => result.drift_status === "prioritize")
    .sort((left, right) => {
      const driftDelta =
        Math.abs(right.drift_percent) - Math.abs(left.drift_percent);
      if (driftDelta !== 0) {
        return driftDelta;
      }

      return right.allocation_gap - left.allocation_gap;
    });

  const priorityBySymbol = new Map<string, number>();
  prioritize.forEach((result, index) => {
    priorityBySymbol.set(result.symbol, index + 1);
  });

  return results.map((result) => ({
    ...result,
    priority: priorityBySymbol.get(result.symbol) ?? null,
  }));
}
