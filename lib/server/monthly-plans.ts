"use server";

import { revalidatePath } from "next/cache";

import { computeTargetAllocation } from "@/lib/engine/allocation";
import type { EngineTargetAllocation } from "@/lib/engine/types";
import { parseZodError, requireAuthUser } from "@/lib/server/auth";
import { getHoldings } from "@/lib/server/holdings";
import { getUserPortfolio } from "@/lib/server/portfolio";
import { getUserProfile } from "@/lib/server/profile";
import {
  getTargetAllocations,
  type TargetAllocationsSnapshot,
} from "@/lib/server/targets";
import { baseCurrencySchema } from "@/lib/validation/common";
import {
  getMonthlyPlanSchema,
  markMonthlyPlanCompletedSchema,
  saveMonthlyPlanSchema,
  type SaveMonthlyPlanInput,
} from "@/lib/validation/monthly-plan";
import type {
  Holding,
  MonthlyPlan,
  MonthlyPlanItem,
  MonthlyPlanWithItems,
} from "@/types/database";

export type MutationResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

// current month key in UTC
function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

type PersistContext = {
  supabase: Awaited<
    ReturnType<typeof import("@/lib/supabase/server").createClient>
  >;
  userId: string;
  portfolioId: string;
};

// map allocation snapshot to engine target weights
function resolveEngineTargets(
  snapshot: TargetAllocationsSnapshot,
  holdings: Holding[],
): { ok: true; data: EngineTargetAllocation[] } | { ok: false; error: string } {
  const enabledAssets = snapshot.target_assets.filter((asset) => asset.enabled);

  if (snapshot.allocation_mode === "symbol") {
    if (enabledAssets.length === 0) {
      return {
        ok: false,
        error: "Add at least one symbol target before generating a plan.",
      };
    }

    return {
      ok: true,
      data: enabledAssets.map((asset) => ({
        symbol: normalizeSymbol(asset.symbol),
        target_weight: (asset.target_percent ?? 0) / 100,
      })),
    };
  }

  if (enabledAssets.length === 0) {
    return {
      ok: false,
      error:
        "Configure symbol targets for your buckets before generating a plan.",
    };
  }

  const enabledBuckets = snapshot.target_buckets.filter((bucket) => bucket.enabled);
  const holdingSymbols = new Set(
    holdings.map((holding) => normalizeSymbol(holding.symbol)),
  );
  const weightBySymbol = new Map<string, number>();

  for (const bucket of enabledBuckets) {
    const assetsInBucket = enabledAssets.filter(
      (asset) => asset.bucket_key === bucket.bucket_key,
    );
    const symbolsInBucket = assetsInBucket
      .map((asset) => normalizeSymbol(asset.symbol))
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
        "No holdings match your bucket symbol targets. Add holdings or update targets.",
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
    symbol: normalizeSymbol(item.symbol),
    target_weight: item.target_weight,
    current_weight: item.current_weight,
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

  revalidatePath("/dashboard");

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

  const [portfolio, profile, holdings, targets] = await Promise.all([
    getUserPortfolio(auth.user.id),
    getUserProfile(),
    getHoldings(),
    getTargetAllocations(),
  ]);

  if (!portfolio) {
    return { ok: false, error: "Portfolio not found." };
  }

  if (!profile) {
    return { ok: false, error: "Profile not found." };
  }

  if (!holdings || holdings.length === 0) {
    return { ok: false, error: "Add at least one holding before generating a plan." };
  }

  if (!targets) {
    return { ok: false, error: "Target allocations not found." };
  }

  const resolvedTargets = resolveEngineTargets(targets, holdings);
  if (!resolvedTargets.ok) {
    return { ok: false, error: resolvedTargets.error };
  }

  const engineInput = {
    holdings: holdings.map((holding) => ({
      symbol: holding.symbol,
      current_value: holding.current_value,
    })),
    target_allocations: resolvedTargets.data,
    monthly_investment_amount: profile.monthly_investment_amount,
  };

  const results = computeTargetAllocation(engineInput);

  const currencyResult = baseCurrencySchema.safeParse(profile.base_currency);
  const currency = currencyResult.success ? currencyResult.data : "MXN";

  const payload: SaveMonthlyPlanInput = {
    month: planMonth,
    monthly_amount: profile.monthly_investment_amount,
    currency,
    status: "draft",
    items: results.map((result) => ({
      symbol: result.symbol,
      target_weight: result.target_weight,
      current_weight: result.current_weight,
      recommended_amount: result.recommended_buy,
      adjusted_amount: result.recommended_buy,
      reason: result.reason,
    })),
  };

  return persistMonthlyPlan(
    {
      supabase: auth.supabase,
      userId: auth.user.id,
      portfolioId: portfolio.id,
    },
    payload,
  );
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

  revalidatePath("/dashboard");

  return { ok: true, data };
}
