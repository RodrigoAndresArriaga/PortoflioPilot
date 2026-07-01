"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";

import {
  computeInitialInvestmentRecommendations,
  resolveInitialInvestmentAmount,
} from "@/lib/engine/initial-investment";
import { getCurrentMonthKey } from "@/lib/server/monthly-plans";
import { parseZodError, requireAuthUser } from "@/lib/server/auth";
import { refreshPortfolioMarket } from "@/lib/server/market-data/refresh-portfolio-market";
import { getUserPortfolio } from "@/lib/server/portfolio";
import { getUserProfile } from "@/lib/server/profile";
import { getWatchlist } from "@/lib/server/watchlist";
import { normalizePlanSymbol } from "@/lib/monthly-plan/format";
import {
  parseInitialResearchJson,
  saveInitialResearchSchema,
  type InitialInvestmentResearch,
} from "@/lib/validation/initial-recommendation";
import type {
  InitialRecommendationItem,
  InitialRecommendationReport,
  MonthlyPlanWithItems,
} from "@/types/database";

export type MutationResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function normalizeAssetType(assetType: string): string {
  return assetType.toLowerCase() === "etf" ? "etf" : assetType.toLowerCase();
}

function buildItemRows(
  userId: string,
  portfolioId: string,
  reportId: string,
  research: InitialInvestmentResearch,
) {
  return research.symbols.map((symbol) => ({
    user_id: userId,
    portfolio_id: portfolioId,
    report_id: reportId,
    symbol: normalizePlanSymbol(symbol.symbol),
    asset_name: symbol.asset_name,
    asset_type: normalizeAssetType(symbol.asset_type),
    suggested_role: symbol.suggested_role,
    recommendation_direction: symbol.recommendation_direction,
    ai_bias: symbol.ai_bias,
    news_direction: symbol.news_direction,
    fundamental_score: symbol.fundamental_score,
    news_score: symbol.news_score,
    news_confidence: symbol.news_confidence,
    risk_score: symbol.risk_score,
    valuation_risk: symbol.valuation_risk,
    event_type: symbol.event_type,
    impact_horizon: symbol.impact_horizon,
    risk_flags: symbol.risk_flags,
    source_count: symbol.source_count,
    one_sentence_reason: symbol.one_sentence_reason,
    manual_notes: null,
  }));
}

async function persistInitialPlan(
  supabase: Awaited<
    ReturnType<typeof import("@/lib/supabase/server").createClient>
  >,
  userId: string,
  portfolioId: string,
  profile: NonNullable<Awaited<ReturnType<typeof getUserProfile>>>,
  items: InitialRecommendationItem[],
  report: InitialRecommendationReport,
): Promise<MutationResult<MonthlyPlanWithItems>> {
  const initialAmount = resolveInitialInvestmentAmount(profile);
  const month = getCurrentMonthKey();

  const marketSnapshot = await refreshPortfolioMarket(supabase, [], {
    extraSymbols: items.map((item) => item.symbol),
  });

  const recommendations = computeInitialInvestmentRecommendations({
    profile,
    watchlist: [],
    items,
    technicalScores: marketSnapshot.technicalScores,
    holdings: [],
    initialInvestmentAmount: initialAmount,
    overallRiskLevel: report.overall_risk_level,
  });

  const planItems = recommendations
    .filter((candidate) => candidate.final_amount > 0 || candidate.manual_review_required)
    .map((candidate) => ({
      symbol: candidate.symbol,
      recommendation_score: candidate.final_score,
      technical_score: candidate.technical_score,
      news_modifier_score: candidate.news_modifier_score,
      risk_score: candidate.risk_score,
      concentration_flag: false,
      manual_review_required: candidate.manual_review_required,
      decision_basis: candidate.decision_basis,
      recommended_amount: candidate.final_amount,
      adjusted_amount: candidate.final_amount,
      reason: candidate.reason,
    }));

  const { data: existingPlan } = await supabase
    .from("monthly_plans")
    .select("id")
    .eq("portfolio_id", portfolioId)
    .eq("month", month)
    .eq("plan_kind", "initial")
    .maybeSingle();

  let planId = existingPlan?.id;

  if (planId) {
    const { error: updateError } = await supabase
      .from("monthly_plans")
      .update({
        monthly_amount: initialAmount,
        currency: profile.base_currency,
        status: "initial_recommendation",
      })
      .eq("id", planId)
      .eq("user_id", userId);

    if (updateError) {
      return { ok: false, error: updateError.message };
    }
  } else {
    const { data: insertedPlan, error: insertError } = await supabase
      .from("monthly_plans")
      .insert({
        user_id: userId,
        portfolio_id: portfolioId,
        month,
        monthly_amount: initialAmount,
        currency: profile.base_currency,
        status: "initial_recommendation",
        plan_kind: "initial",
      })
      .select("*")
      .single();

    if (insertError || !insertedPlan) {
      return {
        ok: false,
        error: insertError?.message ?? "Failed to create initial plan.",
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

  const { data: savedItems, error: itemsError } = await supabase
    .from("monthly_plan_items")
    .insert(
      planItems.map((item) => ({
        monthly_plan_id: planId,
        ...item,
      })),
    )
    .select("*")
    .order("recommended_amount", { ascending: false });

  if (itemsError || !savedItems) {
    return {
      ok: false,
      error: itemsError?.message ?? "Failed to save initial plan items.",
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
      error: planError?.message ?? "Failed to load initial plan.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/initial-recommendation");
  revalidatePath("/monthly-plan");

  return {
    ok: true,
    data: {
      plan,
      items: savedItems,
    },
  };
}

export async function saveInitialResearchAndGenerate(
  raw: unknown,
): Promise<
  MutationResult<{
    report: InitialRecommendationReport;
    items: InitialRecommendationItem[];
    plan: MonthlyPlanWithItems;
  }>
> {
  const auth = await requireAuthUser();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  let research: InitialInvestmentResearch;
  try {
    if (typeof raw === "string") {
      research = parseInitialResearchJson(raw);
    } else if (
      raw &&
      typeof raw === "object" &&
      "payload" in raw
    ) {
      research = saveInitialResearchSchema.parse(raw).payload;
    } else {
      research = parseInitialResearchJson(raw);
    }
  } catch (error) {
    if (error instanceof ZodError) {
      return { ok: false, error: error.issues[0]?.message ?? "Invalid JSON." };
    }
    if (error instanceof SyntaxError) {
      return { ok: false, error: "Invalid JSON format." };
    }
    return { ok: false, error: parseZodError(error) };
  }

  const [portfolio, profile] = await Promise.all([
    getUserPortfolio(auth.user.id),
    getUserProfile(),
  ]);

  if (!portfolio) {
    return { ok: false, error: "Portfolio not found." };
  }

  if (!profile) {
    return { ok: false, error: "Profile not found." };
  }

  const initialAmount = resolveInitialInvestmentAmount(profile);

  const { data: report, error: reportError } = await auth.supabase
    .from("initial_recommendation_reports")
    .insert({
      user_id: auth.user.id,
      portfolio_id: portfolio.id,
      report_date: research.report_date,
      report_type: research.report_type,
      user_currency: profile.base_currency,
      monthly_investment_amount: profile.monthly_investment_amount,
      initial_investment_amount: initialAmount,
      risk_profile: profile.risk_profile,
      time_horizon: profile.time_horizon,
      market_regime: research.market_regime,
      overall_risk_level: research.overall_risk_level,
      summary: research.summary,
      payload_jsonb: research,
    })
    .select("*")
    .single();

  if (reportError || !report) {
    return {
      ok: false,
      error: reportError?.message ?? "Failed to save research report.",
    };
  }

  const itemRows = buildItemRows(
    auth.user.id,
    portfolio.id,
    report.id,
    research,
  );

  const { data: items, error: itemsError } = await auth.supabase
    .from("initial_recommendation_items")
    .insert(itemRows)
    .select("*");

  if (itemsError || !items) {
    return {
      ok: false,
      error: itemsError?.message ?? "Failed to save research items.",
    };
  }

  const planResult = await persistInitialPlan(
    auth.supabase,
    auth.user.id,
    portfolio.id,
    profile,
    items,
    report,
  );

  if (!planResult.ok) {
    return planResult;
  }

  return {
    ok: true,
    data: {
      report,
      items,
      plan: planResult.data,
    },
  };
}

export async function getLatestInitialRecommendationReport(): Promise<{
  report: InitialRecommendationReport;
  items: InitialRecommendationItem[];
} | null> {
  const auth = await requireAuthUser();
  if (!auth.ok) {
    return null;
  }

  const portfolio = await getUserPortfolio(auth.user.id);
  if (!portfolio) {
    return null;
  }

  const { data: report, error: reportError } = await auth.supabase
    .from("initial_recommendation_reports")
    .select("*")
    .eq("user_id", auth.user.id)
    .eq("portfolio_id", portfolio.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (reportError || !report) {
    return null;
  }

  const { data: items, error: itemsError } = await auth.supabase
    .from("initial_recommendation_items")
    .select("*")
    .eq("report_id", report.id)
    .order("symbol", { ascending: true });

  if (itemsError) {
    return null;
  }

  return {
    report,
    items: items ?? [],
  };
}

export async function getInitialPlan(): Promise<MonthlyPlanWithItems | null> {
  const auth = await requireAuthUser();
  if (!auth.ok) {
    return null;
  }

  const portfolio = await getUserPortfolio(auth.user.id);
  if (!portfolio) {
    return null;
  }

  const month = getCurrentMonthKey();

  const { data: plan, error: planError } = await auth.supabase
    .from("monthly_plans")
    .select("*")
    .eq("user_id", auth.user.id)
    .eq("portfolio_id", portfolio.id)
    .eq("month", month)
    .eq("plan_kind", "initial")
    .maybeSingle();

  if (planError || !plan) {
    return null;
  }

  const { data: items, error: itemsError } = await auth.supabase
    .from("monthly_plan_items")
    .select("*")
    .eq("monthly_plan_id", plan.id)
    .order("recommended_amount", { ascending: false });

  if (itemsError) {
    return null;
  }

  return {
    plan,
    items: items ?? [],
  };
}
