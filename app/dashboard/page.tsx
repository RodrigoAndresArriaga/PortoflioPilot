import { redirect } from "next/navigation";

import { AllocationDonutChart } from "@/components/dashboard/allocation-donut-chart";
import { AllocationDriftSection } from "@/components/dashboard/allocation-drift-section";
import { DashboardStatsRow } from "@/components/dashboard/dashboard-stats-row";
import { DashboardStatusBadges } from "@/components/dashboard/dashboard-status-badges";
import { MonthlyPlanPreview } from "@/components/dashboard/monthly-plan-preview";
import { RiskWarnings } from "@/components/dashboard/risk-warnings";
import { WatchlistTable } from "@/components/dashboard/watchlist-table";
import { AppShell } from "@/components/layout/app-shell";
import { getDashboardData } from "@/lib/server/dashboard";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const data = await getDashboardData();

  if (!data.profile.onboarding_completed) {
    redirect("/onboarding");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const allocationLabel =
    data.allocation.mode === "symbol" ? "symbol" : "bucket";

  return (
    <AppShell profile={data.profile} email={user?.email} pageTitle="Dashboard">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Dashboard
          </h2>
          <p className="text-muted-foreground">
            Portfolio overview using your saved holdings, targets, and monthly
            plan.
          </p>
        </div>

        <DashboardStatsRow
          totalPortfolioValue={data.totalPortfolioValue}
          monthlyInvestmentAmount={data.profile.monthly_investment_amount}
          nextInvestmentDate={data.nextInvestmentDate}
          currency={data.profile.base_currency}
        />

        <DashboardStatusBadges riskProfile={data.profile.risk_profile} />

        <RiskWarnings
          warnings={data.warnings}
          blockedBuySymbols={data.blockedBuySymbols}
          monthlyPlan={data.monthlyPlan}
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <AllocationDonutChart
            title="Current allocation"
            description={`Actual ${allocationLabel} weights from your holdings.`}
            slices={data.allocation.currentSlices}
            emptyMessage="Add holdings to see your current allocation."
          />
          <AllocationDonutChart
            title="Target allocation"
            description={`Target ${allocationLabel} weights from your settings.`}
            slices={data.allocation.targetSlices}
            emptyMessage="Set target allocations in settings to see targets."
          />
        </div>

        <AllocationDriftSection driftRows={data.allocation.driftRows} />

        <MonthlyPlanPreview monthlyPlan={data.monthlyPlan} />

        <WatchlistTable watchlist={data.watchlist} />
      </div>
    </AppShell>
  );
}
