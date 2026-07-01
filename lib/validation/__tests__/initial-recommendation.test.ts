import { describe, expect, it } from "vitest";

import {
  initialInvestmentResearchSchema,
  parseInitialResearchJson,
} from "@/lib/validation/initial-recommendation";

const validResearch = {
  report_type: "initial_investment_research",
  report_date: "2026-07-01",
  market_regime: "neutral",
  overall_risk_level: "medium",
  summary: "Balanced initial portfolio research for a beginner.",
  initial_investment_context: {
    currency: "MXN",
    initial_investment_amount: 4000,
    monthly_investment_amount: 4000,
    risk_profile: "growth",
    time_horizon: "10_plus_years",
  },
  symbols: [
    {
      symbol: "VOO",
      asset_name: "Vanguard S&P 500 ETF",
      asset_type: "ETF",
      suggested_role: "core",
      recommendation_direction: "consider",
      ai_bias: "add",
      news_direction: "neutral",
      fundamental_score: 80,
      news_score: 65,
      news_confidence: 70,
      risk_score: 35,
      valuation_risk: "medium",
      impact_horizon: "long_term",
      event_type: "macro",
      risk_flags: [],
      one_sentence_reason: "Broad U.S. equity exposure suitable as a core holding.",
      source_count: 2,
    },
  ],
  frontend_input_required: true,
};

describe("initialInvestmentResearchSchema", () => {
  it("parses valid initial research JSON", () => {
    const parsed = initialInvestmentResearchSchema.parse(validResearch);
    expect(parsed.symbols).toHaveLength(1);
    expect(parsed.symbols[0]?.symbol).toBe("VOO");
  });

  it("rejects invalid JSON shape", () => {
    const result = initialInvestmentResearchSchema.safeParse({
      ...validResearch,
      report_type: "weekly_market_review",
    });

    expect(result.success).toBe(false);
  });

  it("parseInitialResearchJson accepts JSON strings", () => {
    const parsed = parseInitialResearchJson(JSON.stringify(validResearch));
    expect(parsed.summary).toContain("Balanced initial portfolio");
  });
});
