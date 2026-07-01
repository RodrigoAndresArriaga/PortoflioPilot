import type {
  DailyUrgentScanReport,
  MonthlyAllocationReviewReport,
  WeeklyMarketReviewReport,
} from "@/lib/validation/news-input";

export const dailyNoUrgentFixture = {
  report_type: "daily_urgent_scan",
  report_date: "2026-07-01",
  urgent_news: false,
  action_required: false,
  summary: "No urgent market-moving news requiring frontend input today.",
} satisfies DailyUrgentScanReport;

export const dailyUrgentFixture = {
  report_type: "daily_urgent_scan",
  report_date: "2026-07-01",
  urgent_news: true,
  action_required: true,
  overall_risk_level: "high",
  market_regime: "volatile",
  events: [
    {
      symbol: "NVDA",
      asset_type: "stock",
      event_type: "earnings",
      news_direction: "negative",
      news_score: 35,
      news_confidence: 72,
      impact_horizon: "short_term",
      ai_bias: "watch",
      risk_flags: ["earnings_miss"],
      one_sentence_reason: "Guidance cut raises near-term risk.",
      source_count: 3,
    },
  ],
  frontend_input_required: true,
} satisfies DailyUrgentScanReport;

export const weeklyReviewFixture = {
  report_type: "weekly_market_review",
  week_ending: "2026-06-27",
  market_regime: "neutral",
  overall_risk_level: "medium",
  weekly_summary: "Markets were range-bound with tech leadership fading.",
  next_week_bias: "cautious",
  major_events: ["Fed speakers emphasized data dependence"],
  symbols_to_watch: [
    {
      symbol: "QQQ",
      reason: "Momentum cooled after multi-week rally.",
      risk_level: "medium",
      suggested_frontend_status: "watch",
    },
  ],
  frontend_input_recommended: true,
} satisfies WeeklyMarketReviewReport;

export const monthlyReviewFixture = {
  report_type: "monthly_allocation_review",
  report_month: "2026-07",
  market_regime: "bullish",
  overall_risk_level: "low",
  monthly_summary: "Broad indices held gains; growth outperformed.",
  allocation_bias: "normal",
  symbols: [
    {
      symbol: "VOO",
      asset_type: "ETF",
      news_direction: "positive",
      news_score: 68,
      news_confidence: 74,
      impact_horizon: "long_term",
      event_type: "macro",
      risk_flags: [],
      ai_bias: "add",
      one_sentence_reason: "Broad market trend remains constructive.",
      source_count: 2,
    },
    {
      symbol: "NVDA",
      asset_type: "stock",
      news_direction: "mixed",
      news_score: 55,
      news_confidence: 62,
      impact_horizon: "medium_term",
      event_type: "valuation",
      risk_flags: ["valuation_stretch"],
      ai_bias: "watch",
      one_sentence_reason: "Strong fundamentals but elevated valuation.",
      source_count: 4,
    },
  ],
  frontend_input_required: true,
} satisfies MonthlyAllocationReviewReport;
