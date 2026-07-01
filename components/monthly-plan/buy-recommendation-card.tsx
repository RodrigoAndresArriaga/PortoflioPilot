"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatPlanCurrency,
  formatWeightPercent,
} from "@/lib/monthly-plan/format";
import { cn } from "@/lib/utils";
import type { MonthlyPlanItemInput } from "@/lib/validation/monthly-plan";

type BuyRecommendationCardProps = {
  item: MonthlyPlanItemInput;
  currency: string;
  readOnly: boolean;
  onAmountChange: (symbol: string, amount: number) => void;
};

export function BuyRecommendationCard({
  item,
  currency,
  readOnly,
  onAmountChange,
}: BuyRecommendationCardProps) {
  const hasBuy = item.adjusted_amount > 0;
  const symbol = item.symbol.trim().toUpperCase();

  return (
    <div
      className={cn(
        "rounded-lg border border-input p-4 space-y-3",
        !hasBuy && "opacity-70",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="font-semibold text-foreground">{symbol}</p>
          <p className="text-sm text-muted-foreground">
            Current {formatWeightPercent(item.current_weight)} · Target{" "}
            {formatWeightPercent(item.target_weight)}
          </p>
        </div>
        {readOnly ? (
          <p className="text-lg font-semibold tabular-nums">
            {formatPlanCurrency(item.adjusted_amount, currency)}
          </p>
        ) : (
          <div className="w-full max-w-[160px] space-y-1">
            <Label htmlFor={`buy-${symbol}`} className="text-xs">
              Recommended buy
            </Label>
            <Input
              id={`buy-${symbol}`}
              type="number"
              min={0}
              step="0.01"
              value={item.adjusted_amount}
              onChange={(event) =>
                onAmountChange(symbol, Number(event.target.value))
              }
            />
          </div>
        )}
      </div>
      <p className="text-sm text-muted-foreground">{item.reason}</p>
    </div>
  );
}
