import { beforeEach, describe, expect, it, vi } from "vitest";

import { MANUAL_TRADING_DISCLAIMER } from "@/lib/email/constants";

const { mockSend, mockRender } = vi.hoisted(() => ({
  mockSend: vi.fn(),
  mockRender: vi.fn(async () => "<html>rendered</html>"),
}));

vi.mock("@/lib/email/client", () => ({
  getResendClient: () => ({
    emails: {
      send: mockSend,
    },
  }),
  isEmailConfigured: vi.fn(),
}));

vi.mock("@/lib/email/env", () => ({
  getEmailEnv: () => ({
    apiKey: "test-key",
    from: "PortfolioPilot <alerts@test.com>",
    appUrl: "https://app.test",
  }),
  getAppUrl: () => "https://app.test",
}));

vi.mock("@react-email/render", () => ({
  render: mockRender,
}));

import { isEmailConfigured } from "@/lib/email/client";
import {
  sendConcentrationWarningEmail,
  sendMonthlyPlanReadyEmail,
  sendUrgentRiskWarningEmail,
} from "@/lib/email/send";

describe("email send helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isEmailConfigured).mockReturnValue(true);
    mockSend.mockResolvedValue({ data: { id: "email-1" }, error: null });
  });

  it("skips send when email is not configured", async () => {
    vi.mocked(isEmailConfigured).mockReturnValue(false);

    const result = await sendMonthlyPlanReadyEmail({
      to: "user@test.com",
      month: "2026-07",
      monthlyAmount: 4000,
      currency: "MXN",
      items: [{ symbol: "VOO", amount: 2200 }],
      cashReserve: 500,
    });

    expect(result).toEqual({ ok: true, skipped: true });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("sends monthly plan ready email with disclaimer in text body", async () => {
    const result = await sendMonthlyPlanReadyEmail({
      to: "user@test.com",
      month: "2026-07",
      monthlyAmount: 4000,
      currency: "MXN",
      items: [{ symbol: "VOO", amount: 2200, reason: "Underweight core ETF" }],
      cashReserve: 500,
    });

    expect(result).toEqual({ ok: true, messageId: "email-1" });
    expect(mockSend).toHaveBeenCalledOnce();

    const payload = mockSend.mock.calls[0][0];
    expect(payload.subject).toContain("Monthly Investment Plan Ready");
    expect(payload.text).toContain(MANUAL_TRADING_DISCLAIMER);
    expect(payload.text).toContain("VOO");
  });

  it("sends urgent risk warning with expected subject", async () => {
    await sendUrgentRiskWarningEmail({
      to: "user@test.com",
      headline: "Overall risk level: high",
      summary: "Market regime: volatile.",
      details: [{ symbol: "NVDA", reason: "Earnings miss", riskLevel: "avoid" }],
      periodLabel: "2026-07-01",
    });

    const payload = mockSend.mock.calls[0][0];
    expect(payload.subject).toBe("Urgent Risk Warning — 2026-07-01");
    expect(payload.text).toContain("NVDA");
    expect(payload.text).toContain(MANUAL_TRADING_DISCLAIMER);
  });

  it("sends concentration warning email", async () => {
    await sendConcentrationWarningEmail({
      to: "user@test.com",
      headline: "Portfolio concentration limits exceeded",
      summary: "Review allocations before placing manual trades.",
      details: [{ reason: "NVDA exceeds 10% concentration." }],
    });

    const payload = mockSend.mock.calls[0][0];
    expect(payload.subject).toBe("Portfolio Concentration Warning");
    expect(payload.text).toContain(MANUAL_TRADING_DISCLAIMER);
  });
});
