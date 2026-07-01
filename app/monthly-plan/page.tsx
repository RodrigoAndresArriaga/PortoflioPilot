import { redirect } from "next/navigation";

import { MonthlyPlanManager } from "@/components/monthly-plan/monthly-plan-manager";
import { AppShell } from "@/components/layout/app-shell";
import { getCurrentMonthKey, getMonthlyPlan } from "@/lib/server/monthly-plans";
import { getMarketContext } from "@/lib/server/market-data/with-fresh-holdings";
import { getPortfolioLifecycleSnapshot } from "@/lib/server/portfolio-lifecycle";
import { requireCurrentUserProfile } from "@/lib/server/profile";
import { createClient } from "@/lib/supabase/server";

export default async function MonthlyPlanPage() {
  const profile = await requireCurrentUserProfile();

  if (!profile.onboarding_completed) {
    redirect("/onboarding");
  }

  const month = getCurrentMonthKey();
  await getMarketContext();
  const [plan, lifecycle] = await Promise.all([
    getMonthlyPlan(month),
    getPortfolioLifecycleSnapshot(),
  ]);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <AppShell
      profile={profile}
      email={user?.email}
      pageTitle="Monthly plan"
      lifecycle={lifecycle}
    >
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Monthly plan
          </h2>
          <p className="text-muted-foreground">
            Exact recommended buy amounts for this month. Place each trade
            manually in your brokerage.
          </p>
        </div>

        <MonthlyPlanManager
          initialPlan={plan}
          month={month}
          readiness={lifecycle?.monthlyPlanReadiness ?? null}
          showTransitionHint={lifecycle?.stage === "ready_for_first_monthly"}
        />
      </div>
    </AppShell>
  );
}
