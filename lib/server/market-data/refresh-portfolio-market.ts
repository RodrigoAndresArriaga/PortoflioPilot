import { buildAssetScoresFromHistory } from "@/lib/market-data/build-asset-scores";
import { isQuotedMarketAsset } from "@/lib/market-data/asset-utils";
import { isQuoteStale } from "@/lib/market-data/quote-utils";
import type { MarketSnapshot, Quote } from "@/lib/market-data/types";
import { normalizePlanSymbol } from "@/lib/monthly-plan/format";
import {
  getOrFetchHistory,
  readCachedHistory,
} from "@/lib/server/market-data/cache";
import {
  collectQuotedSymbols,
  refreshHoldingsValuations,
} from "@/lib/server/market-data/refresh-holdings";
import type { AssetScoreResult } from "@/lib/engine/scores";
import type { Holding } from "@/types/database";

const BENCHMARK_SYMBOL = "SPY";

type SupabaseClient = Awaited<
  ReturnType<typeof import("@/lib/supabase/server").createClient>
>;

type RefreshOptions = {
  force?: boolean;
  extraSymbols?: string[];
};

function historyToQuote(symbol: string, history: Awaited<ReturnType<typeof getOrFetchHistory>>): Quote {
  return {
    symbol,
    price: history.latestPrice,
    currency: history.currency,
    quotedAt: history.quotedAt,
  };
}

async function needsRefresh(
  supabase: SupabaseClient,
  symbol: string,
  force: boolean,
): Promise<boolean> {
  if (force) {
    return true;
  }
  const cached = await readCachedHistory(supabase, symbol);
  return !cached;
}

// fetch quotes, revalue holdings, build technical scores
export async function refreshPortfolioMarket(
  supabase: SupabaseClient,
  holdings: Holding[],
  options: RefreshOptions = {},
): Promise<MarketSnapshot> {
  const force = options.force ?? false;
  const symbolSet = new Set(collectQuotedSymbols(holdings));
  for (const symbol of options.extraSymbols ?? []) {
    symbolSet.add(normalizePlanSymbol(symbol));
  }

  const symbols = Array.from(symbolSet);
  const staleSymbols = await Promise.all(
    symbols.map(async (symbol) =>
      (await needsRefresh(supabase, symbol, force)) ? symbol : null,
    ),
  );
  const toFetch = staleSymbols.filter((symbol): symbol is string => symbol !== null);

  if (toFetch.length > 0 || force) {
    await Promise.all(
      symbols.map((symbol) =>
        getOrFetchHistory(supabase, symbol, force).catch(() => null),
      ),
    );
  }

  const refreshedHoldings = await refreshHoldingsValuations(
    supabase,
    holdings,
    force,
  );

  let benchmarkBars: Awaited<ReturnType<typeof getOrFetchHistory>>["bars"] = [];
  try {
    const benchmark = await getOrFetchHistory(supabase, BENCHMARK_SYMBOL, false);
    benchmarkBars = benchmark.bars;
  } catch {
    benchmarkBars = [];
  }

  const quotes: Record<string, Quote> = {};
  const technicalScores: AssetScoreResult[] = [];

  for (const symbol of symbols) {
    try {
      const history = await getOrFetchHistory(supabase, symbol, false);
      quotes[symbol] = historyToQuote(symbol, history);

      const holding = refreshedHoldings.find(
        (row) =>
          isQuotedMarketAsset(row.asset_type) &&
          normalizePlanSymbol(row.symbol) === symbol,
      );
      if (!holding) {
        continue;
      }

      technicalScores.push(
        buildAssetScoresFromHistory({
          symbol,
          assetType: holding.asset_type,
          bars: history.bars,
          benchmarkBars,
        }),
      );
    } catch {
      // skip symbols without usable history
    }
  }

  return {
    holdings: refreshedHoldings,
    quotes,
    technicalScores,
    refreshedAt: new Date().toISOString(),
  };
}

export async function getTechnicalScoresForSymbols(
  supabase: SupabaseClient,
  symbols: string[],
): Promise<AssetScoreResult[]> {
  const normalized = symbols.map((symbol) => normalizePlanSymbol(symbol));
  let benchmarkBars: Awaited<ReturnType<typeof getOrFetchHistory>>["bars"] = [];

  try {
    benchmarkBars = (await getOrFetchHistory(supabase, BENCHMARK_SYMBOL, false)).bars;
  } catch {
    benchmarkBars = [];
  }

  const scores: AssetScoreResult[] = [];
  for (const symbol of normalized) {
    try {
      const history = await getOrFetchHistory(supabase, symbol, false);
      scores.push(
        buildAssetScoresFromHistory({
          symbol,
          assetType: "stock",
          bars: history.bars,
          benchmarkBars,
        }),
      );
    } catch {
      // skip failed symbols
    }
  }

  return scores;
}

export function isHoldingQuoteStale(holding: Holding): boolean {
  if (!isQuotedMarketAsset(holding.asset_type)) {
    return false;
  }
  return isQuoteStale(holding.last_price_at);
}
