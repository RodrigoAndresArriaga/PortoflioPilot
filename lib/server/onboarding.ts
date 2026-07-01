"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";

import { inferTargetAssetsFromHoldings } from "@/lib/allocation/infer-bucket-assignments";
import { createClient } from "@/lib/supabase/server";
import { onboardingPayloadSchema } from "@/lib/validation/onboarding";

export type CompleteOnboardingResult =
  | { ok: true }
  | { ok: false; error: string };

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

export async function completeOnboarding(
  raw: unknown,
): Promise<CompleteOnboardingResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "You must be signed in to complete onboarding." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return { ok: false, error: profileError.message };
  }

  if (!profile) {
    return { ok: false, error: "Profile not found." };
  }

  if (profile.onboarding_completed) {
    return { ok: false, error: "Onboarding is already complete." };
  }

  const { data: existingPortfolio, error: portfolioCheckError } = await supabase
    .from("portfolios")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (portfolioCheckError) {
    return { ok: false, error: portfolioCheckError.message };
  }

  if (existingPortfolio) {
    return {
      ok: false,
      error: "A portfolio already exists. Contact support if setup failed.",
    };
  }

  let payload;
  try {
    payload = onboardingPayloadSchema.parse(raw);
  } catch (error) {
    if (error instanceof ZodError) {
      return { ok: false, error: error.issues[0]?.message ?? "Invalid input." };
    }
    return { ok: false, error: "Invalid input." };
  }

  const { error: profileUpdateError } = await supabase
    .from("profiles")
    .update({
      base_currency: payload.base_currency,
      monthly_investment_amount: payload.monthly_investment_amount,
      investment_day: payload.investment_day,
      risk_profile: payload.risk_profile,
      time_horizon: payload.time_horizon,
      onboarding_completed: true,
    })
    .eq("id", user.id);

  if (profileUpdateError) {
    return { ok: false, error: profileUpdateError.message };
  }

  const { data: portfolio, error: portfolioInsertError } = await supabase
    .from("portfolios")
    .insert({
      user_id: user.id,
      name: "My Portfolio",
      base_currency: payload.base_currency,
      allocation_mode: payload.allocation_mode,
    })
    .select("id")
    .single();

  if (portfolioInsertError || !portfolio) {
    return {
      ok: false,
      error: portfolioInsertError?.message ?? "Failed to create portfolio.",
    };
  }

  const holdingsRows = payload.holdings.map((holding) => ({
    user_id: user.id,
    portfolio_id: portfolio.id,
    symbol: normalizeSymbol(holding.symbol),
    asset_name: holding.asset_name?.trim() || null,
    asset_type: holding.asset_type,
    currency: holding.currency,
    current_value: holding.current_value,
    cost_basis: holding.cost_basis ?? null,
    shares: holding.shares ?? null,
    broker: holding.broker?.trim() || null,
  }));

  const { error: holdingsError } = await supabase
    .from("holdings")
    .insert(holdingsRows);

  if (holdingsError) {
    return { ok: false, error: holdingsError.message };
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
    const inferredAssets = inferTargetAssetsFromHoldings(
      payload.holdings.map((holding) => ({
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

  const watchlistRows = payload.watchlist.map((item) => ({
    user_id: user.id,
    symbol: normalizeSymbol(item.symbol),
    asset_name: item.asset_name?.trim() || null,
    asset_type: item.asset_type ?? null,
    bucket: item.bucket ?? null,
    enabled: true,
    sort_order: item.sort_order,
  }));

  const { error: watchlistError } = await supabase
    .from("watchlist_items")
    .insert(watchlistRows);

  if (watchlistError) {
    return { ok: false, error: watchlistError.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/onboarding");

  return { ok: true };
}
