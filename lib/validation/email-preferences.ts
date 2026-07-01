import { z } from "zod";

export const emailPreferencesSchema = z.object({
  email_alerts_enabled: z.boolean(),
  email_monthly_plan_ready: z.boolean(),
  email_urgent_risk: z.boolean(),
  email_weekly_summary: z.boolean(),
  email_investment_reminder: z.boolean(),
  email_concentration_warning: z.boolean(),
  email_manual_review: z.boolean(),
});

export type EmailPreferencesInput = z.infer<typeof emailPreferencesSchema>;

export type EmailPreferenceKey = Exclude<
  keyof EmailPreferencesInput,
  "email_alerts_enabled"
>;

export const EMAIL_PREFERENCE_LABELS: Record<EmailPreferenceKey, string> = {
  email_monthly_plan_ready: "Monthly plan ready",
  email_urgent_risk: "Urgent risk warning",
  email_weekly_summary: "Weekly risk summary available",
  email_investment_reminder: "Monthly investment reminder",
  email_concentration_warning: "Concentration warning",
  email_manual_review: "Manual review required",
};

export function isAlertTypeEnabled(
  preferences: EmailPreferencesInput,
  key: EmailPreferenceKey,
): boolean {
  if (!preferences.email_alerts_enabled) {
    return false;
  }

  return preferences[key];
}
