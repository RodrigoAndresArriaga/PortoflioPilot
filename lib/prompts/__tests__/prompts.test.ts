import { describe, expect, it } from "vitest";

import { buildDailyUrgentPrompt } from "@/lib/prompts/daily-urgent";
import { formatWatchlistLine } from "@/lib/prompts/format-watchlist";
import { buildMonthlyReviewPrompt } from "@/lib/prompts/monthly-review";
import { buildInitialInvestmentResearchPrompt } from "@/lib/prompts/initial-investment-research";
import { buildWeeklyReviewPrompt } from "@/lib/prompts/weekly-review";

const sampleSymbols = ["VOO", "NVDA", "MSFT"];

describe("formatWatchlistLine", () => {
  it("joins symbols with comma separators", () => {
    expect(formatWatchlistLine(sampleSymbols)).toBe("VOO, NVDA, MSFT");
  });
});

describe("buildDailyUrgentPrompt", () => {
  it("returns empty string when watchlist is empty", () => {
    expect(buildDailyUrgentPrompt([])).toBe("");
  });

  it("injects watchlist symbols and daily report schema", () => {
    const prompt = buildDailyUrgentPrompt(sampleSymbols);

    expect(prompt).toContain("Watchlist:\nVOO, NVDA, MSFT");
    expect(prompt).toContain('"report_type": "daily_urgent_scan"');
    expect(prompt).toContain("Do not output automatic trading instructions.");
  });
});

describe("buildInitialInvestmentResearchPrompt", () => {
  it("returns empty string when watchlist is empty", () => {
    expect(
      buildInitialInvestmentResearchPrompt({
        currency: "MXN",
        monthlyAmount: 4000,
        initialInvestmentAmount: 4000,
        riskProfile: "growth",
        timeHorizon: "10_plus_years",
        watchlist: [],
      }),
    ).toBe("");
  });

  it("includes watchlist and investment amounts", () => {
    const prompt = buildInitialInvestmentResearchPrompt({
      currency: "MXN",
      monthlyAmount: 4000,
      initialInvestmentAmount: 8000,
      riskProfile: "growth",
      timeHorizon: "10_plus_years",
      watchlist: sampleSymbols,
    });

    expect(prompt).toContain("Initial investment amount: 8000");
    expect(prompt).toContain("Monthly recurring investment amount: 4000");
    expect(prompt).toContain("VOO, NVDA, MSFT");
    expect(prompt).toContain('"report_type": "initial_investment_research"');
  });
});

describe("buildWeeklyReviewPrompt", () => {
  it("returns empty string when watchlist is empty", () => {
    expect(buildWeeklyReviewPrompt([])).toBe("");
  });

  it("injects watchlist symbols and weekly report schema", () => {
    const prompt = buildWeeklyReviewPrompt(sampleSymbols);

    expect(prompt).toContain("Watchlist:\nVOO, NVDA, MSFT");
    expect(prompt).toContain('"report_type": "weekly_market_review"');
    expect(prompt).toContain("Do not produce trade instructions.");
  });
});

describe("buildMonthlyReviewPrompt", () => {
  it("returns empty string when watchlist is empty", () => {
    expect(buildMonthlyReviewPrompt([])).toBe("");
  });

  it("injects watchlist symbols and monthly report schema", () => {
    const prompt = buildMonthlyReviewPrompt(sampleSymbols);

    expect(prompt).toContain("Watchlist:\nVOO, NVDA, MSFT");
    expect(prompt).toContain('"report_type": "monthly_allocation_review"');
    expect(prompt).toContain("The user manually trades.");
  });
});
