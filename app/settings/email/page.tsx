import { EmailPreferencesForm } from "@/components/settings/email-preferences-form";
import { getEmailPreferences } from "@/lib/server/email-preferences";
import { requireCurrentUserProfile } from "@/lib/server/profile";
import { createClient } from "@/lib/supabase/server";
import { emailPreferencesSchema } from "@/lib/validation/email-preferences";

export default async function EmailSettingsPage() {
  await requireCurrentUserProfile();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const preferences = await getEmailPreferences();
  const initialPreferences = emailPreferencesSchema.parse(
    preferences ?? {
      email_alerts_enabled: true,
      email_monthly_plan_ready: true,
      email_urgent_risk: true,
      email_weekly_summary: true,
      email_investment_reminder: true,
      email_concentration_warning: true,
      email_manual_review: true,
    },
  );

  return (
    <EmailPreferencesForm
      initialPreferences={initialPreferences}
      email={user?.email ?? null}
    />
  );
}
