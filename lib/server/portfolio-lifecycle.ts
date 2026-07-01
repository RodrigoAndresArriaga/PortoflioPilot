"use server";

import { buildPortfolioLifecycleState } from "@/lib/portfolio-lifecycle";
import type { PortfolioLifecycleState } from "@/lib/portfolio-lifecycle";
import { getSetupAttentionContext } from "@/lib/setup-attention";
import { getInitialPlan } from "@/lib/server/initial-recommendations";
import { getCurrentMonthKey, getMonthlyPlan } from "@/lib/server/monthly-plans";
import { getLatestNewsReport } from "@/lib/server/news-inputs";
import { requireCurrentUserProfile } from "@/lib/server/profile";
import { getWatchlist } from "@/lib/server/watchlist";
import { createClient } from "@/lib/supabase/server";
import type { InvestmentStatus } from "@/types/database";

export type PortfolioLifecycleSnapshot = PortfolioLifecycleState & {
  setupAttention: ReturnType<typeof getSetupAttentionContext>;
  holdingsCount: number;
};

function normalizeInvestmentStatus(status: string): InvestmentStatus {
  if (
    status === "not_invested_yet" ||
    status === "has_investments" ||
    status === "unknown"
  ) {
    return status;
  }
  return "unknown";
}

async function countHoldings(userId: string): Promise<{
  total: number;
  investable: number;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("holdings")
    .select("asset_type")
    .eq("user_id", userId);

  if (error) {
    return { total: 0, investable: 0 };
  }

  const rows = data ?? [];
  return {
    total: rows.length,
    investable: rows.filter((row) => row.asset_type !== "cash").length,
  };
}

// load profile, plans, holdings, and news for lifecycle UI
export async function getPortfolioLifecycleSnapshot(): Promise<PortfolioLifecycleSnapshot | null> {
  const profile = await requireCurrentUserProfile();
  if (!profile.onboarding_completed) {
    return null;
  }

  const month = getCurrentMonthKey();

  const [holdingsCounts, initialPlan, monthlyPlan, watchlist, weeklyNews] =
    await Promise.all([
      countHoldings(profile.id),
      getInitialPlan(),
      getMonthlyPlan(month),
      getWatchlist(),
      getLatestNewsReport("weekly_market_review"),
    ]);

  const watchlistItems = watchlist ?? [];
  const lifecycleInput = {
    investmentStatus: normalizeInvestmentStatus(profile.investment_status),
    setupAttentionDismissed: profile.setup_attention_dismissed,
    holdingsCount: holdingsCounts.total,
    investableHoldingsCount: holdingsCounts.investable,
    hasInitialPlan: initialPlan !== null,
    hasMonthlyPlan: monthlyPlan !== null,
    hasWeeklyNews: weeklyNews !== null,
    watchlistCount: watchlistItems.filter((item) => item.enabled).length,
  };

  const lifecycle = buildPortfolioLifecycleState(lifecycleInput);
  const setupAttention = getSetupAttentionContext(profile, holdingsCounts.total);

  return {
    ...lifecycle,
    setupAttention,
    holdingsCount: holdingsCounts.total,
  };
}
