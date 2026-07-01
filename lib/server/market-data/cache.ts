import { normalizePlanSymbol } from "@/lib/monthly-plan/format";
import type { PriceBar, PriceHistory } from "@/lib/market-data/types";
import { yahooQuoteProvider } from "@/lib/server/market-data/yahoo-provider";
import type { SymbolMarketCache } from "@/types/database";

import { QUOTE_TTL_MS } from "@/lib/market-data/quote-utils";

export const HISTORY_TTL_MS = 24 * 60 * 60 * 1000;

type SupabaseClient = Awaited<
  ReturnType<typeof import("@/lib/supabase/server").createClient>
>;

function isFresh(timestamp: string | null | undefined, ttlMs: number): boolean {
  if (!timestamp) {
    return false;
  }
  return Date.now() - new Date(timestamp).getTime() < ttlMs;
}

function rowToHistory(row: SymbolMarketCache): PriceHistory | null {
  if (!row.history_json || !row.latest_price || !row.quoted_at) {
    return null;
  }

  const bars = row.history_json as PriceBar[];
  if (!Array.isArray(bars) || bars.length === 0) {
    return null;
  }

  return {
    symbol: row.symbol,
    currency: row.currency,
    bars,
    latestPrice: row.latest_price,
    quotedAt: row.quoted_at,
  };
}

export async function readCachedHistory(
  supabase: SupabaseClient,
  symbol: string,
): Promise<PriceHistory | null> {
  const normalized = normalizePlanSymbol(symbol);
  const { data, error } = await supabase
    .from("symbol_market_cache")
    .select("*")
    .eq("symbol", normalized)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  if (
    !isFresh(data.quoted_at, QUOTE_TTL_MS) ||
    !isFresh(data.history_fetched_at, HISTORY_TTL_MS)
  ) {
    return null;
  }

  return rowToHistory(data);
}

export async function upsertCachedHistory(
  supabase: SupabaseClient,
  history: PriceHistory,
): Promise<void> {
  const normalized = normalizePlanSymbol(history.symbol);
  const { error } = await supabase.from("symbol_market_cache").upsert(
    {
      symbol: normalized,
      latest_price: history.latestPrice,
      currency: history.currency,
      quoted_at: history.quotedAt,
      history_json: history.bars,
      history_fetched_at: history.quotedAt,
    },
    { onConflict: "symbol" },
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function readStaleCachedHistory(
  supabase: SupabaseClient,
  symbol: string,
): Promise<PriceHistory | null> {
  const normalized = normalizePlanSymbol(symbol);
  const { data, error } = await supabase
    .from("symbol_market_cache")
    .select("*")
    .eq("symbol", normalized)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return rowToHistory(data);
}

export async function getOrFetchHistory(
  supabase: SupabaseClient,
  symbol: string,
  force = false,
): Promise<PriceHistory> {
  if (!force) {
    const cached = await readCachedHistory(supabase, symbol);
    if (cached) {
      return cached;
    }
  }

  try {
    const fresh = await yahooQuoteProvider.fetchHistory(symbol);
    await upsertCachedHistory(supabase, fresh);
    return fresh;
  } catch (error) {
    const stale = await readStaleCachedHistory(supabase, symbol);
    if (stale) {
      return stale;
    }
    throw error instanceof Error ? error : new Error("Quote fetch failed.");
  }
}
