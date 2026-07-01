import { AllocationsEditor } from "@/components/allocations/allocations-editor";
import { snapshotToAllocationForm } from "@/components/allocations/allocation-form-utils";
import { getHoldingsWithFreshPrices } from "@/lib/server/market-data/with-fresh-holdings";
import { requireCurrentUserProfile } from "@/lib/server/profile";
import { getTargetAllocations } from "@/lib/server/targets";
import type { HoldingInput } from "@/lib/validation/holdings";

function holdingToInput(
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

export default async function AllocationsPage() {
  const profile = await requireCurrentUserProfile();
  const [snapshot, holdingsRaw] = await Promise.all([
    getTargetAllocations(),
    getHoldingsWithFreshPrices(),
  ]);

  const holdings = holdingsRaw.map(holdingToInput);
  const initialValue = snapshotToAllocationForm(snapshot, profile.risk_profile);

  return (
    <AllocationsEditor
      initialValue={initialValue}
      riskProfile={profile.risk_profile}
      holdings={holdings}
    />
  );
}
