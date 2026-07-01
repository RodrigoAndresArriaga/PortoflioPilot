import { redirect } from "next/navigation";

import { InstructionsContent } from "@/components/instructions/instructions-content";
import { AppShell } from "@/components/layout/app-shell";
import { buildDailyUrgentPrompt } from "@/lib/prompts/daily-urgent";
import { buildMonthlyReviewPrompt } from "@/lib/prompts/monthly-review";
import { buildWeeklyReviewPrompt } from "@/lib/prompts/weekly-review";
import { requireCurrentUserProfile } from "@/lib/server/profile";
import { getWatchlist } from "@/lib/server/watchlist";
import { createClient } from "@/lib/supabase/server";

export default async function InstructionsPage() {
  const profile = await requireCurrentUserProfile();

  if (!profile.onboarding_completed) {
    redirect("/onboarding");
  }

  const watchlist = await getWatchlist();
  const symbols = (watchlist ?? [])
    .filter((item) => item.enabled)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((item) => item.symbol.trim().toUpperCase());

  const dailyPrompt = buildDailyUrgentPrompt(symbols);
  const weeklyPrompt = buildWeeklyReviewPrompt(symbols);
  const monthlyPrompt = buildMonthlyReviewPrompt(symbols);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <AppShell profile={profile} email={user?.email} pageTitle="Instructions">
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
        />
      </div>
    </AppShell>
  );
}
