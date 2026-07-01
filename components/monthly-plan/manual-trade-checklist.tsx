"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPlanCurrency } from "@/lib/monthly-plan/format";
import type { MonthlyPlanItemInput } from "@/lib/validation/monthly-plan";

type ManualTradeChecklistProps = {
  items: MonthlyPlanItemInput[];
  currency: string;
  checkedSymbols: Set<string>;
  readOnly: boolean;
  onToggle: (symbol: string, checked: boolean) => void;
};

export function ManualTradeChecklist({
  items,
  currency,
  checkedSymbols,
  readOnly,
  onToggle,
}: ManualTradeChecklistProps) {
  const tradeItems = items.filter((item) => item.adjusted_amount > 0);

  if (tradeItems.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manual trade checklist</CardTitle>
        <CardDescription>
          Check off each buy after you place it in your brokerage.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {tradeItems.map((item) => {
          const symbol = item.symbol.trim().toUpperCase();
          const label =
            symbol === "CASH"
              ? `Cash reserve — ${formatPlanCurrency(item.adjusted_amount, currency)}`
              : `${symbol} — ${formatPlanCurrency(item.adjusted_amount, currency)}`;

          return (
            <label
              key={symbol}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-input px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                className="size-4 shrink-0 accent-primary"
                checked={checkedSymbols.has(symbol)}
                disabled={readOnly}
                onChange={(event) => onToggle(symbol, event.target.checked)}
              />
              <span>{label}</span>
            </label>
          );
        })}
      </CardContent>
    </Card>
  );
}
