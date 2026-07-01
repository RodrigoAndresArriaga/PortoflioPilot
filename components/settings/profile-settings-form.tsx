"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateUserProfile } from "@/lib/server/profile";
import {
  profileSettingsSchema,
  type ProfileSettingsInput,
} from "@/lib/validation/profile-settings";
import type { Profile } from "@/types/database";

type ProfileSettingsFormProps = {
  profile: Profile;
  email: string | null;
};

const CURRENCIES = ["MXN", "USD", "EUR", "CAD", "GBP"] as const;

const RISK_OPTIONS = [
  { value: "conservative", label: "Conservative" },
  { value: "balanced", label: "Balanced" },
  { value: "growth", label: "Growth" },
  { value: "aggressive_growth", label: "Aggressive growth" },
] as const;

const HORIZON_OPTIONS = [
  { value: "1_3_years", label: "1–3 years" },
  { value: "3_5_years", label: "3–5 years" },
  { value: "5_10_years", label: "5–10 years" },
  { value: "10_plus_years", label: "10+ years" },
] as const;

const SELECT_CLASS =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

function profileToFormInput(profile: Profile): ProfileSettingsInput {
  return {
    full_name: profile.full_name,
    base_currency: profile.base_currency as ProfileSettingsInput["base_currency"],
    monthly_investment_amount: profile.monthly_investment_amount,
    investment_day: profile.investment_day,
    risk_profile: profile.risk_profile as ProfileSettingsInput["risk_profile"],
    time_horizon: profile.time_horizon as ProfileSettingsInput["time_horizon"],
  };
}

export function ProfileSettingsForm({ profile, email }: ProfileSettingsFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<ProfileSettingsInput>(profileToFormInput(profile));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function updateForm<K extends keyof ProfileSettingsInput>(
    key: K,
    value: ProfileSettingsInput[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSave() {
    setErrors({});
    setSubmitError(null);

    const parsed = profileSettingsSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path[0];
        if (typeof path === "string" && !fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSaving(true);
    const result = await updateUserProfile(parsed.data);
    setIsSaving(false);

    if (!result.ok) {
      setSubmitError(result.error);
      return;
    }

    setForm(profileToFormInput(result.data));
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <section id="profile" className="scroll-mt-24 space-y-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-foreground">Profile</h3>
          <p className="text-sm text-muted-foreground">
            Your display name and account email.
          </p>
        </div>
        <div className="space-y-4 rounded-lg border border-border p-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Display name</Label>
            <Input
              id="full_name"
              value={form.full_name ?? ""}
              onChange={(event) =>
                updateForm("full_name", event.target.value || null)
              }
              placeholder="Your name"
            />
            {errors.full_name && (
              <p className="text-sm text-destructive">{errors.full_name}</p>
            )}
          </div>
          {email && (
            <div className="space-y-2">
              <Label>Email</Label>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
          )}
        </div>
      </section>

      <section id="currency" className="scroll-mt-24 space-y-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-foreground">Currency</h3>
          <p className="text-sm text-muted-foreground">
            Preferred currency for plans and portfolio values.
          </p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <div className="space-y-2">
            <Label htmlFor="base_currency">Preferred currency</Label>
            <select
              id="base_currency"
              className={SELECT_CLASS}
              value={form.base_currency}
              onChange={(event) =>
                updateForm(
                  "base_currency",
                  event.target.value as ProfileSettingsInput["base_currency"],
                )
              }
            >
              {CURRENCIES.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
            {errors.base_currency && (
              <p className="text-sm text-destructive">{errors.base_currency}</p>
            )}
          </div>
        </div>
      </section>

      <section id="monthly-amount" className="scroll-mt-24 space-y-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-foreground">Monthly amount</h3>
          <p className="text-sm text-muted-foreground">
            How much you invest each month. Used for monthly plan generation.
          </p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <div className="space-y-2">
            <Label htmlFor="monthly_investment_amount">
              Monthly investment amount
            </Label>
            <Input
              id="monthly_investment_amount"
              type="number"
              min={0}
              step="0.01"
              value={form.monthly_investment_amount}
              onChange={(event) =>
                updateForm(
                  "monthly_investment_amount",
                  event.target.valueAsNumber || 0,
                )
              }
            />
            {errors.monthly_investment_amount && (
              <p className="text-sm text-destructive">
                {errors.monthly_investment_amount}
              </p>
            )}
          </div>
        </div>
      </section>

      <section id="investment-day" className="scroll-mt-24 space-y-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-foreground">Investment day</h3>
          <p className="text-sm text-muted-foreground">
            Day of the month you typically invest. Used for reminders.
          </p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <div className="space-y-2">
            <Label htmlFor="investment_day">Investment day of month</Label>
            <Input
              id="investment_day"
              type="number"
              min={1}
              max={31}
              value={form.investment_day}
              onChange={(event) =>
                updateForm("investment_day", event.target.valueAsNumber || 1)
              }
            />
            <p className="text-xs text-muted-foreground">
              Default: 1st of every month
            </p>
            {errors.investment_day && (
              <p className="text-sm text-destructive">{errors.investment_day}</p>
            )}
          </div>
        </div>
      </section>

      <section id="risk-profile" className="scroll-mt-24 space-y-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-foreground">Risk profile</h3>
          <p className="text-sm text-muted-foreground">
            Used for recommended allocation defaults.
          </p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <fieldset className="space-y-3">
            <legend className="sr-only">Risk profile</legend>
            {RISK_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-3 rounded-md border border-input px-3 py-2"
              >
                <input
                  type="radio"
                  name="risk_profile"
                  value={option.value}
                  checked={form.risk_profile === option.value}
                  onChange={() => updateForm("risk_profile", option.value)}
                  className="size-4"
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
            {errors.risk_profile && (
              <p className="text-sm text-destructive">{errors.risk_profile}</p>
            )}
          </fieldset>
        </div>
      </section>

      <section id="time-horizon" className="scroll-mt-24 space-y-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-foreground">Time horizon</h3>
          <p className="text-sm text-muted-foreground">
            How long you plan to stay invested.
          </p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <fieldset className="space-y-3">
            <legend className="sr-only">Time horizon</legend>
            {HORIZON_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-3 rounded-md border border-input px-3 py-2"
              >
                <input
                  type="radio"
                  name="time_horizon"
                  value={option.value}
                  checked={form.time_horizon === option.value}
                  onChange={() => updateForm("time_horizon", option.value)}
                  className="size-4"
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
            {errors.time_horizon && (
              <p className="text-sm text-destructive">{errors.time_horizon}</p>
            )}
          </fieldset>
        </div>
      </section>

      {submitError && (
        <Alert variant="destructive">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <Button type="button" onClick={handleSave} disabled={isSaving}>
        {isSaving ? "Saving..." : "Save profile & investment preferences"}
      </Button>
    </div>
  );
}
