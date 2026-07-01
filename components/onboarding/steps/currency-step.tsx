"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CurrencyStepData } from "@/lib/validation/onboarding";

type CurrencyStepProps = {
  value: CurrencyStepData;
  onChange: (value: CurrencyStepData) => void;
  errors?: Record<string, string>;
};

const CURRENCIES = ["MXN", "USD", "EUR", "CAD", "GBP"] as const;

export function CurrencyStep({ value, onChange, errors }: CurrencyStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Currency and monthly amount</h3>
        <p className="text-sm text-muted-foreground">
          Tell us how much you invest each month and when.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="base_currency">Preferred currency</Label>
        <select
          id="base_currency"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          value={value.base_currency}
          onChange={(event) =>
            onChange({
              ...value,
              base_currency: event.target.value as CurrencyStepData["base_currency"],
            })
          }
        >
          {CURRENCIES.map((currency) => (
            <option key={currency} value={currency}>
              {currency}
            </option>
          ))}
        </select>
        {errors?.base_currency && (
          <p className="text-sm text-destructive">{errors.base_currency}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="monthly_investment_amount">Monthly investment amount</Label>
        <Input
          id="monthly_investment_amount"
          type="number"
          min={0}
          step="0.01"
          value={value.monthly_investment_amount}
          onChange={(event) =>
            onChange({
              ...value,
              monthly_investment_amount: event.target.valueAsNumber || 0,
            })
          }
        />
        {errors?.monthly_investment_amount && (
          <p className="text-sm text-destructive">
            {errors.monthly_investment_amount}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="investment_day">Investment day of month</Label>
        <Input
          id="investment_day"
          type="number"
          min={1}
          max={31}
          value={value.investment_day}
          onChange={(event) =>
            onChange({
              ...value,
              investment_day: event.target.valueAsNumber || 1,
            })
          }
        />
        <p className="text-xs text-muted-foreground">
          Default: 1st of every month
        </p>
        {errors?.investment_day && (
          <p className="text-sm text-destructive">{errors.investment_day}</p>
        )}
      </div>

      {errors?.form && (
        <Alert variant="destructive">
          <AlertDescription>{errors.form}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
