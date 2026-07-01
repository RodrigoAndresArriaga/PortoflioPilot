import Link from "next/link";

import { MonthlyPlanSummaryCard } from "@/components/monthly-plan/monthly-plan-summary";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatPlanCurrency,
  isCashSymbol,
} from "@/lib/monthly-plan/format";
import type { MonthlyPlanWithItems } from "@/types/database";
import { cn } from "@/lib/utils";

type MonthlyPlanPreviewProps = {
  monthlyPlan: MonthlyPlanWithItems | null;
};

export function MonthlyPlanPreview({ monthlyPlan }: MonthlyPlanPreviewProps) {
  if (!monthlyPlan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Latest monthly plan</CardTitle>
          <CardDescription>
            Generate a plan to see exact recommended buy amounts for your
            portfolio. You place each trade manually in your brokerage.
          </CardDescription>
          <Link href="/monthly-plan" className={cn(buttonVariants(), "mt-4 w-fit")}>
            Go to monthly plan
          </Link>
        </CardHeader>
      </Card>
    );
  }

  const buyItems = monthlyPlan.items
    .filter((item) => !isCashSymbol(item.symbol) && item.adjusted_amount > 0)
    .sort((left, right) => right.adjusted_amount - left.adjusted_amount)
    .slice(0, 3);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Latest monthly plan</h3>
          <p className="text-sm text-muted-foreground">
            Current month recommended buys from your saved plan.
          </p>
        </div>
        <Link href="/monthly-plan" className={buttonVariants({ variant: "outline" })}>
          View full plan
        </Link>
      </div>

      <MonthlyPlanSummaryCard plan={monthlyPlan.plan} items={monthlyPlan.items} />

      {buyItems.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top recommended buys</CardTitle>
            <CardDescription>
              Largest non-cash buy amounts this month.
            </CardDescription>
          </CardHeader>
          <div className="divide-y divide-border px-6 pb-6">
            {buyItems.map((item) => (
              <div
                key={item.symbol}
                className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0"
              >
                <div className="space-y-1">
                  <p className="font-medium">{item.symbol.trim().toUpperCase()}</p>
                  {item.recommendation_score != null ? (
                    <p className="text-sm text-muted-foreground">
                      Score {item.recommendation_score.toFixed(1)}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Buy</Badge>
                  <p className="font-semibold tabular-nums">
                    {formatPlanCurrency(
                      item.adjusted_amount,
                      monthlyPlan.plan.currency,
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
