import { roundMoney } from "@/lib/engine/math";
import { isQuotedMarketAsset } from "@/lib/market-data/asset-utils";
import { normalizePlanSymbol } from "@/lib/monthly-plan/format";
import { getOrFetchHistory } from "@/lib/server/market-data/cache";
import type { Holding } from "@/types/database";

type SupabaseClient = Awaited<
  ReturnType<typeof import("@/lib/supabase/server").createClient>
>;

function computeMarketValue(shares: number, price: number): number {
  return roundMoney(shares * price, 2);
}

// refresh one holding from cached or live quote
export async function refreshHoldingValuation(
  supabase: SupabaseClient,
  holding: Holding,
  force = false,
): Promise<Holding> {
  if (!isQuotedMarketAsset(holding.asset_type)) {
    return holding;
  }

  const shares = holding.shares ?? 0;
  if (shares <= 0) {
    return holding;
  }

  const history = await getOrFetchHistory(supabase, holding.symbol, force);
  const currentValue = computeMarketValue(shares, history.latestPrice);

  const { data, error } = await supabase
    .from("holdings")
    .update({
      last_price: history.latestPrice,
      last_price_at: history.quotedAt,
      price_source: "yahoo",
      current_value: currentValue,
    })
    .eq("id", holding.id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update holding valuation.");
  }

  return data;
}

export async function refreshHoldingsValuations(
  supabase: SupabaseClient,
  holdings: Holding[],
  force = false,
): Promise<Holding[]> {
  const quoted = holdings.filter((holding) =>
    isQuotedMarketAsset(holding.asset_type),
  );

  const refreshed = await Promise.all(
    quoted.map(async (holding) => {
      try {
        return await refreshHoldingValuation(supabase, holding, force);
      } catch {
        return holding;
      }
    }),
  );

  const refreshedById = new Map(refreshed.map((holding) => [holding.id, holding]));
  return holdings.map((holding) => refreshedById.get(holding.id) ?? holding);
}

export function collectQuotedSymbols(holdings: Holding[]): string[] {
  const symbols = new Set<string>();
  for (const holding of holdings) {
    if (isQuotedMarketAsset(holding.asset_type)) {
      symbols.add(normalizePlanSymbol(holding.symbol));
    }
  }
  return Array.from(symbols);
}
