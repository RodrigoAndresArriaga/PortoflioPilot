import { redirect } from "next/navigation";

import { InstructionsContent } from "@/components/instructions/instructions-content";
import { AppShell } from "@/components/layout/app-shell";
import { resolveInitialInvestmentAmount } from "@/lib/engine/initial-investment";
import { buildDailyUrgentPrompt } from "@/lib/prompts/daily-urgent";
import { buildInitialInvestmentResearchPrompt } from "@/lib/prompts/initial-investment-research";
import { buildMonthlyReviewPrompt } from "@/lib/prompts/monthly-review";
import { buildWeeklyReviewPrompt } from "@/lib/prompts/weekly-review";
import { getPortfolioLifecycleSnapshot } from "@/lib/server/portfolio-lifecycle";
import { requireCurrentUserProfile } from "@/lib/server/profile";
import { getWatchlist } from "@/lib/server/watchlist";
import { createClient } from "@/lib/supabase/server";

export default async function InstructionsPage() {
  const profile = await requireCurrentUserProfile();

  if (!profile.onboarding_completed) {
    redirect("/onboarding");
  }

  const [watchlist, lifecycle] = await Promise.all([
    getWatchlist(),
    getPortfolioLifecycleSnapshot(),
  ]);

  const symbols = (watchlist ?? [])
    .filter((item) => item.enabled)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((item) => item.symbol.trim().toUpperCase());

  const dailyPrompt = buildDailyUrgentPrompt(symbols);
  const weeklyPrompt = buildWeeklyReviewPrompt(symbols);
  const monthlyPrompt = buildMonthlyReviewPrompt(symbols);
  const initialInvestmentPrompt = buildInitialInvestmentResearchPrompt({
    currency: profile.base_currency,
    monthlyAmount: profile.monthly_investment_amount,
    initialInvestmentAmount: resolveInitialInvestmentAmount(profile),
    riskProfile: profile.risk_profile,
    timeHorizon: profile.time_horizon,
    watchlist: symbols,
  });

  const showInitialPrompt =
    lifecycle?.stage === "initial_setup" ||
    lifecycle?.stage === "initial_plan_ready";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <AppShell
      profile={profile}
      email={user?.email}
      pageTitle="Instructions"
      lifecycle={lifecycle}
    >
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Instructions
          </h2>
          <p className="text-muted-foreground">
            Learn how PortfolioPilot works and copy personalized ChatGPT
            Scheduled Task prompts. This is a manual-only workflow — no
            automatic trading or API connections.
          </p>
        </div>

        <InstructionsContent
          symbols={symbols}
          dailyPrompt={dailyPrompt}
          weeklyPrompt={weeklyPrompt}
          monthlyPrompt={monthlyPrompt}
          initialInvestmentPrompt={initialInvestmentPrompt}
          showInitialPrompt={showInitialPrompt}
        />
      </div>
    </AppShell>
  );
}
