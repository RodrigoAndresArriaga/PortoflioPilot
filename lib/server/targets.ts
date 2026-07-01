"use server";

import { revalidatePath } from "next/cache";

import { inferTargetAssetsFromHoldings } from "@/lib/allocation/infer-bucket-assignments";
import { parseZodError, requireAuthUser } from "@/lib/server/auth";
import { getHoldings } from "@/lib/server/holdings";
import { getUserPortfolio } from "@/lib/server/portfolio";
import { createClient } from "@/lib/supabase/server";
import { upsertTargetAllocationsSchema } from "@/lib/validation/targets";
import type {
  AllocationMode,
  TargetAsset,
  TargetBucket,
} from "@/types/database";

export type TargetAllocationsSnapshot = {
  allocation_mode: AllocationMode;
  target_buckets: TargetBucket[];
  target_assets: TargetAsset[];
};

export type UpsertTargetAllocationsResult =
  | { ok: true; data: TargetAllocationsSnapshot }
  | { ok: false; error: string };

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

export async function getTargetAllocations(): Promise<TargetAllocationsSnapshot | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const portfolio = await getUserPortfolio(user.id);
  if (!portfolio) {
    return null;
  }

  const [bucketsResult, assetsResult] = await Promise.all([
    supabase
      .from("target_buckets")
      .select("*")
      .eq("user_id", user.id)
      .eq("portfolio_id", portfolio.id)
      .order("bucket_key"),
    supabase
      .from("target_assets")
      .select("*")
      .eq("user_id", user.id)
      .eq("portfolio_id", portfolio.id)
      .order("symbol"),
  ]);

  if (bucketsResult.error) {
    throw new Error(bucketsResult.error.message);
  }
  if (assetsResult.error) {
    throw new Error(assetsResult.error.message);
  }

  return {
    allocation_mode: portfolio.allocation_mode,
    target_buckets: bucketsResult.data ?? [],
    target_assets: assetsResult.data ?? [],
  };
}

export async function upsertTargetAllocations(
  raw: unknown,
): Promise<UpsertTargetAllocationsResult> {
  const auth = await requireAuthUser();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  let payload;
  try {
    payload = upsertTargetAllocationsSchema.parse(raw);
  } catch (error) {
    return { ok: false, error: parseZodError(error) };
  }

  const { supabase, user } = auth;
  const portfolio = await getUserPortfolio(user.id);

  if (!portfolio) {
    return { ok: false, error: "Portfolio not found." };
  }

  const { error: modeError } = await supabase
    .from("portfolios")
    .update({ allocation_mode: payload.allocation_mode })
    .eq("id", portfolio.id)
    .eq("user_id", user.id);

  if (modeError) {
    return { ok: false, error: modeError.message };
  }

  const { error: deleteAssetsError } = await supabase
    .from("target_assets")
    .delete()
    .eq("user_id", user.id)
    .eq("portfolio_id", portfolio.id);

  if (deleteAssetsError) {
    return { ok: false, error: deleteAssetsError.message };
  }

  const { error: deleteBucketsError } = await supabase
    .from("target_buckets")
    .delete()
    .eq("user_id", user.id)
    .eq("portfolio_id", portfolio.id);

  if (deleteBucketsError) {
    return { ok: false, error: deleteBucketsError.message };
  }

  const enabledBuckets = payload.target_buckets.filter((bucket) => {
    if (bucket.bucket_key === "individual_stock") {
      return payload.include_individual_stock_bucket && bucket.enabled;
    }
    return bucket.enabled;
  });

  const bucketRows =
    payload.allocation_mode === "symbol"
      ? []
      : enabledBuckets.map((bucket) => ({
          user_id: user.id,
          portfolio_id: portfolio.id,
          bucket_key: bucket.bucket_key,
          target_percent: bucket.target_percent,
          enabled: bucket.enabled,
        }));

  if (bucketRows.length > 0) {
    const { error: bucketsError } = await supabase
      .from("target_buckets")
      .insert(bucketRows);

    if (bucketsError) {
      return { ok: false, error: bucketsError.message };
    }
  }

  if (payload.allocation_mode === "symbol" && payload.target_assets.length > 0) {
    const assetRows = payload.target_assets.map((asset) => ({
      user_id: user.id,
      portfolio_id: portfolio.id,
      symbol: normalizeSymbol(asset.symbol),
      bucket_key: asset.bucket_key,
      target_percent: asset.target_percent,
      enabled: true,
    }));

    const { error: assetsError } = await supabase
      .from("target_assets")
      .insert(assetRows);

    if (assetsError) {
      return { ok: false, error: assetsError.message };
    }
  } else if (payload.allocation_mode !== "symbol") {
    const holdings = await getHoldings();
    const inferredAssets = inferTargetAssetsFromHoldings(
      (holdings ?? []).map((holding) => ({
        symbol: holding.symbol,
        asset_type: holding.asset_type,
      })),
      enabledBuckets.map((bucket) => bucket.bucket_key),
    );

    if (inferredAssets.length > 0) {
      const assetRows = inferredAssets.map((asset) => ({
        user_id: user.id,
        portfolio_id: portfolio.id,
        symbol: normalizeSymbol(asset.symbol),
        bucket_key: asset.bucket_key,
        target_percent: null,
        enabled: true,
      }));

      const { error: assetsError } = await supabase
        .from("target_assets")
        .insert(assetRows);

      if (assetsError) {
        return { ok: false, error: assetsError.message };
      }
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings");

  const snapshot = await getTargetAllocations();
  if (!snapshot) {
    return { ok: false, error: "Failed to load updated allocations." };
  }

  return { ok: true, data: snapshot };
}
