import { z } from "zod";

import {
  allocationModeSchema,
  targetBucketKeySchema,
} from "@/lib/validation/common";

export const targetBucketInputSchema = z.object({
  bucket_key: targetBucketKeySchema,
  target_percent: z.coerce
    .number()
    .min(0, "Target must be between 0 and 100")
    .max(100, "Target must be between 0 and 100"),
  enabled: z.boolean().default(true),
});

export const targetAssetInputSchema = z.object({
  symbol: z
    .string()
    .trim()
    .min(1, "Symbol is required")
    .max(20, "Symbol is too long"),
  bucket_key: targetBucketKeySchema,
  target_percent: z.coerce
    .number()
    .min(0, "Target must be between 0 and 100")
    .max(100, "Target must be between 0 and 100"),
});

export function validateBucketSum(
  buckets: z.infer<typeof targetBucketInputSchema>[],
  ctx: z.RefinementCtx,
  path: string,
) {
  const enabledBuckets = buckets.filter((bucket) => bucket.enabled);
  const sum = enabledBuckets.reduce(
    (total, bucket) => total + bucket.target_percent,
    0,
  );
  if (Math.abs(sum - 100) > 0.01) {
    ctx.addIssue({
      code: "custom",
      message: "Bucket targets must sum to 100%",
      path: [path],
    });
  }
}

export function validateAssetSum(
  assets: z.infer<typeof targetAssetInputSchema>[],
  ctx: z.RefinementCtx,
) {
  const sum = assets.reduce((total, asset) => total + asset.target_percent, 0);
  if (Math.abs(sum - 100) > 0.01) {
    ctx.addIssue({
      code: "custom",
      message: "Symbol targets must sum to 100%",
      path: ["target_assets"],
    });
  }

  const symbols = assets.map((asset) => asset.symbol.trim().toUpperCase());
  const unique = new Set(symbols);
  if (unique.size !== symbols.length) {
    ctx.addIssue({
      code: "custom",
      message: "Duplicate allocation symbols are not allowed",
      path: ["target_assets"],
    });
  }
}

export const upsertTargetAllocationsSchema = z
  .object({
    allocation_mode: allocationModeSchema,
    target_buckets: z
      .array(targetBucketInputSchema)
      .min(1, "Add at least one bucket target"),
    target_assets: z.array(targetAssetInputSchema),
    include_individual_stock_bucket: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.allocation_mode === "symbol") {
      if (data.target_assets.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Add at least one symbol target",
          path: ["target_assets"],
        });
        return;
      }
      validateAssetSum(data.target_assets, ctx);
      return;
    }

    validateBucketSum(data.target_buckets, ctx, "target_buckets");
  });

export type TargetBucketInput = z.infer<typeof targetBucketInputSchema>;
export type TargetAssetInput = z.infer<typeof targetAssetInputSchema>;
export type UpsertTargetAllocationsInput = z.infer<
  typeof upsertTargetAllocationsSchema
>;
