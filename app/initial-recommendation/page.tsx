import { redirect } from "next/navigation";

import { InitialRecommendationManager } from "@/components/initial-recommendation/initial-recommendation-manager";
import { AppShell } from "@/components/layout/app-shell";
import { getInitialPlan } from "@/lib/server/initial-recommendations";
import { getPortfolioLifecycleSnapshot } from "@/lib/server/portfolio-lifecycle";
import { requireCurrentUserProfile } from "@/lib/server/profile";
import { createClient } from "@/lib/supabase/server";

export default async function InitialRecommendationPage() {
  const profile = await requireCurrentUserProfile();

  if (!profile.onboarding_completed) {
    redirect("/onboarding");
  }

  const [initialPlan, lifecycle] = await Promise.all([
    getInitialPlan(),
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
      pageTitle="Initial recommendation"
      lifecycle={lifecycle}
    >
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Initial recommendation
          </h2>
          <p className="text-muted-foreground">
            Paste your initial investment research JSON from ChatGPT. The app
            validates it, saves the report, and generates final manual buy
            amounts using the recommendation engine.
          </p>
        </div>

        <InitialRecommendationManager
          currency={profile.base_currency}
          initialPlan={initialPlan}
        />
      </div>
    </AppShell>
  );
}
