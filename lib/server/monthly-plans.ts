"use server";

import { revalidatePath } from "next/cache";

import { parseZodError, requireAuthUser } from "@/lib/server/auth";
import {
  dispatchMonthlyPlanReady,
} from "@/lib/server/email-dispatch";
import { getHoldingsWithFreshPrices, getMarketContext } from "@/lib/server/market-data/with-fresh-holdings";
import {
  buildMonthlyPlanPayload,
  getCurrentMonthKey,
  newsInputsToSignals,
} from "@/lib/server/monthly-plan-generation";
import { getLatestNewsReport } from "@/lib/server/news-inputs";
import { normalizePlanSymbol } from "@/lib/monthly-plan/format";
import { getUserPortfolio } from "@/lib/server/portfolio";
import { getUserProfile } from "@/lib/server/profile";
import { getWatchlist } from "@/lib/server/watchlist";
import {
  getMonthlyPlanSchema,
  markMonthlyPlanCompletedSchema,
  saveMonthlyPlanSchema,
  type SaveMonthlyPlanInput,
} from "@/lib/validation/monthly-plan";
import type {
  MonthlyPlan,
  MonthlyPlanWithItems,
} from "@/types/database";

export type MutationResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

type PersistContext = {
  supabase: Awaited<
    ReturnType<typeof import("@/lib/supabase/server").createClient>
  >;
  userId: string;
  portfolioId: string;
};

function revalidateMonthlyPlanPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/monthly-plan");
}

// upsert plan header and replace line items
async function persistMonthlyPlan(
  context: PersistContext,
  payload: SaveMonthlyPlanInput,
): Promise<MutationResult<MonthlyPlanWithItems>> {
  const { supabase, userId, portfolioId } = context;

  const { data: existingPlan, error: existingError } = await supabase
    .from("monthly_plans")
    .select("id")
    .eq("portfolio_id", portfolioId)
    .eq("month", payload.month)
    .maybeSingle();

  if (existingError) {
    return { ok: false, error: existingError.message };
  }

  let planId = existingPlan?.id;

  if (planId) {
    const { data: updatedPlan, error: updateError } = await supabase
      .from("monthly_plans")
      .update({
        monthly_amount: payload.monthly_amount,
        currency: payload.currency,
        status: payload.status,
      })
      .eq("id", planId)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (updateError || !updatedPlan) {
      return {
        ok: false,
        error: updateError?.message ?? "Failed to update monthly plan.",
      };
    }
  } else {
    const { data: insertedPlan, error: insertError } = await supabase
      .from("monthly_plans")
      .insert({
        user_id: userId,
        portfolio_id: portfolioId,
        month: payload.month,
        monthly_amount: payload.monthly_amount,
        currency: payload.currency,
        status: payload.status,
      })
      .select("*")
      .single();

    if (insertError || !insertedPlan) {
      return {
        ok: false,
        error: insertError?.message ?? "Failed to create monthly plan.",
      };
    }

    planId = insertedPlan.id;
  }

  const { error: deleteError } = await supabase
    .from("monthly_plan_items")
    .delete()
    .eq("monthly_plan_id", planId);

  if (deleteError) {
    return { ok: false, error: deleteError.message };
  }

  const itemRows = payload.items.map((item) => ({
    monthly_plan_id: planId,
    symbol: normalizePlanSymbol(item.symbol),
    recommendation_score: item.recommendation_score ?? null,
    technical_score: item.technical_score ?? null,
    news_modifier_score: item.news_modifier_score ?? null,
    risk_score: item.risk_score ?? null,
    concentration_flag: item.concentration_flag ?? false,
    manual_review_required: item.manual_review_required ?? false,
    decision_basis: item.decision_basis?.trim() ?? null,
    recommended_amount: item.recommended_amount,
    adjusted_amount: item.adjusted_amount,
    reason: item.reason.trim(),
  }));

  const { data: items, error: itemsError } = await supabase
    .from("monthly_plan_items")
    .insert(itemRows)
    .select("*")
    .order("recommended_amount", { ascending: false });

  if (itemsError || !items) {
    return {
      ok: false,
      error: itemsError?.message ?? "Failed to save monthly plan items.",
    };
  }

  const { data: plan, error: planError } = await supabase
    .from("monthly_plans")
    .select("*")
    .eq("id", planId)
    .single();

  if (planError || !plan) {
    return {
      ok: false,
      error: planError?.message ?? "Failed to load saved monthly plan.",
    };
  }

  revalidateMonthlyPlanPaths();

  return {
    ok: true,
    data: {
      plan,
      items,
    },
  };
}

export async function saveMonthlyPlan(
  raw: unknown,
): Promise<MutationResult<MonthlyPlanWithItems>> {
  const auth = await requireAuthUser();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  let payload: SaveMonthlyPlanInput;
  try {
    payload = saveMonthlyPlanSchema.parse(raw);
  } catch (error) {
    return { ok: false, error: parseZodError(error) };
  }

  const portfolio = await getUserPortfolio(auth.user.id);
  if (!portfolio) {
    return { ok: false, error: "Portfolio not found." };
  }

  return persistMonthlyPlan(
    {
      supabase: auth.supabase,
      userId: auth.user.id,
      portfolioId: portfolio.id,
    },
    payload,
  );
}

export async function generateMonthlyPlan(
  month?: string,
): Promise<MutationResult<MonthlyPlanWithItems>> {
  const auth = await requireAuthUser();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const planMonth = month ?? getCurrentMonthKey();

  try {
    getMonthlyPlanSchema.parse({ month: planMonth });
  } catch (error) {
    return { ok: false, error: parseZodError(error) };
  }

  const [portfolio, profile, holdings, watchlist, marketSnapshot, weeklyNews] =
    await Promise.all([
      getUserPortfolio(auth.user.id),
      getUserProfile(),
      getHoldingsWithFreshPrices(),
      getWatchlist(),
      getMarketContext({ refreshIfStale: true }),
      getLatestNewsReport("weekly_market_review"),
    ]);

  if (!portfolio) {
    return { ok: false, error: "Portfolio not found." };
  }

  if (!profile) {
    return { ok: false, error: "Profile not found." };
  }

  if (!holdings || holdings.length === 0) {
    if (!watchlist || watchlist.length === 0) {
      return {
        ok: false,
        error: "Add at least one holding or watchlist symbol before generating a plan.",
      };
    }
  }

  const newsSignals = weeklyNews
    ? newsInputsToSignals(weeklyNews.children)
    : [];

  const payloadResult = buildMonthlyPlanPayload({
    profile,
    holdings: holdings ?? [],
    watchlist: watchlist ?? [],
    month: planMonth,
    technicalScores: marketSnapshot?.technicalScores ?? [],
    newsSignals,
  });

  if (!payloadResult.ok) {
    return { ok: false, error: payloadResult.error };
  }

  const persistResult = await persistMonthlyPlan(
    {
      supabase: auth.supabase,
      userId: auth.user.id,
      portfolioId: portfolio.id,
    },
    payloadResult.data,
  );

  if (persistResult.ok) {
    void dispatchMonthlyPlanReady(auth.user.id, persistResult.data).catch(
      (error) => {
        console.error("[email] Monthly plan ready dispatch failed:", error);
      },
    );
  }

  return persistResult;
}

export async function getMonthlyPlan(
  month: string,
): Promise<MonthlyPlanWithItems | null> {
  const auth = await requireAuthUser();
  if (!auth.ok) {
    return null;
  }

  try {
    getMonthlyPlanSchema.parse({ month });
  } catch {
    return null;
  }

  const portfolio = await getUserPortfolio(auth.user.id);
  if (!portfolio) {
    return null;
  }

  const { data: plan, error: planError } = await auth.supabase
    .from("monthly_plans")
    .select("*")
    .eq("user_id", auth.user.id)
    .eq("portfolio_id", portfolio.id)
    .eq("month", month)
    .maybeSingle();

  if (planError) {
    throw new Error(planError.message);
  }

  if (!plan) {
    return null;
  }

  const { data: items, error: itemsError } = await auth.supabase
    .from("monthly_plan_items")
    .select("*")
    .eq("monthly_plan_id", plan.id)
    .order("recommended_amount", { ascending: false });

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  return {
    plan,
    items: items ?? [],
  };
}

export async function markMonthlyPlanCompleted(
  planId: string,
): Promise<MutationResult<MonthlyPlan>> {
  const auth = await requireAuthUser();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  try {
    markMonthlyPlanCompletedSchema.parse({ plan_id: planId });
  } catch (error) {
    return { ok: false, error: parseZodError(error) };
  }

  const { data, error } = await auth.supabase
    .from("monthly_plans")
    .update({ status: "completed" })
    .eq("id", planId)
    .eq("user_id", auth.user.id)
    .select("*")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? "Monthly plan not found.",
    };
  }

  revalidateMonthlyPlanPaths();

  return { ok: true, data };
}

export { getCurrentMonthKey };
