import { render } from "@react-email/render";
import type { ReactElement } from "react";

import { getResendClient, isEmailConfigured } from "@/lib/email/client";
import { MANUAL_TRADING_DISCLAIMER } from "@/lib/email/constants";
import { getAppUrl, getEmailEnv } from "@/lib/email/env";
import {
  MonthlyPlanEmail,
  type MonthlyPlanEmailProps,
} from "@/lib/email/templates/monthly-plan";
import {
  RiskWarningEmail,
  type RiskWarningEmailProps,
} from "@/lib/email/templates/risk-warning";
import { formatMonthLabel } from "@/lib/monthly-plan/format";

export type SendResult =
  | { ok: true; messageId: string }
  | { ok: true; skipped: true }
  | { ok: false; error: string };

type SendEmailInput = {
  to: string;
  subject: string;
  react: ReactElement;
  text: string;
};

async function sendEmail(input: SendEmailInput): Promise<SendResult> {
  if (!isEmailConfigured()) {
    console.info("[email] Skipped send — RESEND_API_KEY not configured.");
    return { ok: true, skipped: true };
  }

  try {
    const { from } = getEmailEnv();
    const html = await render(input.react);
    const { data, error } = await getResendClient().emails.send({
      from,
      to: input.to,
      subject: input.subject,
      html,
      text: input.text,
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true, messageId: data?.id ?? "unknown" };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to send email.",
    };
  }
}

function appendDisclaimer(text: string): string {
  return `${text}\n\n${MANUAL_TRADING_DISCLAIMER}`;
}

function buildMonthlyPlanText(props: MonthlyPlanEmailProps): string {
  const lines = [
    props.variant === "reminder"
      ? `Monthly Investment Reminder — ${props.monthLabel}`
      : `Monthly Investment Plan Ready — ${props.monthLabel}`,
    "",
    `Monthly budget: ${props.monthlyAmount} ${props.currency}`,
    "",
    "Recommended manual buys:",
  ];

  for (const item of props.items) {
    if (item.amount > 0) {
      lines.push(`- ${item.symbol}: ${item.amount} ${props.currency}`);
    }
  }

  if (props.cashReserve > 0) {
    lines.push(`- Cash reserve: ${props.cashReserve} ${props.currency}`);
  }

  lines.push("", "Action: Review and manually place trades in your brokerage account.");

  return appendDisclaimer(lines.join("\n"));
}

function buildRiskWarningText(props: RiskWarningEmailProps): string {
  const lines = [props.headline, "", props.summary, ""];

  for (const detail of props.details) {
    const prefix = detail.symbol ? `${detail.symbol}: ` : "";
    const risk = detail.riskLevel ? ` (risk: ${detail.riskLevel})` : "";
    lines.push(`- ${prefix}${detail.reason}${risk}`);
  }

  lines.push(
    "",
    "Action: Review your portfolio and decide on manual trades. PortfolioPilot does not execute trades automatically.",
  );

  return appendDisclaimer(lines.join("\n"));
}

export async function sendMonthlyPlanReadyEmail(
  input: Omit<MonthlyPlanEmailProps, "appUrl" | "monthLabel" | "variant"> & {
    to: string;
  },
): Promise<SendResult> {
  const appUrl = getAppUrl();
  const monthLabel = formatMonthLabel(input.month);
  const props: MonthlyPlanEmailProps = {
    ...input,
    appUrl,
    monthLabel,
    variant: "plan_ready",
  };

  return sendEmail({
    to: input.to,
    subject: `Monthly Investment Plan Ready — ${monthLabel}`,
    react: MonthlyPlanEmail(props),
    text: buildMonthlyPlanText(props),
  });
}

export async function sendMonthlyInvestmentReminderEmail(
  input: Omit<MonthlyPlanEmailProps, "appUrl" | "monthLabel" | "variant"> & {
    to: string;
  },
): Promise<SendResult> {
  const appUrl = getAppUrl();
  const monthLabel = formatMonthLabel(input.month);
  const props: MonthlyPlanEmailProps = {
    ...input,
    appUrl,
    monthLabel,
    variant: "reminder",
  };

  return sendEmail({
    to: input.to,
    subject: `Monthly Investment Reminder — ${monthLabel}`,
    react: MonthlyPlanEmail(props),
    text: buildMonthlyPlanText(props),
  });
}

export async function sendUrgentRiskWarningEmail(
  input: Omit<RiskWarningEmailProps, "appUrl" | "variant"> & {
    to: string;
    periodLabel?: string;
  },
): Promise<SendResult> {
  const appUrl = getAppUrl();
  const props: RiskWarningEmailProps = {
    ...input,
    appUrl,
    variant: "urgent_risk",
  };
  const period = input.periodLabel ? ` — ${input.periodLabel}` : "";

  return sendEmail({
    to: input.to,
    subject: `Urgent Risk Warning${period}`,
    react: RiskWarningEmail(props),
    text: buildRiskWarningText(props),
  });
}

export async function sendWeeklyRiskSummaryEmail(
  input: Omit<RiskWarningEmailProps, "appUrl" | "variant"> & {
    to: string;
    periodLabel?: string;
  },
): Promise<SendResult> {
  const appUrl = getAppUrl();
  const props: RiskWarningEmailProps = {
    ...input,
    appUrl,
    variant: "weekly_summary",
    ctaPath: input.ctaPath ?? "/news-input",
  };
  const period = input.periodLabel ? ` — ${input.periodLabel}` : "";

  return sendEmail({
    to: input.to,
    subject: `Weekly Risk Summary${period}`,
    react: RiskWarningEmail(props),
    text: buildRiskWarningText(props),
  });
}

export async function sendConcentrationWarningEmail(
  input: Omit<RiskWarningEmailProps, "appUrl" | "variant"> & {
    to: string;
  },
): Promise<SendResult> {
  const appUrl = getAppUrl();
  const props: RiskWarningEmailProps = {
    ...input,
    appUrl,
    variant: "concentration",
  };

  return sendEmail({
    to: input.to,
    subject: "Portfolio Concentration Warning",
    react: RiskWarningEmail(props),
    text: buildRiskWarningText(props),
  });
}

export async function sendManualReviewRequiredEmail(
  input: Omit<RiskWarningEmailProps, "appUrl" | "variant"> & {
    to: string;
  },
): Promise<SendResult> {
  const appUrl = getAppUrl();
  const props: RiskWarningEmailProps = {
    ...input,
    appUrl,
    variant: "manual_review",
  };

  return sendEmail({
    to: input.to,
    subject: "Manual Review Required",
    react: RiskWarningEmail(props),
    text: buildRiskWarningText(props),
  });
}
