"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  formatPlanCurrency,
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
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-foreground">{symbol}</p>
            {item.recommendation_score != null ? (
              <Badge variant="secondary">
                Score {item.recommendation_score.toFixed(1)}
              </Badge>
            ) : null}
            {item.concentration_flag ? (
              <Badge variant="destructive">Concentration</Badge>
            ) : null}
            {item.manual_review_required ? (
              <Badge variant="outline">Manual review</Badge>
            ) : null}
          </div>
          {item.technical_score != null ? (
            <p className="text-sm text-muted-foreground">
              Technical {item.technical_score.toFixed(1)}
              {item.news_modifier_score != null
                ? ` · News ${item.news_modifier_score.toFixed(1)}`
                : ""}
              {item.risk_score != null
                ? ` · Risk ${item.risk_score.toFixed(1)}`
                : ""}
            </p>
          ) : null}
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
      {item.decision_basis ? (
        <p className="text-xs text-muted-foreground">{item.decision_basis}</p>
      ) : null}
      <p className="text-sm text-muted-foreground">{item.reason}</p>
    </div>
  );
}
