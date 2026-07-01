import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/database";
import type { MonthlyPlanWithItems } from "@/types/database";

type InitialInvestmentSetupCardProps = {
  profile: Profile;
  holdingsCount: number;
  initialPlan: MonthlyPlanWithItems | null;
};

export function InitialInvestmentSetupCard({
  profile,
  holdingsCount,
  initialPlan,
}: InitialInvestmentSetupCardProps) {
  const showCard =
    profile.investment_status === "not_invested_yet" || holdingsCount === 0;

  if (!showCard) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle>Initial manual investment recommendation</CardTitle>
        <CardDescription>
          Review before investing. After you place trades manually, add your
          holdings so PortfolioPilot can track future monthly plans.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Link
          href="/instructions"
          className={cn(buttonVariants({ variant: "default", size: "sm" }))}
        >
          Open instructions
        </Link>
        <Link
          href="/initial-recommendation"
          className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
        >
          Paste research JSON
        </Link>
        {initialPlan && (
          <Link
            href="/initial-recommendation"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            View initial plan
          </Link>
        )}
        <Link
          href="/onboarding?mode=resume"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          Return to setup
        </Link>
      </CardContent>
    </Card>
  );
}
