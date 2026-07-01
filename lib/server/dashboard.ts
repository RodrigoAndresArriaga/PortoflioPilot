import { buildDashboardExposureView, computeTotalPortfolioValue } from "@/lib/dashboard/allocation";
import {
  computeNextInvestmentDate,
  formatInvestmentDate,
} from "@/lib/dashboard/dates";
import type { DashboardData } from "@/lib/dashboard/types";
import { computeRecommendations } from "@/lib/engine/recommendation-engine";
import { newsInputsToSignals } from "@/lib/engine/news-signals";
import {
  detectPortfolioWarnings,
  getBlockedBuySymbols,
} from "@/lib/engine/concentration";
import {
  getHoldingsWithFreshPrices,
  getMarketContext,
} from "@/lib/server/market-data/with-fresh-holdings";
import {
  getCurrentMonthKey,
  getMonthlyPlan,
} from "@/lib/server/monthly-plans";
import { getLatestNewsReport } from "@/lib/server/news-inputs";
import { requireCurrentUserProfile } from "@/lib/server/profile";
import { getWatchlist } from "@/lib/server/watchlist";

// aggregate read-only dashboard snapshot
export async function getDashboardData(): Promise<DashboardData> {
  const [profile, holdingsResult, watchlistResult, monthlyPlan, marketSnapshot, weeklyNews] =
    await Promise.all([
      requireCurrentUserProfile(),
      getHoldingsWithFreshPrices(),
      getWatchlist(),
      getMonthlyPlan(getCurrentMonthKey()),
      getMarketContext({ refreshIfStale: true }),
      getLatestNewsReport("weekly_market_review"),
    ]);

  const holdings = holdingsResult ?? [];
  const watchlist = watchlistResult ?? [];
  const totalPortfolioValue = computeTotalPortfolioValue(holdings);
  const exposure = buildDashboardExposureView(holdings);

  const newsSignals = weeklyNews
    ? newsInputsToSignals(weeklyNews.children)
    : [];

  const recommendations = computeRecommendations({
    profile,
    holdings,
    watchlist,
    newsSignals,
    technicalScores: marketSnapshot?.technicalScores ?? [],
  });

  const topRecommendations = recommendations
    .filter((candidate) => !candidate.blocked)
    .slice(0, 5);

  const nextInvestmentDate = formatInvestmentDate(
    computeNextInvestmentDate(profile.investment_day),
  );

  const warnings = detectPortfolioWarnings(
    holdings.map((holding) => ({
      symbol: holding.symbol,
      asset_type: holding.asset_type,
      current_value: holding.current_value,
    })),
  );
  const blockedBuySymbols = Array.from(getBlockedBuySymbols(warnings));

  return {
    profile,
    totalPortfolioValue,
    nextInvestmentDate,
    exposure,
    topRecommendations,
    monthlyPlan,
    watchlist,
    warnings,
    blockedBuySymbols,
  };
}
