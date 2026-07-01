import { describe, expect, it } from "vitest";

import {
  buildPortfolioLifecycleState,
  checkMonthlyPlanReadiness,
  computePortfolioLifecycleStage,
  getTransitionAttentionContext,
} from "@/lib/portfolio-lifecycle";

const baseInput = {
  investmentStatus: "not_invested_yet" as const,
  setupAttentionDismissed: false,
  holdingsCount: 0,
  investableHoldingsCount: 0,
  hasInitialPlan: false,
  hasMonthlyPlan: false,
  hasWeeklyNews: false,
  watchlistCount: 3,
};

describe("computePortfolioLifecycleStage", () => {
  it("returns initial_setup when not invested with no plan", () => {
    expect(computePortfolioLifecycleStage(baseInput)).toBe("initial_setup");
  });

  it("returns initial_plan_ready when initial plan exists but no holdings", () => {
    expect(
      computePortfolioLifecycleStage({
        ...baseInput,
        hasInitialPlan: true,
      }),
    ).toBe("initial_plan_ready");
  });

  it("returns ready_for_first_monthly after initial plan and holdings", () => {
    expect(
      computePortfolioLifecycleStage({
        ...baseInput,
        hasInitialPlan: true,
        holdingsCount: 2,
        investableHoldingsCount: 2,
      }),
    ).toBe("ready_for_first_monthly");
  });

  it("returns monthly_active when a monthly plan exists", () => {
    expect(
      computePortfolioLifecycleStage({
        ...baseInput,
        hasMonthlyPlan: true,
        holdingsCount: 2,
        investableHoldingsCount: 2,
      }),
    ).toBe("monthly_active");
  });
});

describe("getTransitionAttentionContext", () => {
  it("shows transition banner when ready for first monthly plan", () => {
    const context = getTransitionAttentionContext({
      ...baseInput,
      hasInitialPlan: true,
      holdingsCount: 2,
      investableHoldingsCount: 2,
    });

    expect(context.shouldShow).toBe(true);
  });

  it("hides transition banner when monthly plan exists", () => {
    const context = getTransitionAttentionContext({
      ...baseInput,
      hasInitialPlan: true,
      hasMonthlyPlan: true,
      holdingsCount: 2,
      investableHoldingsCount: 2,
    });

    expect(context.shouldShow).toBe(false);
  });
});

describe("checkMonthlyPlanReadiness", () => {
  it("allows generation with holdings even without weekly news", () => {
    const readiness = checkMonthlyPlanReadiness({
      holdingsCount: 2,
      investableHoldingsCount: 2,
      watchlistCount: 0,
      hasWeeklyNews: false,
    });

    expect(readiness.canGenerate).toBe(true);
    expect(readiness.usesNeutralNewsDefaults).toBe(true);
    expect(readiness.blockingReason).toBeNull();
  });

  it("blocks generation when no holdings or watchlist", () => {
    const readiness = checkMonthlyPlanReadiness({
      holdingsCount: 0,
      investableHoldingsCount: 0,
      watchlistCount: 0,
      hasWeeklyNews: true,
    });

    expect(readiness.canGenerate).toBe(false);
    expect(readiness.blockingReason).toContain("holding or watchlist");
  });

  it("allows generation with watchlist only", () => {
    const readiness = checkMonthlyPlanReadiness({
      holdingsCount: 0,
      investableHoldingsCount: 0,
      watchlistCount: 2,
      hasWeeklyNews: false,
    });

    expect(readiness.canGenerate).toBe(true);
  });
});

describe("buildPortfolioLifecycleState", () => {
  it("combines stage, transition, and readiness", () => {
    const state = buildPortfolioLifecycleState({
      ...baseInput,
      hasInitialPlan: true,
      holdingsCount: 1,
      investableHoldingsCount: 1,
    });

    expect(state.stage).toBe("ready_for_first_monthly");
    expect(state.transition.shouldShow).toBe(true);
    expect(state.monthlyPlanReadiness.canGenerate).toBe(true);
  });
});
