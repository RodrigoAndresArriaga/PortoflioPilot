import { describe, expect, it } from "vitest";

import {
  EMAIL_PREFERENCE_LABELS,
  emailPreferencesSchema,
  isAlertTypeEnabled,
} from "@/lib/validation/email-preferences";

describe("emailPreferencesSchema", () => {
  it("accepts a full preferences object", () => {
    const parsed = emailPreferencesSchema.parse({
      email_alerts_enabled: true,
      email_monthly_plan_ready: true,
      email_urgent_risk: false,
      email_weekly_summary: true,
      email_investment_reminder: true,
      email_concentration_warning: false,
      email_manual_review: true,
    });

    expect(parsed.email_urgent_risk).toBe(false);
  });

  it("rejects missing fields", () => {
    const result = emailPreferencesSchema.safeParse({
      email_alerts_enabled: true,
    });

    expect(result.success).toBe(false);
  });
});

describe("isAlertTypeEnabled", () => {
  const base = {
    email_alerts_enabled: true,
    email_monthly_plan_ready: true,
    email_urgent_risk: true,
    email_weekly_summary: true,
    email_investment_reminder: true,
    email_concentration_warning: true,
    email_manual_review: true,
  };

  it("returns false when master toggle is off", () => {
    expect(
      isAlertTypeEnabled(
        { ...base, email_alerts_enabled: false },
        "email_monthly_plan_ready",
      ),
    ).toBe(false);
  });

  it("returns false when alert type is disabled", () => {
    expect(
      isAlertTypeEnabled(
        { ...base, email_urgent_risk: false },
        "email_urgent_risk",
      ),
    ).toBe(false);
  });

  it("returns true when master and alert type are enabled", () => {
    expect(
      isAlertTypeEnabled(base, "email_concentration_warning"),
    ).toBe(true);
  });
});

describe("EMAIL_PREFERENCE_LABELS", () => {
  it("labels all six alert types", () => {
    expect(Object.keys(EMAIL_PREFERENCE_LABELS)).toHaveLength(6);
  });
});
