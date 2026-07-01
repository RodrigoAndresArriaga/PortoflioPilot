import { buildDashboardAllocationView, computeTotalPortfolioValue } from "@/lib/dashboard/allocation";
import {
  computeNextInvestmentDate,
  formatInvestmentDate,
} from "@/lib/dashboard/dates";
import type { DashboardData } from "@/lib/dashboard/types";
import { getHoldings } from "@/lib/server/holdings";
import {
  getCurrentMonthKey,
  getMonthlyPlan,
} from "@/lib/server/monthly-plans";
import { requireCurrentUserProfile } from "@/lib/server/profile";
import { getTargetAllocations } from "@/lib/server/targets";
import { getWatchlist } from "@/lib/server/watchlist";
import type { AllocationMode } from "@/types/database";

// aggregate read-only dashboard snapshot
export async function getDashboardData(): Promise<DashboardData> {
  const [profile, holdingsResult, targets, watchlistResult, monthlyPlan] =
    await Promise.all([
      requireCurrentUserProfile(),
      getHoldings(),
      getTargetAllocations(),
      getWatchlist(),
      getMonthlyPlan(getCurrentMonthKey()),
    ]);

  const holdings = holdingsResult ?? [];
  const watchlist = watchlistResult ?? [];
  const totalPortfolioValue = computeTotalPortfolioValue(holdings);

  const allocationMode: AllocationMode = targets?.allocation_mode ?? "bucket";
  const allocation = targets
    ? buildDashboardAllocationView(holdings, targets)
    : {
        mode: allocationMode,
        currentSlices: [],
        targetSlices: [],
        driftRows: [],
      };

  const nextInvestmentDate = formatInvestmentDate(
    computeNextInvestmentDate(profile.investment_day),
  );

  return {
    profile,
    totalPortfolioValue,
    nextInvestmentDate,
    allocation,
    monthlyPlan,
    watchlist,
  };
}
