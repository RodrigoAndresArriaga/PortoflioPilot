import { inferTargetAssetsFromHoldings } from "@/lib/allocation/infer-bucket-assignments";
import { normalizePlanSymbol } from "@/lib/monthly-plan/format";
import type { TargetAllocationsSnapshot } from "@/lib/server/targets";
import type { Holding, TargetAsset, TargetBucketKey } from "@/types/database";

export type BucketModeAsset = Pick<TargetAsset, "symbol" | "bucket_key" | "enabled">;

// use saved symbol-to-bucket mappings, or infer from holdings
export function resolveBucketModeAssets(
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

// map each symbol to its allocation bucket
export function buildBucketBySymbol(
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
