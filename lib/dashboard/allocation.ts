import { buildBucketBySymbol } from "@/lib/allocation/bucket-mapping";
import { computeTargetAllocation } from "@/lib/engine/allocation";
import type { AllocationStatus } from "@/lib/engine/types";
import { sumValues } from "@/lib/engine/math";
import { normalizePlanSymbol } from "@/lib/monthly-plan/format";
import { resolveEngineTargets } from "@/lib/server/monthly-plan-generation";
import type { TargetAllocationsSnapshot } from "@/lib/server/targets";
import { BUCKET_DEFINITIONS } from "@/lib/validation/onboarding";
import type {
  AllocationMode,
  Holding,
  TargetBucketKey,
} from "@/types/database";

import type {
  AllocationSlice,
  DashboardAllocationView,
  DriftRow,
} from "./types";

const ON_TARGET_EPSILON = 0.01;

const BUCKET_LABELS = new Map(
  BUCKET_DEFINITIONS.map((bucket) => [bucket.bucket_key, bucket.label]),
);

function bucketLabel(key: TargetBucketKey): string {
  return BUCKET_LABELS.get(key) ?? key;
}

function deriveDriftStatus(driftPercent: number): AllocationStatus {
  const driftFraction = driftPercent / 100;
  if (Math.abs(driftFraction) <= ON_TARGET_EPSILON) {
    return "on_target";
  }
  return driftFraction < 0 ? "underweight" : "overweight";
}

export function computeTotalPortfolioValue(holdings: Holding[]): number {
  return sumValues(holdings.map((holding) => holding.current_value));
}

function buildBucketCurrentSlices(
  holdings: Holding[],
  bucketBySymbol: Map<string, TargetBucketKey>,
): AllocationSlice[] {
  const totalValue = computeTotalPortfolioValue(holdings);
  const valueByBucket = new Map<TargetBucketKey, number>();

  for (const holding of holdings) {
    const symbol = normalizePlanSymbol(holding.symbol);
    const bucketKey = bucketBySymbol.get(symbol);
    if (!bucketKey) {
      continue;
    }
    valueByBucket.set(
      bucketKey,
      (valueByBucket.get(bucketKey) ?? 0) + holding.current_value,
    );
  }

  return Array.from(valueByBucket.entries())
    .map(([key, value]) => ({
      key,
      label: bucketLabel(key),
      percent: totalValue > 0 ? (value / totalValue) * 100 : 0,
    }))
    .sort((left, right) => right.percent - left.percent);
}

function buildBucketTargetSlices(
  snapshot: TargetAllocationsSnapshot,
): AllocationSlice[] {
  return snapshot.target_buckets
    .filter((bucket) => bucket.enabled)
    .map((bucket) => ({
      key: bucket.bucket_key,
      label: bucketLabel(bucket.bucket_key),
      percent: bucket.target_percent,
    }))
    .sort((left, right) => right.percent - left.percent);
}

function buildBucketDriftRows(
  currentSlices: AllocationSlice[],
  targetSlices: AllocationSlice[],
): DriftRow[] {
  const keys = new Set([
    ...currentSlices.map((slice) => slice.key),
    ...targetSlices.map((slice) => slice.key),
  ]);

  const currentByKey = new Map(currentSlices.map((slice) => [slice.key, slice]));
  const targetByKey = new Map(targetSlices.map((slice) => [slice.key, slice]));

  return Array.from(keys)
    .map((key) => {
      const current = currentByKey.get(key);
      const target = targetByKey.get(key);
      const currentPercent = current?.percent ?? 0;
      const targetPercent = target?.percent ?? 0;
      const driftPercent = currentPercent - targetPercent;

      return {
        key,
        label: target?.label ?? current?.label ?? key,
        currentPercent,
        targetPercent,
        driftPercent,
        status: deriveDriftStatus(driftPercent),
      };
    })
    .sort((left, right) => Math.abs(right.driftPercent) - Math.abs(left.driftPercent));
}

function buildSymbolSlices(
  results: ReturnType<typeof computeTargetAllocation>,
  field: "current_weight" | "target_weight",
): AllocationSlice[] {
  return results
    .map((result) => ({
      key: result.symbol,
      label: result.symbol,
      percent: result[field] * 100,
    }))
    .filter((slice) => slice.percent > 0)
    .sort((left, right) => right.percent - left.percent);
}

function buildSymbolDriftRows(
  results: ReturnType<typeof computeTargetAllocation>,
): DriftRow[] {
  return results
    .map((result) => ({
      key: result.symbol,
      label: result.symbol,
      currentPercent: result.current_weight * 100,
      targetPercent: result.target_weight * 100,
      driftPercent: result.allocation_gap * 100,
      status: result.status,
    }))
    .sort((left, right) => Math.abs(right.driftPercent) - Math.abs(left.driftPercent));
}

function emptyAllocationView(mode: AllocationMode): DashboardAllocationView {
  return {
    mode,
    currentSlices: [],
    targetSlices: [],
    driftRows: [],
  };
}

// roll up holdings and targets into dashboard chart data
export function buildDashboardAllocationView(
  holdings: Holding[],
  snapshot: TargetAllocationsSnapshot,
): DashboardAllocationView {
  const mode = snapshot.allocation_mode;

  if (mode === "symbol") {
    const enabledAssets = snapshot.target_assets.filter((asset) => asset.enabled);
    if (enabledAssets.length === 0) {
      return emptyAllocationView(mode);
    }

    const resolvedTargets = resolveEngineTargets(snapshot, holdings);
    if (!resolvedTargets.ok) {
      return emptyAllocationView(mode);
    }

    const results = computeTargetAllocation({
      holdings: holdings.map((holding) => ({
        symbol: holding.symbol,
        current_value: holding.current_value,
      })),
      target_allocations: resolvedTargets.data,
      monthly_investment_amount: 0,
    });

    const currentSlices = buildSymbolSlices(results, "current_weight");
    const targetSlices = buildSymbolSlices(results, "target_weight");
    const driftRows = buildSymbolDriftRows(results);

    return { mode, currentSlices, targetSlices, driftRows };
  }

  const bucketBySymbol = buildBucketBySymbol(snapshot, holdings);
  const currentSlices = buildBucketCurrentSlices(holdings, bucketBySymbol);
  const targetSlices = buildBucketTargetSlices(snapshot);
  const driftRows = buildBucketDriftRows(currentSlices, targetSlices);

  return { mode, currentSlices, targetSlices, driftRows };
}
