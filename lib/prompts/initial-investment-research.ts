import { formatWatchlistLine } from "@/lib/prompts/format-watchlist";

type InitialInvestmentPromptInput = {
  currency: string;
  monthlyAmount: number;
  initialInvestmentAmount: number;
  riskProfile: string;
  timeHorizon: string;
  watchlist: string[];
};

export function buildInitialInvestmentResearchPrompt(
  input: InitialInvestmentPromptInput,
): string {
  if (input.watchlist.length === 0) {
    return "";
  }

  const watchlist = formatWatchlistLine(input.watchlist);

  return `You are producing an initial investment research report for a manual-only long-term investment dashboard called PortfolioPilot.

This is not day trading.
This is not automatic trading.
Do not give broker execution instructions.
Do not tell the user to trade immediately.
Do not recommend options, leverage, margin, or speculative short-term trades.

User profile:
- Preferred currency: ${input.currency}
- Initial investment amount: ${input.initialInvestmentAmount}
- Monthly recurring investment amount: ${input.monthlyAmount}
- Risk profile: ${input.riskProfile}
- Time horizon: ${input.timeHorizon}
- Investment status: not invested yet
- Watchlist/interests: ${watchlist}

Task:
Analyze the watchlist and produce structured initial investment research for a beginner/early portfolio. Focus on:
- broad ETF suitability
- diversification
- fundamental quality
- valuation risk
- current market/news risk
- concentration risk
- long-term fit
- whether each asset should be considered core, satellite, cash reserve, or avoid/manual review

Return valid JSON only.

Schema:
{
  "report_type": "initial_investment_research",
  "report_date": "YYYY-MM-DD",
  "market_regime": "bullish | neutral | bearish | volatile",
  "overall_risk_level": "low | medium | high",
  "summary": "string",
  "initial_investment_context": {
    "currency": "string",
    "initial_investment_amount": 0,
    "monthly_investment_amount": 0,
    "risk_profile": "conservative | balanced | growth | aggressive_growth",
    "time_horizon": "1_3_years | 3_5_years | 5_10_years | 10_plus_years"
  },
  "symbols": [
    {
      "symbol": "string",
      "asset_name": "string",
      "asset_type": "ETF | stock | cash | other",
      "suggested_role": "core | growth | satellite | cash_reserve | avoid | manual_review",
      "recommendation_direction": "consider | neutral | cautious | avoid",
      "ai_bias": "add | hold | watch | reduce | avoid",
      "news_direction": "positive | neutral | negative | mixed",
      "fundamental_score": 0,
      "news_score": 0,
      "news_confidence": 0,
      "risk_score": 0,
      "valuation_risk": "low | medium | high",
      "impact_horizon": "short_term | medium_term | long_term",
      "event_type": "macro | earnings | regulation | lawsuit | product | sector | geopolitical | valuation | other",
      "risk_flags": ["string"],
      "one_sentence_reason": "string",
      "source_count": 0
    }
  ],
  "frontend_input_required": true
}

Rules:
- If evidence is weak, set news_confidence below 60.
- Prefer broad ETFs for core exposure.
- Individual stocks should be treated as satellite positions.
- Do not recommend putting the entire initial investment into one stock.
- Use "watch" or "manual_review" when uncertain.
- Do not recommend automatic selling.
- Do not invent news.`;
}
