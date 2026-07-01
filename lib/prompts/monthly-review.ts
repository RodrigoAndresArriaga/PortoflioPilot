import { formatWatchlistLine } from "@/lib/prompts/format-watchlist";

export function buildMonthlyReviewPrompt(symbols: string[]): string {
  if (symbols.length === 0) {
    return "";
  }

  const watchlist = formatWatchlistLine(symbols);

  return `On the last trading day of every month, produce a monthly allocation-support report for my long-term investment dashboard.

Watchlist:
${watchlist}

Purpose:
This report will be manually entered into the frontend. The frontend will calculate exact monthly buy amounts. The user manually trades.

Return valid JSON only.
{
  "report_type": "monthly_allocation_review",
  "report_month": "YYYY-MM",
  "market_regime": "bullish | neutral | bearish | volatile",
  "overall_risk_level": "low | medium | high",
  "monthly_summary": "string",
  "allocation_bias": "normal | cautious | defensive | risk_on",
  "symbols": [
    {
      "symbol": "string",
      "asset_type": "ETF | stock",
      "news_direction": "positive | neutral | negative | mixed",
      "news_score": 0,
      "news_confidence": 0,
      "impact_horizon": "short_term | medium_term | long_term",
      "event_type": "macro | earnings | regulation | lawsuit | product | sector | geopolitical | valuation | other",
      "risk_flags": ["string"],
      "ai_bias": "add | hold | watch | reduce | avoid",
      "one_sentence_reason": "string",
      "source_count": 0
    }
  ],
  "frontend_input_required": true
}
Rules:
- This is for monthly long-term allocation, not short-term trading.
- Do not invent news.
- If a symbol has no meaningful news, mark it neutral.
- Do not recommend selling long-term ETFs from isolated headlines.
- Use "reduce" only for material risk.
- Prefer "watch" when uncertain.`;
}
