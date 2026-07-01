"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { SettingsSection } from "@/components/settings/settings-section";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateStrategyPreferences } from "@/lib/server/strategy";
import {
  strategyPreferencesSchema,
  type StrategyPreferencesInput,
} from "@/lib/validation/strategy";
import type { Profile } from "@/types/database";

type StrategySectionProps = {
  profile: Profile;
};

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

function profileToStrategyInput(profile: Profile): StrategyPreferencesInput {
  return {
    risk_profile: profile.risk_profile as StrategyPreferencesInput["risk_profile"],
    time_horizon: profile.time_horizon as StrategyPreferencesInput["time_horizon"],
    broad_etf_priority: profile.broad_etf_priority ?? true,
    cash_reserve_percent: profile.cash_reserve_percent ?? 5,
    max_individual_stock_percent: profile.max_individual_stock_percent ?? 15,
  };
}

export function StrategySection({ profile }: StrategySectionProps) {
  const router = useRouter();
  const [form, setForm] = useState<StrategyPreferencesInput>(
    profileToStrategyInput(profile),
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);

    const parsed = strategyPreferencesSchema.safeParse(form);
    if (!parsed.success) {
      setSubmitError(parsed.error.issues[0]?.message ?? "Invalid input.");
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateStrategyPreferences(parsed.data);
      if (!result.ok) {
        setSubmitError(result.error);
        return;
      }
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SettingsSection
      id="strategy"
      title="Investment strategy"
      description="Preferences that guide the recommendation engine. This is not a target allocation."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="strategy-risk">Risk profile</Label>
            <select
              id="strategy-risk"
              className={SELECT_CLASS}
              value={form.risk_profile}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  risk_profile: event.target
                    .value as StrategyPreferencesInput["risk_profile"],
                }))
              }
            >
              {RISK_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="strategy-horizon">Time horizon</Label>
            <select
              id="strategy-horizon"
              className={SELECT_CLASS}
              value={form.time_horizon}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  time_horizon: event.target
                    .value as StrategyPreferencesInput["time_horizon"],
                }))
              }
            >
              {HORIZON_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            id="broad-etf-priority"
            type="checkbox"
            checked={form.broad_etf_priority}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                broad_etf_priority: event.target.checked,
              }))
            }
            className="size-4 rounded border-input"
          />
          <Label htmlFor="broad-etf-priority" className="font-normal">
            Prioritize broad market ETFs in recommendations
          </Label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="cash-reserve">Cash reserve (% of monthly amount)</Label>
            <Input
              id="cash-reserve"
              type="number"
              min={0}
              max={50}
              step={0.5}
              value={form.cash_reserve_percent}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  cash_reserve_percent: Number(event.target.value),
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-stock">Max single-stock exposure (%)</Label>
            <Input
              id="max-stock"
              type="number"
              min={5}
              max={40}
              step={0.5}
              value={form.max_individual_stock_percent}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  max_individual_stock_percent: Number(event.target.value),
                }))
              }
            />
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Manage symbols the engine considers in{" "}
          <a href="#watchlist" className="underline underline-offset-2">
            Watchlist
          </a>
          .
        </p>

        {submitError ? (
          <Alert variant="destructive">
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        ) : null}

        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save strategy preferences"}
        </Button>
      </form>
    </SettingsSection>
  );
}
