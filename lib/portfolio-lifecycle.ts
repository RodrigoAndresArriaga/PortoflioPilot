import type { InvestmentStatus } from "@/types/database";

export type PortfolioLifecycleStage =
  | "initial_setup"
  | "initial_plan_ready"
  | "ready_for_first_monthly"
  | "monthly_active"
  | "regular";

export type PortfolioLifecycleInput = {
  investmentStatus: InvestmentStatus;
  setupAttentionDismissed: boolean;
  holdingsCount: number;
  investableHoldingsCount: number;
  hasInitialPlan: boolean;
  hasMonthlyPlan: boolean;
  hasWeeklyNews: boolean;
  watchlistCount: number;
};

export type TransitionAttentionContext = {
  shouldShow: boolean;
  hasInitialPlan: boolean;
  hasHoldings: boolean;
  hasMonthlyPlan: boolean;
};

export type MonthlyPlanReadiness = {
  canGenerate: boolean;
  blockingReason: string | null;
  hasWeeklyNews: boolean;
  usesNeutralNewsDefaults: boolean;
  holdingsCount: number;
  watchlistCount: number;
};

export type PortfolioLifecycleState = {
  stage: PortfolioLifecycleStage;
  transition: TransitionAttentionContext;
  monthlyPlanReadiness: MonthlyPlanReadiness;
};

// derive lifecycle stage from profile, plans, and holdings
export function computePortfolioLifecycleStage(
  input: PortfolioLifecycleInput,
): PortfolioLifecycleStage {
  const {
    investmentStatus,
    holdingsCount,
    hasInitialPlan,
    hasMonthlyPlan,
  } = input;

  if (hasMonthlyPlan) {
    return "monthly_active";
  }

  if (holdingsCount === 0) {
    if (hasInitialPlan) {
      return "initial_plan_ready";
    }
    if (
      investmentStatus === "not_invested_yet" ||
      investmentStatus === "unknown"
    ) {
      return "initial_setup";
    }
    return "initial_setup";
  }

  if (hasInitialPlan || investmentStatus === "not_invested_yet") {
    return "ready_for_first_monthly";
  }

  return "regular";
}

export function getTransitionAttentionContext(
  input: PortfolioLifecycleInput,
  transitionDismissed = false,
): TransitionAttentionContext {
  const stage = computePortfolioLifecycleStage(input);
  const hasHoldings = input.holdingsCount > 0;

  const shouldShow =
    stage === "ready_for_first_monthly" &&
    hasHoldings &&
    !input.hasMonthlyPlan &&
    !transitionDismissed;

  return {
    shouldShow,
    hasInitialPlan: input.hasInitialPlan,
    hasHoldings,
    hasMonthlyPlan: input.hasMonthlyPlan,
  };
}

// check whether a regular monthly plan can be generated
export function checkMonthlyPlanReadiness(input: {
  holdingsCount: number;
  investableHoldingsCount: number;
  watchlistCount: number;
  hasWeeklyNews: boolean;
}): MonthlyPlanReadiness {
  const canGenerate =
    input.investableHoldingsCount > 0 || input.watchlistCount > 0;

  return {
    canGenerate,
    blockingReason: canGenerate
      ? null
      : "Add at least one holding or watchlist symbol before generating a plan.",
    hasWeeklyNews: input.hasWeeklyNews,
    usesNeutralNewsDefaults: !input.hasWeeklyNews,
    holdingsCount: input.holdingsCount,
    watchlistCount: input.watchlistCount,
  };
}

export function buildPortfolioLifecycleState(
  input: PortfolioLifecycleInput,
  transitionDismissed = false,
): PortfolioLifecycleState {
  const stage = computePortfolioLifecycleStage(input);
  const transition = getTransitionAttentionContext(input, transitionDismissed);
  const monthlyPlanReadiness = checkMonthlyPlanReadiness({
    holdingsCount: input.holdingsCount,
    investableHoldingsCount: input.investableHoldingsCount,
    watchlistCount: input.watchlistCount,
    hasWeeklyNews: input.hasWeeklyNews,
  });

  return {
    stage,
    transition,
    monthlyPlanReadiness,
  };
}
