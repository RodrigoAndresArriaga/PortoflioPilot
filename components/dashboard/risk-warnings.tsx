import { TriangleAlertIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PortfolioWarning } from "@/lib/engine/concentration";
import { isCashSymbol, normalizePlanSymbol } from "@/lib/monthly-plan/format";
import type { MonthlyPlanWithItems } from "@/types/database";

type RiskWarningsProps = {
  warnings: PortfolioWarning[];
  blockedBuySymbols: string[];
  monthlyPlan: MonthlyPlanWithItems | null;
};

const WARNING_TITLES: Record<PortfolioWarning["code"], string> = {
  single_stock_concentration: "Single-stock concentration",
  tech_exposure: "Tech sector concentration",
  voo_vti_redundancy: "VOO and VTI overlap",
  multiple_sp500_etfs: "Multiple S&P 500 ETFs",
  qqq_mega_cap_concentration: "QQQ and mega-cap overlap",
};

function formatPercent(value: number | undefined): string | null {
  if (value === undefined) {
    return null;
  }

  return `${value.toFixed(1)}%`;
}

function flaggedBlockedBuys(
  monthlyPlan: MonthlyPlanWithItems | null,
  blockedBuySymbols: string[],
): string[] {
  if (!monthlyPlan || blockedBuySymbols.length === 0) {
    return [];
  }

  const blocked = new Set(blockedBuySymbols.map((symbol) => normalizePlanSymbol(symbol)));

  return monthlyPlan.items
    .filter(
      (item) =>
        !isCashSymbol(item.symbol) &&
        item.adjusted_amount > 0 &&
        blocked.has(normalizePlanSymbol(item.symbol)),
    )
    .map((item) => normalizePlanSymbol(item.symbol));
}

export function RiskWarnings({
  warnings,
  blockedBuySymbols,
  monthlyPlan,
}: RiskWarningsProps) {
  if (warnings.length === 0) {
    return null;
  }

  const flaggedSymbols = flaggedBlockedBuys(monthlyPlan, blockedBuySymbols);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio risk warnings</CardTitle>
        <CardDescription>
          Concentration and overlap checks based on your current holdings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {warnings.map((warning) => (
          <Alert
            key={`${warning.code}-${warning.symbols.join("-")}`}
            variant={warning.severity === "block" ? "destructive" : "default"}
          >
            <TriangleAlertIcon />
            <AlertTitle className="flex flex-wrap items-center gap-2">
              {WARNING_TITLES[warning.code]}
              {warning.severity === "block" ? (
                <Badge variant="destructive">Buy blocked</Badge>
              ) : (
                <Badge variant="secondary">Review</Badge>
              )}
            </AlertTitle>
            <AlertDescription className="space-y-2">
              <p>{warning.message}</p>
              <p className="text-xs">
                Symbols: {warning.symbols.join(", ")}
                {formatPercent(warning.actualPercent)
                  ? ` · Current exposure ${formatPercent(warning.actualPercent)}`
                  : null}
                {formatPercent(warning.thresholdPercent)
                  ? ` · Threshold ${formatPercent(warning.thresholdPercent)}`
                  : null}
              </p>
            </AlertDescription>
          </Alert>
        ))}

        {flaggedSymbols.length > 0 ? (
          <Alert variant="destructive">
            <TriangleAlertIcon />
            <AlertTitle>Recommended buys flagged</AlertTitle>
            <AlertDescription>
              {flaggedSymbols.join(", ")} have recommended buys in this month&apos;s
              plan, but additional purchases are flagged because concentration limits
              were exceeded. Review before placing trades.
            </AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}
