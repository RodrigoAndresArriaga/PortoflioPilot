import { describe, expect, it } from "vitest";

import { MANUAL_TRADING_DISCLAIMER } from "@/lib/email/constants";
import { isEmailConfigured } from "@/lib/email/client";
import { getAppUrl } from "@/lib/email/env";
import {
  sendConcentrationWarningEmail,
  sendManualReviewRequiredEmail,
  sendMonthlyInvestmentReminderEmail,
  sendMonthlyPlanReadyEmail,
  sendUrgentRiskWarningEmail,
  sendWeeklyRiskSummaryEmail,
} from "@/lib/email/send";

const LIVE = process.env.RUN_LIVE_EMAIL_TESTS === "1";
const testTo = process.env.LIVE_TEST_EMAIL?.trim();

type SendResult = Awaited<ReturnType<typeof sendMonthlyPlanReadyEmail>>;

function assertSendOk(label: string, result: SendResult) {
  if (!result.ok) {
    console.error(`[live] ${label}:`, result.error);
  }
  expect(result.ok).toBe(true);
}

describe.runIf(LIVE)("live email sends", () => {
  it("has required env configured", () => {
    expect(isEmailConfigured()).toBe(true);
    expect(process.env.RESEND_FROM?.trim()).toBeTruthy();
    expect(getAppUrl()).toMatch(/^https?:\/\//);
    expect(testTo).toBeTruthy();
  });

  it("sends monthly plan ready", async () => {
    const result = await sendMonthlyPlanReadyEmail({
      to: testTo!,
      month: "2026-07",
      monthlyAmount: 4000,
      currency: "MXN",
      items: [
        { symbol: "VOO", amount: 2200, reason: "Underweight core ETF" },
        { symbol: "VXUS", amount: 400 },
      ],
      cashReserve: 500,
    });

    assertSendOk("monthly plan ready", result);
  });

  it("sends monthly investment reminder", async () => {
    const result = await sendMonthlyInvestmentReminderEmail({
      to: testTo!,
      month: "2026-07",
      monthlyAmount: 4000,
      currency: "MXN",
      items: [],
      cashReserve: 0,
    });

    assertSendOk("monthly investment reminder", result);
  });

  it("sends urgent risk warning", async () => {
    const result = await sendUrgentRiskWarningEmail({
      to: testTo!,
      headline: "Overall risk level: high",
      summary: "Market regime: volatile. Review urgent events before manual trades.",
      details: [
        {
          symbol: "NVDA",
          reason: "Earnings guidance cut; avoid new buys pending review.",
          riskLevel: "avoid",
        },
      ],
      periodLabel: "2026-07-01",
    });

    assertSendOk("urgent risk warning", result);
  });

  it("sends weekly risk summary", async () => {
    const result = await sendWeeklyRiskSummaryEmail({
      to: testTo!,
      headline: "Overall risk level: medium",
      summary: "Markets mixed; tech volatility elevated into next week.",
      details: [
        {
          symbol: "QQQ",
          reason: "Watch mega-cap concentration.",
          riskLevel: "medium",
        },
      ],
      periodLabel: "2026-06-27",
    });

    assertSendOk("weekly risk summary", result);
  });

  it("sends concentration warning", async () => {
    const result = await sendConcentrationWarningEmail({
      to: testTo!,
      headline: "Portfolio concentration limits exceeded",
      summary: "One or more holdings exceed configured concentration thresholds.",
      details: [{ reason: "NVDA exceeds 10% single-stock concentration." }],
    });

    assertSendOk("concentration warning", result);
  });

  it("sends manual review required", async () => {
    const result = await sendManualReviewRequiredEmail({
      to: testTo!,
      headline: "Manual review required before new buys",
      summary:
        "PortfolioPilot flagged symbols that need manual review. No automatic trades.",
      details: [
        {
          symbol: "NVDA",
          reason: "Effective bias is avoid; hold off on new buys.",
        },
      ],
    });

    assertSendOk("manual review required", result);
  });

  it("includes manual trading disclaimer in rendered content path", () => {
    expect(MANUAL_TRADING_DISCLAIMER).toContain("does not execute trades");
  });
});

describe.runIf(LIVE)("live cron routes", () => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  const cronSecret = process.env.CRON_SECRET?.trim();

  it("has cron env configured", () => {
    expect(appUrl).toMatch(/^https?:\/\//);
    expect(cronSecret).toBeTruthy();
  });

  it("email-reminders cron responds ok", async () => {
    const response = await fetch(`${appUrl}/api/cron/email-reminders`, {
      headers: { authorization: `Bearer ${cronSecret}` },
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
  });

  it("concentration-alerts cron responds ok", async () => {
    const response = await fetch(`${appUrl}/api/cron/concentration-alerts`, {
      headers: { authorization: `Bearer ${cronSecret}` },
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
  });
});
