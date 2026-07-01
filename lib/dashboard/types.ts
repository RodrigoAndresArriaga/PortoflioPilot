import type { AllocationStatus } from "@/lib/engine/types";
import type {
  AllocationMode,
  MonthlyPlanWithItems,
  Profile,
  WatchlistItem,
} from "@/types/database";

export type AllocationSlice = {
  key: string;
  label: string;
  percent: number;
};

export type DriftRow = {
  key: string;
  label: string;
  currentPercent: number;
  targetPercent: number;
  driftPercent: number;
  status: AllocationStatus;
};

export type DashboardAllocationView = {
  mode: AllocationMode;
  currentSlices: AllocationSlice[];
  targetSlices: AllocationSlice[];
  driftRows: DriftRow[];
};

export type DashboardData = {
  profile: Profile;
  totalPortfolioValue: number;
  nextInvestmentDate: string;
  allocation: DashboardAllocationView;
  monthlyPlan: MonthlyPlanWithItems | null;
  watchlist: WatchlistItem[];
};
