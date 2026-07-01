import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPlanCurrency } from "@/lib/monthly-plan/format";

type DashboardStatsRowProps = {
  totalPortfolioValue: number;
  monthlyInvestmentAmount: number;
  nextInvestmentDate: string;
  currency: string;
};

export function DashboardStatsRow({
  totalPortfolioValue,
  monthlyInvestmentAmount,
  nextInvestmentDate,
  currency,
}: DashboardStatsRowProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total portfolio value</CardDescription>
          <CardTitle className="text-2xl tabular-nums">
            {formatPlanCurrency(totalPortfolioValue, currency)}
          </CardTitle>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Monthly investment</CardDescription>
          <CardTitle className="text-2xl tabular-nums">
            {formatPlanCurrency(monthlyInvestmentAmount, currency)}
          </CardTitle>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Next investment date</CardDescription>
          <CardTitle className="text-2xl">{nextInvestmentDate}</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
