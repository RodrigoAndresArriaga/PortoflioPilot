export const MANUAL_TRADING_DISCLAIMER =
  "Review and manually place trades in your brokerage account. PortfolioPilot does not execute trades.";

export const EMAIL_ALERT_TYPES = [
  "monthly_plan_ready",
  "urgent_risk",
  "weekly_summary",
  "investment_reminder",
  "concentration_warning",
  "manual_review",
] as const;

export type EmailAlertType = (typeof EMAIL_ALERT_TYPES)[number];
