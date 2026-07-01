import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PortfolioLifecycleSnapshot } from "@/lib/server/portfolio-lifecycle";
import { cn } from "@/lib/utils";

type MonthlyPlanTransitionCardProps = {
  lifecycle: PortfolioLifecycleSnapshot;
};

export function MonthlyPlanTransitionCard({
  lifecycle,
}: MonthlyPlanTransitionCardProps) {
  if (lifecycle.stage !== "ready_for_first_monthly") {
    return null;
  }

  const { monthlyPlanReadiness } = lifecycle;

  return (
    <Card className="border-secondary/30 bg-secondary/5">
      <CardHeader>
        <CardTitle>First regular monthly plan</CardTitle>
        <CardDescription>
          Your initial recommendation flow is complete and holdings are in
          place. Generate your first regular monthly plan when you are ready.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {monthlyPlanReadiness.usesNeutralNewsDefaults ? (
          <p className="text-sm text-muted-foreground">
            No weekly news report is saved yet. The recommendation engine will
            use neutral news defaults — you can generate a plan now and add news
            later.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Weekly news context is available. Review amounts on the monthly plan
            page before investing manually.
          </p>
        )}

        {!monthlyPlanReadiness.canGenerate ? (
          <p className="text-sm text-destructive">
            {monthlyPlanReadiness.blockingReason}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Link
            href="/monthly-plan"
            className={cn(
              buttonVariants({ variant: "default", size: "sm" }),
              !monthlyPlanReadiness.canGenerate && "pointer-events-none opacity-50",
            )}
          >
            Go to monthly plan
          </Link>
          <Link
            href="/initial-recommendation"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            View initial plan
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
