"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { updateEmailPreferences } from "@/lib/server/email-preferences";
import {
  EMAIL_PREFERENCE_LABELS,
  emailPreferencesSchema,
  type EmailPreferenceKey,
  type EmailPreferencesInput,
} from "@/lib/validation/email-preferences";

const ALERT_KEYS = Object.keys(
  EMAIL_PREFERENCE_LABELS,
) as EmailPreferenceKey[];

type EmailPreferencesFormProps = {
  initialPreferences: EmailPreferencesInput;
  email: string | null;
};

export function EmailPreferencesForm({
  initialPreferences,
  email,
}: EmailPreferencesFormProps) {
  const router = useRouter();
  const [preferences, setPreferences] =
    useState<EmailPreferencesInput>(initialPreferences);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function updatePreference<K extends keyof EmailPreferencesInput>(
    key: K,
    value: EmailPreferencesInput[K],
  ) {
    setPreferences((current) => ({ ...current, [key]: value }));
  }

  async function handleSave() {
    setSubmitError(null);

    const parsed = emailPreferencesSchema.safeParse(preferences);
    if (!parsed.success) {
      setSubmitError(parsed.error.issues[0]?.message ?? "Invalid preferences.");
      return;
    }

    setIsSaving(true);
    const result = await updateEmailPreferences(parsed.data);
    setIsSaving(false);

    if (!result.ok) {
      setSubmitError(result.error);
      return;
    }

    setPreferences(result.data);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Alerts are informational only. You place all trades manually in your
          brokerage account.
        </p>
        {email && (
          <p className="text-sm text-muted-foreground">
            Alerts will be sent to <span className="text-foreground">{email}</span>.
          </p>
        )}
      </div>

      <div className="space-y-4 rounded-lg border border-border p-4">
        <label className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="email_alerts_enabled">Enable email alerts</Label>
            <p className="text-sm text-muted-foreground">
              Master switch for all PortfolioPilot email notifications.
            </p>
          </div>
          <input
            id="email_alerts_enabled"
            type="checkbox"
            checked={preferences.email_alerts_enabled}
            onChange={(event) =>
              updatePreference("email_alerts_enabled", event.target.checked)
            }
            className="size-4 accent-primary"
          />
        </label>
      </div>

      <div className="space-y-3 rounded-lg border border-border p-4">
        <p className="text-sm font-medium text-foreground">Alert types</p>
        {ALERT_KEYS.map((key) => (
          <label key={key} className="flex items-center justify-between gap-4">
            <span className="text-sm text-foreground">
              {EMAIL_PREFERENCE_LABELS[key]}
            </span>
            <input
              type="checkbox"
              checked={preferences[key]}
              disabled={!preferences.email_alerts_enabled}
              onChange={(event) => updatePreference(key, event.target.checked)}
              className="size-4 accent-primary disabled:opacity-50"
            />
          </label>
        ))}
      </div>

      {submitError && (
        <Alert variant="destructive">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <Button type="button" onClick={handleSave} disabled={isSaving}>
        {isSaving ? "Saving..." : "Save email preferences"}
      </Button>
    </div>
  );
}
