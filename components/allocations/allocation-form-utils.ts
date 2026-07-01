import {
  BUCKET_DEFINITIONS,
  getRecommendedBucketsForRisk,
  riskProfileSchema,
  type AllocationStepValue,
} from "@/lib/validation/onboarding";
import type { TargetAllocationsSnapshot } from "@/lib/server/targets";
import type { TargetBucketKey } from "@/types/database";
import type { z } from "zod";

type RiskProfile = z.infer<typeof riskProfileSchema>;

function parseRiskProfile(value: string): RiskProfile {
  const parsed = riskProfileSchema.safeParse(value);
  return parsed.success ? parsed.data : "growth";
}

function mergeBuckets(
  dbBuckets: TargetAllocationsSnapshot["target_buckets"],
  riskProfile: RiskProfile,
  includeIndividualStock: boolean,
): AllocationStepValue["target_buckets"] {
  if (dbBuckets.length === 0) {
    return getRecommendedBucketsForRisk(riskProfile, includeIndividualStock);
  }

  const dbByKey = new Map(
    dbBuckets.map((bucket) => [bucket.bucket_key, bucket]),
  );

  return BUCKET_DEFINITIONS.map((definition) => {
    const existing = dbByKey.get(definition.bucket_key);
    if (existing) {
      return {
        bucket_key: existing.bucket_key,
        target_percent: existing.target_percent,
        enabled: existing.enabled,
      };
    }

    if (definition.bucket_key === "individual_stock") {
      return {
        bucket_key: "individual_stock" as const,
        target_percent: 0,
        enabled: includeIndividualStock,
      };
    }

    return {
      bucket_key: definition.bucket_key,
      target_percent: 0,
      enabled: true,
    };
  });
}

export function snapshotToAllocationForm(
  snapshot: TargetAllocationsSnapshot | null,
  riskProfileRaw: string,
): AllocationStepValue {
  const riskProfile = parseRiskProfile(riskProfileRaw);

  if (!snapshot) {
    return {
      allocation_mode: "auto",
      target_buckets: getRecommendedBucketsForRisk(riskProfile),
      target_assets: [],
      include_individual_stock_bucket: false,
    };
  }

  const includeIndividualStock = snapshot.target_buckets.some(
    (bucket) => bucket.bucket_key === "individual_stock" && bucket.enabled,
  );

  const targetBuckets = mergeBuckets(
    snapshot.target_buckets,
    riskProfile,
    includeIndividualStock,
  );

  const targetAssets =
    snapshot.target_assets.length > 0
      ? snapshot.target_assets.map((asset) => ({
          symbol: asset.symbol,
          bucket_key: asset.bucket_key as TargetBucketKey,
          target_percent: asset.target_percent ?? 0,
        }))
      : [];

  return {
    allocation_mode: snapshot.allocation_mode,
    target_buckets: targetBuckets,
    target_assets: targetAssets,
    include_individual_stock_bucket: includeIndividualStock,
  };
}

export function isAllocationTotalValid(value: AllocationStepValue): boolean {
  if (value.allocation_mode === "symbol") {
    const sum = value.target_assets.reduce(
      (total, asset) => total + asset.target_percent,
      0,
    );
    return Math.abs(sum - 100) <= 0.01 && value.target_assets.length > 0;
  }

  const enabledBuckets = value.target_buckets.filter((bucket) => {
    if (bucket.bucket_key === "individual_stock") {
      return value.include_individual_stock_bucket && bucket.enabled;
    }
    return bucket.enabled;
  });
  const sum = enabledBuckets.reduce(
    (total, bucket) => total + bucket.target_percent,
    0,
  );
  return Math.abs(sum - 100) <= 0.01;
}
