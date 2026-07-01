"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";

import { isQuotedMarketAsset } from "@/lib/market-data/asset-utils";
import { refreshHoldingsValuations } from "@/lib/server/market-data/refresh-holdings";
import { createClient } from "@/lib/supabase/server";
import {
  onboardingPayloadSchema,
  onboardingResumeUpdateSchema,
  type OnboardingFormData,
} from "@/lib/validation/onboarding";
import type { HoldingInput } from "@/lib/validation/holdings";
import type { WatchlistItemInput } from "@/lib/validation/watchlist";

export type CompleteOnboardingResult =
  | { ok: true }
  | { ok: false; error: string };

export type OnboardingResumeData = {
  formData: OnboardingFormData;
  portfolioId: string;
};

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

function holdingToInput(holding: {
  symbol: string;
  asset_name: string | null;
  asset_type: string;
  currency: string;
  shares: number | null;
  current_value: number;
  cost_basis: number | null;
  broker: string | null;
}): HoldingInput {
  return {
    symbol: holding.symbol,
    asset_name: holding.asset_name,
    asset_type: holding.asset_type as HoldingInput["asset_type"],
    currency: holding.currency as HoldingInput["currency"],
    shares: holding.shares,
    current_value: holding.current_value,
    cost_basis: holding.cost_basis,
    broker: holding.broker,
  };
}

export async function getOnboardingResumeData(): Promise<OnboardingResumeData | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.onboarding_completed) {
    return null;
  }

  const { data: portfolio } = await supabase
    .from("portfolios")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!portfolio) {
    return null;
  }

  const [{ data: holdings }, { data: watchlist }] = await Promise.all([
    supabase
      .from("holdings")
      .select("*")
      .eq("portfolio_id", portfolio.id)
      .order("symbol", { ascending: true }),
    supabase
      .from("watchlist_items")
      .select("*")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true }),
  ]);

  const investmentStatus =
    profile.investment_status === "not_invested_yet" ||
    profile.investment_status === "has_investments"
      ? profile.investment_status
      : holdings && holdings.length > 0
        ? "has_investments"
        : "not_invested_yet";

  const formData: OnboardingFormData = {
    base_currency: profile.base_currency as OnboardingFormData["base_currency"],
    monthly_investment_amount: profile.monthly_investment_amount,
    investment_day: profile.investment_day,
    initial_investment_amount: profile.initial_investment_amount,
    risk_profile: profile.risk_profile as OnboardingFormData["risk_profile"],
    time_horizon: profile.time_horizon as OnboardingFormData["time_horizon"],
    investment_status: investmentStatus,
    holdings: (holdings ?? []).map(holdingToInput),
    watchlist: (watchlist ?? []).map(
      (item): WatchlistItemInput => ({
        symbol: item.symbol,
        asset_name: item.asset_name,
        asset_type: item.asset_type ?? undefined,
        bucket: item.bucket ?? undefined,
        sort_order: item.sort_order,
      }),
    ),
  };

  return {
    formData,
    portfolioId: portfolio.id,
  };
}

async function insertHoldings(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  portfolioId: string,
  holdings: HoldingInput[],
) {
  if (holdings.length === 0) {
    return null;
  }

  const holdingsRows = holdings.map((holding) => ({
    user_id: userId,
    portfolio_id: portfolioId,
    symbol: normalizeSymbol(holding.symbol),
    asset_name: holding.asset_name?.trim() || null,
    asset_type: holding.asset_type,
    currency: holding.currency,
    current_value: isQuotedMarketAsset(holding.asset_type)
      ? 0
      : (holding.current_value ?? 0),
    cost_basis: holding.cost_basis ?? null,
    shares: holding.shares ?? null,
    broker: holding.broker?.trim() || null,
  }));

  const { error: holdingsError } = await supabase
    .from("holdings")
    .insert(holdingsRows);

  if (holdingsError) {
    return holdingsError.message;
  }

  const { data: insertedHoldings } = await supabase
    .from("holdings")
    .select("*")
    .eq("portfolio_id", portfolioId);

  if (insertedHoldings && insertedHoldings.length > 0) {
    try {
      await refreshHoldingsValuations(supabase, insertedHoldings, true);
    } catch {
      // onboarding continues with zero values until manual refresh
    }
  }

  return null;
}

async function replaceWatchlist(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  watchlist: WatchlistItemInput[],
) {
  const { error: deleteError } = await supabase
    .from("watchlist_items")
    .delete()
    .eq("user_id", userId);

  if (deleteError) {
    return deleteError.message;
  }

  if (watchlist.length === 0) {
    return null;
  }

  const watchlistRows = watchlist.map((item) => ({
    user_id: userId,
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
    return watchlistError.message;
  }

  return null;
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

  const setupAttentionDismissed =
    payload.investment_status === "not_invested_yet" ? false : true;

  const { error: profileUpdateError } = await supabase
    .from("profiles")
    .update({
      base_currency: payload.base_currency,
      monthly_investment_amount: payload.monthly_investment_amount,
      investment_day: payload.investment_day,
      initial_investment_amount: payload.initial_investment_amount ?? null,
      risk_profile: payload.risk_profile,
      time_horizon: payload.time_horizon,
      investment_status: payload.investment_status,
      setup_attention_dismissed: setupAttentionDismissed,
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
    })
    .select("id")
    .single();

  if (portfolioInsertError || !portfolio) {
    return {
      ok: false,
      error: portfolioInsertError?.message ?? "Failed to create portfolio.",
    };
  }

  const holdingsError = await insertHoldings(
    supabase,
    user.id,
    portfolio.id,
    payload.holdings,
  );

  if (holdingsError) {
    return { ok: false, error: holdingsError };
  }

  const watchlistError = await replaceWatchlist(
    supabase,
    user.id,
    payload.watchlist,
  );

  if (watchlistError) {
    return { ok: false, error: watchlistError };
  }

  revalidatePath("/dashboard");
  revalidatePath("/onboarding");

  return { ok: true };
}

export async function resumeOnboardingUpdate(
  raw: unknown,
): Promise<CompleteOnboardingResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "You must be signed in to update setup." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("onboarding_completed, investment_status")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return { ok: false, error: profileError.message };
  }

  if (!profile?.onboarding_completed) {
    return { ok: false, error: "Complete onboarding before using resume mode." };
  }

  let payload;
  try {
    payload = onboardingResumeUpdateSchema.parse(raw);
  } catch (error) {
    if (error instanceof ZodError) {
      return { ok: false, error: error.issues[0]?.message ?? "Invalid input." };
    }
    return { ok: false, error: "Invalid input." };
  }

  const { data: portfolio, error: portfolioError } = await supabase
    .from("portfolios")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (portfolioError) {
    return { ok: false, error: portfolioError.message };
  }

  if (!portfolio) {
    return { ok: false, error: "Portfolio not found." };
  }

  const { data: existingHoldings } = await supabase
    .from("holdings")
    .select("symbol")
    .eq("portfolio_id", portfolio.id);

  const existingSymbols = new Set(
    (existingHoldings ?? []).map((holding) =>
      normalizeSymbol(holding.symbol),
    ),
  );

  const newHoldings = payload.holdings.filter(
    (holding) => !existingSymbols.has(normalizeSymbol(holding.symbol)),
  );

  const statusChanged = profile.investment_status !== payload.investment_status;
  const hasNewHoldings = newHoldings.length > 0;

  const profileUpdate: Record<string, unknown> = {
    base_currency: payload.base_currency,
    monthly_investment_amount: payload.monthly_investment_amount,
    investment_day: payload.investment_day,
    initial_investment_amount: payload.initial_investment_amount ?? null,
    risk_profile: payload.risk_profile,
    time_horizon: payload.time_horizon,
    investment_status: payload.investment_status,
  };

  if (payload.investment_status === "has_investments" && hasNewHoldings) {
    profileUpdate.setup_attention_dismissed = true;
  } else if (statusChanged) {
    profileUpdate.setup_attention_dismissed = false;
  }

  const { error: profileUpdateError } = await supabase
    .from("profiles")
    .update(profileUpdate)
    .eq("id", user.id);

  if (profileUpdateError) {
    return { ok: false, error: profileUpdateError.message };
  }

  const { error: portfolioUpdateError } = await supabase
    .from("portfolios")
    .update({ base_currency: payload.base_currency })
    .eq("id", portfolio.id);

  if (portfolioUpdateError) {
    return { ok: false, error: portfolioUpdateError.message };
  }

  const holdingsError = await insertHoldings(
    supabase,
    user.id,
    portfolio.id,
    newHoldings.map((holding) => ({
      ...holding,
      currency: payload.base_currency,
    })),
  );

  if (holdingsError) {
    return { ok: false, error: holdingsError };
  }

  const watchlistError = await replaceWatchlist(
    supabase,
    user.id,
    payload.watchlist,
  );

  if (watchlistError) {
    return { ok: false, error: watchlistError };
  }

  revalidatePath("/dashboard");
  revalidatePath("/onboarding");
  revalidatePath("/holdings");
  revalidatePath("/settings/watchlist");

  return { ok: true };
}
