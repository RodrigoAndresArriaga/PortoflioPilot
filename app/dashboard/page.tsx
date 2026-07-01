import { redirect } from "next/navigation";

import { InitialInvestmentSetupCard } from "@/components/dashboard/initial-investment-setup-card";
import { AllocationDonutChart } from "@/components/dashboard/allocation-donut-chart";
import { DashboardStatsRow } from "@/components/dashboard/dashboard-stats-row";
import { DashboardStatusBadges } from "@/components/dashboard/dashboard-status-badges";
import { EngineRationalePanel } from "@/components/dashboard/engine-rationale-panel";
import { MonthlyPlanPreview } from "@/components/dashboard/monthly-plan-preview";
import { MonthlyPlanTransitionCard } from "@/components/dashboard/monthly-plan-transition-card";
import { RecommendationScoreCards } from "@/components/dashboard/recommendation-score-cards";
import { RiskWarnings } from "@/components/dashboard/risk-warnings";
import { WatchlistTable } from "@/components/dashboard/watchlist-table";
import { AppShell } from "@/components/layout/app-shell";
import { getInitialPlan } from "@/lib/server/initial-recommendations";
import { getDashboardData } from "@/lib/server/dashboard";
import { getPortfolioLifecycleSnapshot } from "@/lib/server/portfolio-lifecycle";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const [data, initialPlan, lifecycle] = await Promise.all([
    getDashboardData(),
    getInitialPlan(),
    getPortfolioLifecycleSnapshot(),
  ]);

  if (!data.profile.onboarding_completed) {
    redirect("/onboarding");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const topRecommendation = data.topRecommendations[0] ?? null;
  const holdingsCount = lifecycle?.holdingsCount ?? 0;
  const showInitialSetupCard =
    lifecycle?.stage === "initial_setup" ||
    lifecycle?.stage === "initial_plan_ready";

  return (
    <AppShell
      profile={data.profile}
      email={user?.email}
      pageTitle="Dashboard"
      lifecycle={lifecycle}
    >
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Dashboard
          </h2>
          <p className="text-muted-foreground">
            Portfolio overview powered by the recommendation engine, your
            holdings, and latest monthly plan.
          </p>
        </div>

        {lifecycle ? (
          <MonthlyPlanTransitionCard lifecycle={lifecycle} />
        ) : null}

        {showInitialSetupCard ? (
          <InitialInvestmentSetupCard
            profile={data.profile}
            holdingsCount={holdingsCount}
            initialPlan={initialPlan}
          />
        ) : null}

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
            title="Current exposure"
            description="Actual weights from your holdings."
            slices={data.exposure.currentSlices}
            emptyMessage="Add holdings to see your current exposure."
          />
          <EngineRationalePanel topRecommendation={topRecommendation} />
        </div>

        <RecommendationScoreCards recommendations={data.topRecommendations} />

        <MonthlyPlanPreview monthlyPlan={data.monthlyPlan} />

        <WatchlistTable watchlist={data.watchlist} />
      </div>
    </AppShell>
  );
}
