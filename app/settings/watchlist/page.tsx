import { WatchlistEditor } from "@/components/watchlist/watchlist-editor";
import { getHoldings } from "@/lib/server/holdings";
import { requireCurrentUserProfile } from "@/lib/server/profile";
import { getWatchlist } from "@/lib/server/watchlist";
import type { HoldingInput } from "@/lib/validation/holdings";
import type { WatchlistItemInput } from "@/lib/validation/watchlist";

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

export default async function WatchlistPage() {
  await requireCurrentUserProfile();
  const [watchlistRaw, holdingsRaw] = await Promise.all([
    getWatchlist(),
    getHoldings(),
  ]);

  const initialWatchlist = watchlistToInput(watchlistRaw ?? []);
  const holdings = (holdingsRaw ?? []).map(holdingToInput);

  return (
    <WatchlistEditor initialWatchlist={initialWatchlist} holdings={holdings} />
  );
}
