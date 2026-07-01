"use server";

import { allocateMonthlyBudget } from "@/lib/engine/final-position-sizing";
import type { RecommendationCandidate } from "@/lib/engine/types";
import { onboardingPayloadSchema } from "@/lib/validation/onboarding";
import type { Profile } from "@/types/database";
import type { Holding, WatchlistItem } from "@/types/database";

export type OnboardingPreviewResult =
  | { ok: true; data: RecommendationCandidate[] }
  | { ok: false; error: string };

function buildPreviewProfile(
  payload: ReturnType<typeof onboardingPayloadSchema.parse>,
): Profile {
  return {
    id: "preview",
    full_name: null,
    base_currency: payload.base_currency,
    monthly_investment_amount: payload.monthly_investment_amount,
    investment_day: payload.investment_day,
    risk_profile: payload.risk_profile,
    time_horizon: payload.time_horizon,
    broad_etf_priority: true,
    cash_reserve_percent: 5,
    max_individual_stock_percent: 15,
    onboarding_completed: false,
    email_alerts_enabled: true,
    email_monthly_plan_ready: true,
    email_urgent_risk: true,
    email_weekly_summary: true,
    email_investment_reminder: true,
    email_concentration_warning: true,
    email_manual_review: true,
    created_at: "",
    updated_at: "",
  };
}

function buildPreviewHoldings(
  payload: ReturnType<typeof onboardingPayloadSchema.parse>,
): Holding[] {
  return payload.holdings.map((holding, index) => ({
    id: `preview-${index}`,
    user_id: "preview",
    portfolio_id: "preview",
    symbol: holding.symbol.trim().toUpperCase(),
    asset_name: holding.asset_name?.trim() || null,
    asset_type: holding.asset_type,
    currency: holding.currency,
    shares: holding.shares ?? null,
    current_value: holding.current_value ?? 0,
    last_price: null,
    last_price_at: null,
    price_source: null,
    cost_basis: holding.cost_basis ?? null,
    broker: holding.broker?.trim() || null,
    created_at: "",
    updated_at: "",
  }));
}

function buildPreviewWatchlist(
  payload: ReturnType<typeof onboardingPayloadSchema.parse>,
): WatchlistItem[] {
  return payload.watchlist.map((item, index) => ({
    id: `preview-wl-${index}`,
    user_id: "preview",
    symbol: item.symbol.trim().toUpperCase(),
    asset_name: item.asset_name?.trim() || null,
    asset_type: item.asset_type ?? null,
    bucket: item.bucket ?? null,
    enabled: true,
    sort_order: item.sort_order ?? index,
    created_at: "",
    updated_at: "",
  }));
}

// read-only recommendation preview for onboarding
export async function previewOnboardingRecommendations(
  raw: unknown,
): Promise<OnboardingPreviewResult> {
  let payload;
  try {
    payload = onboardingPayloadSchema.parse(raw);
  } catch {
    return { ok: false, error: "Complete all prior steps before previewing." };
  }

  const profile = buildPreviewProfile(payload);
  const holdings = buildPreviewHoldings(payload);
  const watchlist = buildPreviewWatchlist(payload);

  const recommendations = allocateMonthlyBudget({
    profile,
    holdings,
    watchlist,
    newsSignals: [],
    technicalScores: [],
    monthlyAmount: profile.monthly_investment_amount,
  });

  return {
    ok: true,
    data: recommendations.filter((candidate) => candidate.recommended_amount > 0),
  };
}
