"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPlanCurrency } from "@/lib/monthly-plan/format";
import type { MonthlyPlanItemInput } from "@/lib/validation/monthly-plan";

type CashReserveCardProps = {
  item: MonthlyPlanItemInput;
  currency: string;
  readOnly: boolean;
  onAmountChange: (symbol: string, amount: number) => void;
};

export function CashReserveCard({
  item,
  currency,
  readOnly,
  onAmountChange,
}: CashReserveCardProps) {
  const symbol = item.symbol.trim().toUpperCase();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash reserve</CardTitle>
        <CardDescription>
          Keep this amount as brokerage cash for flexibility.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {readOnly ? (
          <p className="text-lg font-semibold tabular-nums">
            {formatPlanCurrency(item.adjusted_amount, currency)}
          </p>
        ) : (
          <div className="max-w-[200px] space-y-1">
            <Label htmlFor={`cash-${symbol}`}>Cash reserve amount</Label>
            <Input
              id={`cash-${symbol}`}
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
        <p className="text-sm text-muted-foreground">{item.reason}</p>
      </CardContent>
    </Card>
  );
}
