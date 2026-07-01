"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import type { InvestorProfileStepData } from "@/lib/validation/onboarding";

type InvestorProfileStepProps = {
  value: InvestorProfileStepData;
  onChange: (value: InvestorProfileStepData) => void;
  errors?: Record<string, string>;
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

export function InvestorProfileStep({
  value,
  onChange,
  errors,
}: InvestorProfileStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Investment preference</h3>
        <p className="text-sm text-muted-foreground">
          Tell us your risk tolerance and time horizon. PortfolioPilot uses this
          for recommended allocation defaults.
        </p>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Risk profile</legend>
        {RISK_OPTIONS.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-3 rounded-md border border-input px-3 py-2"
          >
            <input
              type="radio"
              name="risk_profile"
              value={option.value}
              checked={value.risk_profile === option.value}
              onChange={() =>
                onChange({
                  ...value,
                  risk_profile: option.value,
                })
              }
              className="size-4"
            />
            <span className="text-sm">{option.label}</span>
          </label>
        ))}
        {errors?.risk_profile && (
          <p className="text-sm text-destructive">{errors.risk_profile}</p>
        )}
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Time horizon</legend>
        {HORIZON_OPTIONS.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-3 rounded-md border border-input px-3 py-2"
          >
            <input
              type="radio"
              name="time_horizon"
              value={option.value}
              checked={value.time_horizon === option.value}
              onChange={() =>
                onChange({
                  ...value,
                  time_horizon: option.value,
                })
              }
              className="size-4"
            />
            <span className="text-sm">{option.label}</span>
          </label>
        ))}
        {errors?.time_horizon && (
          <p className="text-sm text-destructive">{errors.time_horizon}</p>
        )}
      </fieldset>

      {errors?.form && (
        <Alert variant="destructive">
          <AlertDescription>{errors.form}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
