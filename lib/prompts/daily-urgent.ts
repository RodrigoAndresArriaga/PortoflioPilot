import { formatWatchlistLine } from "@/lib/prompts/format-watchlist";

export function buildDailyUrgentPrompt(symbols: string[]): string {
  if (symbols.length === 0) {
    return "";
  }

  const watchlist = formatWatchlistLine(symbols);

  return `Every weekday after U.S. market close, scan major market and company news for urgent events affecting this watchlist:

Watchlist:
${watchlist}

This is for a long-term investment dashboard, not day trading and not automatic trading.

Only report news that is urgent or materially relevant to long-term risk.

Urgent means:
- major index move
- Fed/rate shock
- inflation/jobs surprise
- earnings collapse
- fraud/lawsuit/regulation risk
- geopolitical shock
- sector crash
- major company-specific event
- material change to long-term investment thesis

If there is no urgent news, return only:
{
  "report_type": "daily_urgent_scan",
  "report_date": "YYYY-MM-DD",
  "urgent_news": false,
  "action_required": false,
  "summary": "No urgent market-moving news requiring frontend input today."
}
If there is urgent news, return valid JSON only:
{
  "report_type": "daily_urgent_scan",
  "report_date": "YYYY-MM-DD",
  "urgent_news": true,
  "action_required": true,
  "overall_risk_level": "low | medium | high",
  "market_regime": "bullish | neutral | bearish | volatile",
  "events": [
    {
      "symbol": "string",
      "asset_type": "ETF | stock",
      "event_type": "macro | earnings | regulation | lawsuit | product | sector | geopolitical | valuation | other",
      "news_direction": "positive | neutral | negative | mixed",
      "news_score": 0,
      "news_confidence": 0,
      "impact_horizon": "short_term | medium_term | long_term",
      "ai_bias": "hold | watch | reduce | avoid",
      "risk_flags": ["string"],
      "one_sentence_reason": "string",
      "source_count": 0
    }
  ],
  "frontend_input_required": true
}
Rules:
- Do not invent news.
- If evidence is weak, set confidence below 60.
- Prefer "watch" over "reduce" when uncertain.
- Do not recommend selling broad ETFs based on one headline.
- Do not output automatic trading instructions.`;
}
