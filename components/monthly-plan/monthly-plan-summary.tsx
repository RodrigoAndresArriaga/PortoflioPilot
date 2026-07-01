"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatMonthLabel,
  formatPlanCurrency,
} from "@/lib/monthly-plan/format";
import { computeMonthlyPlanSummary } from "@/lib/monthly-plan/summary";
import type { MonthlyPlan, MonthlyPlanItem } from "@/types/database";

type MonthlyPlanSummaryProps = {
  plan: MonthlyPlan;
  items: Pick<MonthlyPlanItem, "symbol" | "adjusted_amount">[];
};

export function MonthlyPlanSummaryCard({ plan, items }: MonthlyPlanSummaryProps) {
  const summary = computeMonthlyPlanSummary(plan.monthly_amount, items);
  const statusLabel = plan.status === "completed" ? "Completed" : "Draft";

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>{formatMonthLabel(plan.month)}</CardTitle>
          <Badge variant={plan.status === "completed" ? "default" : "secondary"}>
            {statusLabel}
          </Badge>
        </div>
        <CardDescription>
          Recommended manual buys based on your target allocation.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <SummaryRow
          label="Total to invest"
          value={formatPlanCurrency(plan.monthly_amount, plan.currency)}
        />
        <SummaryRow
          label="Allocated to assets"
          value={formatPlanCurrency(summary.allocatedToAssets, plan.currency)}
        />
        <SummaryRow
          label="Cash reserve"
          value={formatPlanCurrency(summary.cashReserve, plan.currency)}
        />
        <SummaryRow
          label="Manual trades"
          value={String(summary.manualTradeCount)}
        />
        {summary.unallocated !== 0 ? (
          <div className="sm:col-span-2">
            <SummaryRow
              label="Unallocated"
              value={formatPlanCurrency(summary.unallocated, plan.currency)}
              muted
            />
          </div>
        ) : null}
        {summary.totalAllocated > plan.monthly_amount ? (
          <p className="text-sm text-destructive sm:col-span-2">
            Allocated amounts exceed your monthly budget. Adjust buy amounts
            before saving.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function SummaryRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={muted ? "text-sm text-muted-foreground" : "text-lg font-semibold"}>
        {value}
      </p>
    </div>
  );
}
