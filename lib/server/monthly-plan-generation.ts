import { computeTargetAllocation } from "@/lib/engine/allocation";
import type { EngineTargetAllocation } from "@/lib/engine/types";
import {
  buildRemainderSweepContext,
  normalizeBuysToMonthlyBudget,
} from "@/lib/engine/sweep-remainder";
import { inferTargetAssetsFromHoldings } from "@/lib/allocation/infer-bucket-assignments";
import { normalizePlanSymbol } from "@/lib/monthly-plan/format";
import type { TargetAllocationsSnapshot } from "@/lib/server/targets";
import { baseCurrencySchema } from "@/lib/validation/common";
import type { SaveMonthlyPlanInput } from "@/lib/validation/monthly-plan";
import type { Holding, Profile, TargetAsset, TargetBucketKey } from "@/types/database";

// current month key in UTC
export function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

type BucketModeAsset = Pick<TargetAsset, "symbol" | "bucket_key" | "enabled">;

// use saved symbol-to-bucket mappings, or infer from holdings
function resolveBucketModeAssets(
  snapshot: TargetAllocationsSnapshot,
  holdings: Holding[],
): BucketModeAsset[] {
  const saved = snapshot.target_assets.filter((asset) => asset.enabled);
  if (saved.length > 0) {
    return saved;
  }

  const enabledBuckets = snapshot.target_buckets
    .filter((bucket) => bucket.enabled)
    .map((bucket) => bucket.bucket_key);

  return inferTargetAssetsFromHoldings(
    holdings.map((holding) => ({
      symbol: holding.symbol,
      asset_type: holding.asset_type,
    })),
    enabledBuckets,
  ).map((asset) => ({
    symbol: asset.symbol,
    bucket_key: asset.bucket_key,
    enabled: true,
  }));
}

// map allocation snapshot to engine target weights
export function resolveEngineTargets(
  snapshot: TargetAllocationsSnapshot,
  holdings: Holding[],
): { ok: true; data: EngineTargetAllocation[] } | { ok: false; error: string } {
  if (snapshot.allocation_mode === "symbol") {
    const enabledAssets = snapshot.target_assets.filter((asset) => asset.enabled);

    if (enabledAssets.length === 0) {
      return {
        ok: false,
        error: "Add at least one symbol target before generating a plan.",
      };
    }

    return {
      ok: true,
      data: enabledAssets.map((asset) => ({
        symbol: normalizePlanSymbol(asset.symbol),
        target_weight: (asset.target_percent ?? 0) / 100,
      })),
    };
  }

  const bucketModeAssets = resolveBucketModeAssets(snapshot, holdings);

  if (bucketModeAssets.length === 0) {
    return {
      ok: false,
      error:
        "No holdings could be mapped to your allocation buckets. Add holdings or update targets.",
    };
  }

  const enabledBuckets = snapshot.target_buckets.filter((bucket) => bucket.enabled);
  const holdingSymbols = new Set(
    holdings.map((holding) => normalizePlanSymbol(holding.symbol)),
  );
  const weightBySymbol = new Map<string, number>();

  for (const bucket of enabledBuckets) {
    const assetsInBucket = bucketModeAssets.filter(
      (asset) => asset.bucket_key === bucket.bucket_key,
    );
    const symbolsInBucket = assetsInBucket
      .map((asset) => normalizePlanSymbol(asset.symbol))
      .filter((symbol) => holdingSymbols.has(symbol));

    if (symbolsInBucket.length === 0) {
      continue;
    }

    const weightEach = bucket.target_percent / 100 / symbolsInBucket.length;

    for (const symbol of symbolsInBucket) {
      weightBySymbol.set(symbol, (weightBySymbol.get(symbol) ?? 0) + weightEach);
    }
  }

  if (weightBySymbol.size === 0) {
    return {
      ok: false,
      error:
        "No holdings match your bucket targets. Add holdings or update allocations.",
    };
  }

  return {
    ok: true,
    data: Array.from(weightBySymbol.entries()).map(([symbol, target_weight]) => ({
      symbol,
      target_weight,
    })),
  };
}

function buildBucketBySymbol(
  snapshot: TargetAllocationsSnapshot,
  holdings: Holding[],
): Map<string, TargetBucketKey> {
  if (snapshot.allocation_mode === "symbol") {
    return new Map(
      snapshot.target_assets.map((asset) => [
        normalizePlanSymbol(asset.symbol),
        asset.bucket_key,
      ]),
    );
  }

  return new Map(
    resolveBucketModeAssets(snapshot, holdings).map((asset) => [
      normalizePlanSymbol(asset.symbol),
      asset.bucket_key,
    ]),
  );
}

type BuildMonthlyPlanPayloadInput = {
  profile: Profile;
  holdings: Holding[];
  targets: TargetAllocationsSnapshot;
  month: string;
};

// run E1 and map results to a save payload
export function buildMonthlyPlanPayload(
  input: BuildMonthlyPlanPayloadInput,
): { ok: true; data: SaveMonthlyPlanInput } | { ok: false; error: string } {
  const { profile, holdings, targets, month } = input;

  const resolvedTargets = resolveEngineTargets(targets, holdings);
  if (!resolvedTargets.ok) {
    return resolvedTargets;
  }

  const results = computeTargetAllocation({
    holdings: holdings.map((holding) => ({
      symbol: holding.symbol,
      current_value: holding.current_value,
    })),
    target_allocations: resolvedTargets.data,
    monthly_investment_amount: profile.monthly_investment_amount,
  });

  const bucketBySymbol = buildBucketBySymbol(targets, holdings);
  const enabledBuckets = targets.target_buckets
    .filter((bucket) => bucket.enabled)
    .map((bucket) => bucket.bucket_key);
  const cashBucket = targets.target_buckets.find(
    (bucket) => bucket.bucket_key === "cash_reserve" && bucket.enabled,
  );

  const sweptResults = normalizeBuysToMonthlyBudget(
    results,
    buildRemainderSweepContext({
      monthlyAmount: profile.monthly_investment_amount,
      targetAllocations: resolvedTargets.data,
      bucketBySymbol,
      enabledBuckets,
      cashBucketPercent: cashBucket?.target_percent,
    }),
    holdings.map((holding) => ({
      symbol: holding.symbol,
      current_value: holding.current_value,
    })),
  );

  const currencyResult = baseCurrencySchema.safeParse(profile.base_currency);
  const currency = currencyResult.success ? currencyResult.data : "MXN";

  return {
    ok: true,
    data: {
      month,
      monthly_amount: profile.monthly_investment_amount,
      currency,
      status: "draft",
      items: sweptResults.map((result) => ({
        symbol: result.symbol,
        target_weight: result.target_weight,
        current_weight: result.current_weight,
        recommended_amount: result.recommended_buy,
        adjusted_amount: result.recommended_buy,
        reason: result.reason,
      })),
    },
  };
}
