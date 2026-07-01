"use server";

import { revalidatePath } from "next/cache";

import { parseZodError, requireAuthUser } from "@/lib/server/auth";
import {
  emailPreferencesSchema,
  type EmailPreferencesInput,
} from "@/lib/validation/email-preferences";

export type MutationResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function getEmailPreferences(
  userId?: string,
): Promise<EmailPreferencesInput | null> {
  const auth = await requireAuthUser();
  if (!auth.ok) {
    return null;
  }

  const targetUserId = userId ?? auth.user.id;
  if (targetUserId !== auth.user.id) {
    return null;
  }

  const { data, error } = await auth.supabase
    .from("profiles")
    .select(
      "email_alerts_enabled, email_monthly_plan_ready, email_urgent_risk, email_weekly_summary, email_investment_reminder, email_concentration_warning, email_manual_review",
    )
    .eq("id", targetUserId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return emailPreferencesSchema.parse(data);
}

export async function updateEmailPreferences(
  raw: unknown,
): Promise<MutationResult<EmailPreferencesInput>> {
  const auth = await requireAuthUser();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  let payload: EmailPreferencesInput;
  try {
    payload = emailPreferencesSchema.parse(raw);
  } catch (error) {
    return { ok: false, error: parseZodError(error) };
  }

  const { data, error } = await auth.supabase
    .from("profiles")
    .update(payload)
    .eq("id", auth.user.id)
    .select(
      "email_alerts_enabled, email_monthly_plan_ready, email_urgent_risk, email_weekly_summary, email_investment_reminder, email_concentration_warning, email_manual_review",
    )
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? "Failed to update email preferences.",
    };
  }

  revalidatePath("/settings");

  return { ok: true, data: emailPreferencesSchema.parse(data) };
}
