import { snapshotToAllocationForm } from "@/components/allocations/allocation-form-utils";
import { getEmailPreferences } from "@/lib/server/email-preferences";
import { getHoldings } from "@/lib/server/holdings";
import { getHoldingsWithFreshPrices } from "@/lib/server/market-data/with-fresh-holdings";
import { requireCurrentUserProfile } from "@/lib/server/profile";
import { getTargetAllocations } from "@/lib/server/targets";
import { getWatchlist } from "@/lib/server/watchlist";
import { createClient } from "@/lib/supabase/server";
import { emailPreferencesSchema } from "@/lib/validation/email-preferences";
import type { EmailPreferencesInput } from "@/lib/validation/email-preferences";
import type { HoldingInput } from "@/lib/validation/holdings";
import type { AllocationStepValue } from "@/lib/validation/onboarding";
import type { WatchlistItemInput } from "@/lib/validation/watchlist";
import type { Profile } from "@/types/database";

export type SettingsPageData = {
  profile: Profile;
  email: string | null;
  emailPreferences: EmailPreferencesInput;
  allocation: {
    initialValue: AllocationStepValue;
    holdings: HoldingInput[];
  };
  watchlist: {
    initialItems: WatchlistItemInput[];
    holdings: HoldingInput[];
  };
};

const DEFAULT_EMAIL_PREFERENCES: EmailPreferencesInput = {
  email_alerts_enabled: true,
  email_monthly_plan_ready: true,
  email_urgent_risk: true,
  email_weekly_summary: true,
  email_investment_reminder: true,
  email_concentration_warning: true,
  email_manual_review: true,
};

function holdingWithFreshPricesToInput(
  holding: Awaited<ReturnType<typeof getHoldingsWithFreshPrices>>[number],
): HoldingInput {
  return {
    symbol: holding.symbol,
    asset_name: holding.asset_name,
    asset_type: holding.asset_type,
    currency: holding.currency as HoldingInput["currency"],
    current_value: holding.current_value,
    cost_basis: holding.cost_basis,
    shares: holding.shares,
    broker: holding.broker,
  };
}

function holdingToInput(
  holding: NonNullable<Awaited<ReturnType<typeof getHoldings>>>[number],
): HoldingInput {
  return {
    symbol: holding.symbol,
    asset_name: holding.asset_name,
    asset_type: holding.asset_type,
    currency: holding.currency as HoldingInput["currency"],
    current_value: holding.current_value,
    cost_basis: holding.cost_basis,
    shares: holding.shares,
    broker: holding.broker,
  };
}

function watchlistToInput(
  items: NonNullable<Awaited<ReturnType<typeof getWatchlist>>>,
): WatchlistItemInput[] {
  return items.map((item) => ({
    symbol: item.symbol,
    asset_name: item.asset_name,
    asset_type: item.asset_type,
    bucket: item.bucket,
    sort_order: item.sort_order,
  }));
}

export async function getSettingsPageData(): Promise<SettingsPageData> {
  const profile = await requireCurrentUserProfile();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    emailPreferencesRaw,
    allocationSnapshot,
    holdingsWithFreshPrices,
    watchlistRaw,
    holdingsRaw,
  ] = await Promise.all([
    getEmailPreferences(),
    getTargetAllocations(),
    getHoldingsWithFreshPrices(),
    getWatchlist(),
    getHoldings(),
  ]);

  const emailPreferences = emailPreferencesSchema.parse(
    emailPreferencesRaw ?? DEFAULT_EMAIL_PREFERENCES,
  );

  const allocationHoldings = holdingsWithFreshPrices.map(
    holdingWithFreshPricesToInput,
  );
  const watchlistHoldings = (holdingsRaw ?? []).map(holdingToInput);

  return {
    profile,
    email: user?.email ?? null,
    emailPreferences,
    allocation: {
      initialValue: snapshotToAllocationForm(
        allocationSnapshot,
        profile.risk_profile,
      ),
      holdings: allocationHoldings,
    },
    watchlist: {
      initialItems: watchlistToInput(watchlistRaw ?? []),
      holdings: watchlistHoldings,
    },
  };
}
