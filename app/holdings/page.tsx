import { redirect } from "next/navigation";

import { HoldingsManager } from "@/components/holdings/holdings-manager";
import { AppShell } from "@/components/layout/app-shell";
import { getHoldingsWithFreshPrices } from "@/lib/server/market-data/with-fresh-holdings";
import { requireCurrentUserProfile } from "@/lib/server/profile";
import { createClient } from "@/lib/supabase/server";

export default async function HoldingsPage() {
  const profile = await requireCurrentUserProfile();

  if (!profile.onboarding_completed) {
    redirect("/onboarding");
  }

  const holdings = await getHoldingsWithFreshPrices();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <AppShell profile={profile} email={user?.email} pageTitle="Holdings">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Holdings
          </h2>
          <p className="text-muted-foreground">
            Manage your current positions. Weights use current market value.
          </p>
        </div>

        <HoldingsManager
          initialHoldings={holdings}
          baseCurrency={profile.base_currency}
        />
      </div>
    </AppShell>
  );
}
