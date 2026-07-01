"use client";

import { Label } from "@/components/ui/label";
import type { InvestmentStatusStepData } from "@/lib/validation/onboarding";

type InvestmentStatusStepProps = {
  value: InvestmentStatusStepData;
  onChange: (value: InvestmentStatusStepData) => void;
  errors?: Record<string, string>;
};

const OPTIONS = [
  {
    value: "has_investments" as const,
    title: "I already have investments",
    description: "You hold positions today and want PortfolioPilot to track them.",
  },
  {
    value: "not_invested_yet" as const,
    title: "I am not invested yet",
    description:
      "No problem. PortfolioPilot can generate an initial investment recommendation before you have holdings.",
  },
];

export function InvestmentStatusStep({
  value,
  onChange,
  errors,
}: InvestmentStatusStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Investment status</h3>
        <p className="text-sm text-muted-foreground">
          Tell us whether you already hold investments or are starting fresh.
        </p>
      </div>

      <div className="space-y-3">
        {OPTIONS.map((option) => {
          const selected = value.investment_status === option.value;
          return (
            <label
              key={option.value}
              className={`flex cursor-pointer gap-3 rounded-lg border p-4 transition-colors ${
                selected
                  ? "border-primary bg-primary/5"
                  : "border-input hover:border-primary/40"
              }`}
            >
              <input
                type="radio"
                name="investment_status"
                value={option.value}
                checked={selected}
                onChange={() =>
                  onChange({ investment_status: option.value })
                }
                className="mt-1"
              />
              <span className="space-y-1">
                <span className="block font-medium">{option.title}</span>
                <span className="block text-sm text-muted-foreground">
                  {option.description}
                </span>
              </span>
            </label>
          );
        })}
      </div>

      {errors?.investment_status && (
        <p className="text-sm text-destructive">{errors.investment_status}</p>
      )}
    </div>
  );
}
