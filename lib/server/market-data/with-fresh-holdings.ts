import { getHoldings } from "@/lib/server/holdings";
import { getUserPortfolio } from "@/lib/server/portfolio";
import { createClient } from "@/lib/supabase/server";
import { getWatchlist } from "@/lib/server/watchlist";
import type { MarketSnapshot } from "@/lib/market-data/types";
import { normalizePlanSymbol } from "@/lib/monthly-plan/format";
import { refreshPortfolioMarket } from "@/lib/server/market-data/refresh-portfolio-market";
import type { Holding } from "@/types/database";

type FreshOptions = {
  refreshIfStale?: boolean;
  force?: boolean;
};

async function loadAuthenticatedHoldings(): Promise<{
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  holdings: Holding[];
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const holdings = (await getHoldings()) ?? [];
  return { supabase, userId: user.id, holdings };
}

// refresh stale quotes then return holdings
export async function getHoldingsWithFreshPrices(
  options: FreshOptions = {},
): Promise<Holding[]> {
  const context = await loadAuthenticatedHoldings();
  if (!context) {
    return [];
  }

  const refreshIfStale = options.refreshIfStale ?? true;
  if (!refreshIfStale && !options.force) {
    return context.holdings;
  }

  const watchlist = (await getWatchlist()) ?? [];
  const extraSymbols = watchlist.map((item) => normalizePlanSymbol(item.symbol));

  const snapshot = await refreshPortfolioMarket(context.supabase, context.holdings, {
    force: options.force ?? false,
    extraSymbols,
  });

  return snapshot.holdings;
}

export async function getMarketContext(
  options: FreshOptions = {},
): Promise<MarketSnapshot | null> {
  const context = await loadAuthenticatedHoldings();
  if (!context) {
    return null;
  }

  const watchlist = (await getWatchlist()) ?? [];
  const extraSymbols = watchlist.map((item) => normalizePlanSymbol(item.symbol));

  return refreshPortfolioMarket(context.supabase, context.holdings, {
    force: options.force ?? false,
    extraSymbols,
  });
}

export async function getPortfolioMarketSnapshot(): Promise<MarketSnapshot | null> {
  return getMarketContext({ refreshIfStale: true });
}
