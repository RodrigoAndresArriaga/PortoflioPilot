import { formatWatchlistLine } from "@/lib/prompts/format-watchlist";

export function buildWeeklyReviewPrompt(symbols: string[]): string {
  if (symbols.length === 0) {
    return "";
  }

  const watchlist = formatWatchlistLine(symbols);

  return `Every Friday after U.S. market close, produce a weekly market review for this long-term investment dashboard.

Watchlist:
${watchlist}

Return valid JSON only.
{
  "report_type": "weekly_market_review",
  "week_ending": "YYYY-MM-DD",
  "market_regime": "bullish | neutral | bearish | volatile",
  "overall_risk_level": "low | medium | high",
  "weekly_summary": "string",
  "next_week_bias": "normal | cautious | defensive",
  "major_events": ["string"],
  "symbols_to_watch": [
    {
      "symbol": "string",
      "reason": "string",
      "risk_level": "low | medium | high",
      "suggested_frontend_status": "normal | watch | reduce_new_buys | manual_review"
    }
  ],
  "frontend_input_recommended": true
}
Rules:
- Focus on meaningful weekly changes, not noise.
- Do not produce trade instructions.
- Output risk context only.`;
}
