import type { PortfolioWarning } from "@/lib/engine/concentration";
import type { EmailAlertType } from "@/lib/email/constants";
import {
  sendConcentrationWarningEmail,
  sendManualReviewRequiredEmail,
  sendMonthlyInvestmentReminderEmail,
  sendMonthlyPlanReadyEmail,
  sendUrgentRiskWarningEmail,
  sendWeeklyRiskSummaryEmail,
  type SendResult,
} from "@/lib/email/send";
import { computeMonthlyPlanSummary } from "@/lib/monthly-plan/summary";
import { isCashSymbol } from "@/lib/monthly-plan/format";
import { getCurrentMonthKey } from "@/lib/server/monthly-plan-generation";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isAlertTypeEnabled,
  type EmailPreferencesInput,
} from "@/lib/validation/email-preferences";
import type {
  DailyUrgentScanReport,
  WeeklyMarketReviewReport,
} from "@/lib/validation/news-input";
import type { ManualNewsInput, MonthlyPlanWithItems, Profile } from "@/types/database";

type PreferenceKey = Exclude<
  keyof EmailPreferencesInput,
  "email_alerts_enabled"
>;

const ALERT_PREFERENCE_MAP: Record<EmailAlertType, PreferenceKey> = {
  monthly_plan_ready: "email_monthly_plan_ready",
  urgent_risk: "email_urgent_risk",
  weekly_summary: "email_weekly_summary",
  investment_reminder: "email_investment_reminder",
  concentration_warning: "email_concentration_warning",
  manual_review: "email_manual_review",
};

async function loadEmailPreferences(
  userId: string,
): Promise<EmailPreferencesInput | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "email_alerts_enabled, email_monthly_plan_ready, email_urgent_risk, email_weekly_summary, email_investment_reminder, email_concentration_warning, email_manual_review",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as EmailPreferencesInput;
}

async function resolveRecipientEmail(userId: string): Promise<string | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.getUserById(userId);

  if (error || !data.user?.email) {
    return null;
  }

  return data.user.email;
}

async function hasNotificationBeenSent(
  userId: string,
  alertType: EmailAlertType,
  dedupKey: string,
): Promise<boolean> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("email_notification_log")
    .select("id")
    .eq("user_id", userId)
    .eq("alert_type", alertType)
    .eq("dedup_key", dedupKey)
    .maybeSingle();

  if (error) {
    console.error("[email] Failed to read notification log:", error.message);
    return false;
  }

  return Boolean(data);
}

async function recordNotificationSent(
  userId: string,
  alertType: EmailAlertType,
  dedupKey: string,
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("email_notification_log").insert({
    user_id: userId,
    alert_type: alertType,
    dedup_key: dedupKey,
  });

  if (error) {
    console.error("[email] Failed to write notification log:", error.message);
  }
}

async function shouldSendAlert(
  userId: string,
  alertType: EmailAlertType,
  dedupKey?: string,
): Promise<{ send: boolean; to: string | null; preferences: EmailPreferencesInput | null }> {
  const [preferences, to] = await Promise.all([
    loadEmailPreferences(userId),
    resolveRecipientEmail(userId),
  ]);

  if (!preferences || !to) {
    return { send: false, to, preferences };
  }

  const preferenceKey = ALERT_PREFERENCE_MAP[alertType];
  if (!isAlertTypeEnabled(preferences, preferenceKey)) {
    return { send: false, to, preferences };
  }

  if (dedupKey) {
    const alreadySent = await hasNotificationBeenSent(userId, alertType, dedupKey);
    if (alreadySent) {
      return { send: false, to, preferences };
    }
  }

  return { send: true, to, preferences };
}

async function finalizeSend(
  userId: string,
  alertType: EmailAlertType,
  dedupKey: string | undefined,
  result: SendResult,
): Promise<void> {
  if (!result.ok) {
    console.error("[email] Send failed:", "error" in result ? result.error : "unknown");
    return;
  }

  if ("skipped" in result && result.skipped) {
    return;
  }

  if (dedupKey) {
    await recordNotificationSent(userId, alertType, dedupKey);
  }
}

export function buildConcentrationDedupKey(warning: PortfolioWarning): string {
  const symbols = [...warning.symbols].sort().join(",");
  return `${warning.code}:${symbols}`;
}

export function isInvestmentDayToday(
  investmentDay: number,
  referenceDate: Date = new Date(),
): boolean {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const effectiveDay = Math.min(investmentDay, lastDay);
  return referenceDate.getDate() === effectiveDay;
}

export async function dispatchMonthlyPlanReady(
  userId: string,
  planWithItems: MonthlyPlanWithItems,
): Promise<void> {
  const dedupKey = `monthly_plan_ready:${planWithItems.plan.month}`;
  const gate = await shouldSendAlert(userId, "monthly_plan_ready", dedupKey);
  if (!gate.send || !gate.to) {
    return;
  }

  const summary = computeMonthlyPlanSummary(
    planWithItems.plan.monthly_amount,
    planWithItems.items,
  );

  const items = planWithItems.items
    .filter((item) => !isCashSymbol(item.symbol))
    .map((item) => ({
      symbol: item.symbol,
      amount: item.adjusted_amount,
      reason: item.reason,
    }));

  const result = await sendMonthlyPlanReadyEmail({
    to: gate.to,
    month: planWithItems.plan.month,
    monthlyAmount: planWithItems.plan.monthly_amount,
    currency: planWithItems.plan.currency,
    items,
    cashReserve: summary.cashReserve,
  });

  await finalizeSend(userId, "monthly_plan_ready", dedupKey, result);
}

export async function dispatchUrgentRiskWarning(
  userId: string,
  report: DailyUrgentScanReport,
): Promise<void> {
  if (!report.urgent_news) {
    return;
  }

  const dedupKey = `urgent_risk:${report.report_date}`;
  const gate = await shouldSendAlert(userId, "urgent_risk", dedupKey);
  if (!gate.send || !gate.to) {
    return;
  }

  const result = await sendUrgentRiskWarningEmail({
    to: gate.to,
    headline: `Overall risk level: ${report.overall_risk_level}`,
    summary: `Market regime: ${report.market_regime}. Review urgent events before making manual trades.`,
    details: report.events.map((event) => ({
      symbol: event.symbol,
      reason: event.one_sentence_reason,
      riskLevel: event.ai_bias,
    })),
    periodLabel: report.report_date,
  });

  await finalizeSend(userId, "urgent_risk", dedupKey, result);
}

export async function dispatchWeeklyRiskSummary(
  userId: string,
  report: WeeklyMarketReviewReport,
): Promise<void> {
  const dedupKey = `weekly_summary:${report.week_ending}`;
  const gate = await shouldSendAlert(userId, "weekly_summary", dedupKey);
  if (!gate.send || !gate.to) {
    return;
  }

  const result = await sendWeeklyRiskSummaryEmail({
    to: gate.to,
    headline: `Overall risk level: ${report.overall_risk_level}`,
    summary: report.weekly_summary,
    details: report.symbols_to_watch.map((symbol) => ({
      symbol: symbol.symbol,
      reason: symbol.reason,
      riskLevel: symbol.risk_level,
    })),
    periodLabel: report.week_ending,
  });

  await finalizeSend(userId, "weekly_summary", dedupKey, result);
}

export async function dispatchManualReviewRequired(
  userId: string,
  reasons: Array<{ symbol?: string; reason: string; dedupKey: string }>,
): Promise<void> {
  if (reasons.length === 0) {
    return;
  }

  const gate = await shouldSendAlert(userId, "manual_review");
  if (!gate.send || !gate.to) {
    return;
  }

  const pendingReasons: typeof reasons = [];
  for (const reason of reasons) {
    const alreadySent = await hasNotificationBeenSent(
      userId,
      "manual_review",
      reason.dedupKey,
    );
    if (!alreadySent) {
      pendingReasons.push(reason);
    }
  }

  if (pendingReasons.length === 0) {
    return;
  }

  const result = await sendManualReviewRequiredEmail({
    to: gate.to,
    headline: "Manual review required before new buys",
    summary:
      "One or more symbols require manual review. PortfolioPilot will not recommend automatic trades.",
    details: pendingReasons.map((reason) => ({
      symbol: reason.symbol,
      reason: reason.reason,
    })),
  });

  if (result.ok && !("skipped" in result && result.skipped)) {
    for (const reason of pendingReasons) {
      await recordNotificationSent(userId, "manual_review", reason.dedupKey);
    }
  } else if (!result.ok) {
    console.error("[email] Manual review send failed:", result.error);
  }
}

export async function dispatchInvestmentReminder(
  userId: string,
  profile: Pick<
    Profile,
    "investment_day" | "monthly_investment_amount" | "base_currency"
  >,
  monthKey: string = getCurrentMonthKey(),
): Promise<void> {
  if (!isInvestmentDayToday(profile.investment_day)) {
    return;
  }

  const dedupKey = `investment_reminder:${monthKey}`;
  const gate = await shouldSendAlert(userId, "investment_reminder", dedupKey);
  if (!gate.send || !gate.to) {
    return;
  }

  const result = await sendMonthlyInvestmentReminderEmail({
    to: gate.to,
    month: monthKey,
    monthlyAmount: profile.monthly_investment_amount,
    currency: profile.base_currency,
    items: [],
    cashReserve: 0,
  });

  await finalizeSend(userId, "investment_reminder", dedupKey, result);
}

export async function dispatchConcentrationWarnings(
  userId: string,
  warnings: PortfolioWarning[],
): Promise<void> {
  if (warnings.length === 0) {
    return;
  }

  const gate = await shouldSendAlert(userId, "concentration_warning");
  if (!gate.send || !gate.to) {
    return;
  }

  const pendingWarnings: PortfolioWarning[] = [];
  for (const warning of warnings) {
    const dedupKey = buildConcentrationDedupKey(warning);
    const alreadySent = await hasNotificationBeenSent(
      userId,
      "concentration_warning",
      dedupKey,
    );
    if (!alreadySent) {
      pendingWarnings.push(warning);
    }
  }

  if (pendingWarnings.length === 0) {
    return;
  }

  const result = await sendConcentrationWarningEmail({
    to: gate.to,
    headline: "Portfolio concentration limits exceeded",
    summary:
      "Your current holdings triggered concentration warnings. Review allocations before placing manual trades.",
    details: pendingWarnings.map((warning) => ({
      reason: warning.message,
      riskLevel: warning.severity,
    })),
  });

  if (result.ok && !("skipped" in result && result.skipped)) {
    for (const warning of pendingWarnings) {
      await recordNotificationSent(
        userId,
        "concentration_warning",
        buildConcentrationDedupKey(warning),
      );
    }
  } else if (!result.ok) {
    console.error("[email] Concentration warning send failed:", result.error);
  }
}

export function extractManualReviewReasons(
  reportType: ManualNewsInput["report_type"],
  reportPeriod: string,
  children: ManualNewsInput[],
): Array<{ symbol?: string; reason: string; dedupKey: string }> {
  const reasons: Array<{ symbol?: string; reason: string; dedupKey: string }> =
    [];

  for (const child of children) {
    const needsReview =
      child.suggested_frontend_status === "manual_review" ||
      child.ai_bias === "avoid";

    if (!needsReview) {
      continue;
    }

    const symbol = child.symbol ?? undefined;
    const reason =
      child.one_sentence_reason ??
      child.reason ??
      "Manual review required before new buys.";

    reasons.push({
      symbol,
      reason,
      dedupKey: `manual_review:${reportType}:${reportPeriod}:${symbol ?? "general"}`,
    });
  }

  return reasons;
}
