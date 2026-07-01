import type { PortfolioWarning } from "@/lib/engine/concentration";
import type { RecommendationCandidate } from "@/lib/engine/types";
import type {
  MonthlyPlanWithItems,
  Profile,
  WatchlistItem,
} from "@/types/database";

export type AllocationSlice = {
  key: string;
  label: string;
  percent: number;
};

export type DashboardExposureView = {
  currentSlices: AllocationSlice[];
};

export type DashboardData = {
  profile: Profile;
  totalPortfolioValue: number;
  nextInvestmentDate: string;
  exposure: DashboardExposureView;
  topRecommendations: RecommendationCandidate[];
  monthlyPlan: MonthlyPlanWithItems | null;
  watchlist: WatchlistItem[];
  warnings: PortfolioWarning[];
  blockedBuySymbols: string[];
};
