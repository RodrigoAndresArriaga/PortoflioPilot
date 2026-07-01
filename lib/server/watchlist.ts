"use server";

import { revalidatePath } from "next/cache";

import { parseZodError, requireAuthUser } from "@/lib/server/auth";
import { createClient } from "@/lib/supabase/server";
import { upsertWatchlistSchema } from "@/lib/validation/watchlist";
import type { WatchlistItem } from "@/types/database";

export type UpsertWatchlistResult =
  | { ok: true; data: WatchlistItem[] }
  | { ok: false; error: string };

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

export async function getWatchlist(): Promise<WatchlistItem[] | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("watchlist_items")
    .select("*")
    .eq("user_id", user.id)
    .order("sort_order");

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function upsertWatchlist(
  raw: unknown,
): Promise<UpsertWatchlistResult> {
  const auth = await requireAuthUser();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  let payload;
  try {
    payload = upsertWatchlistSchema.parse(raw);
  } catch (error) {
    return { ok: false, error: parseZodError(error) };
  }

  const { supabase, user } = auth;

  const { error: deleteError } = await supabase
    .from("watchlist_items")
    .delete()
    .eq("user_id", user.id);

  if (deleteError) {
    return { ok: false, error: deleteError.message };
  }

  const watchlistRows = payload.watchlist.map((item) => ({
    user_id: user.id,
    symbol: normalizeSymbol(item.symbol),
    asset_name: item.asset_name?.trim() || null,
    asset_type: item.asset_type ?? null,
    bucket: item.bucket ?? null,
    enabled: true,
    sort_order: item.sort_order,
  }));

  const { data, error } = await supabase
    .from("watchlist_items")
    .insert(watchlistRows)
    .select("*")
    .order("sort_order");

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? "Failed to update watchlist.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings/watchlist");

  return { ok: true, data };
}
