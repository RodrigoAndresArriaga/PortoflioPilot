import { NextResponse } from "next/server";

import { isQuotedMarketAsset } from "@/lib/market-data/asset-utils";
import { normalizePlanSymbol } from "@/lib/monthly-plan/format";
import { getOrFetchHistory } from "@/lib/server/market-data/cache";
import { refreshHoldingsValuations } from "@/lib/server/market-data/refresh-holdings";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Holding } from "@/types/database";

function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return false;
  }
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

// daily refresh of shared quote cache and holding valuations
export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const { data: holdings, error } = await supabase
      .from("holdings")
      .select("*")
      .in("asset_type", ["etf", "stock"]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const symbols = new Set<string>();
    for (const holding of holdings ?? []) {
      if (isQuotedMarketAsset(holding.asset_type as Holding["asset_type"])) {
        symbols.add(normalizePlanSymbol(holding.symbol));
      }
    }

    await Promise.all(
      Array.from(symbols).map((symbol) =>
        getOrFetchHistory(supabase, symbol, true).catch(() => null),
      ),
    );

    const holdingsByUser = new Map<string, Holding[]>();
    for (const holding of (holdings ?? []) as Holding[]) {
      const key = `${holding.user_id}:${holding.portfolio_id}`;
      const bucket = holdingsByUser.get(key) ?? [];
      bucket.push(holding);
      holdingsByUser.set(key, bucket);
    }

    for (const bucket of holdingsByUser.values()) {
      await refreshHoldingsValuations(supabase, bucket, false);
    }

    return NextResponse.json({
      ok: true,
      symbols: symbols.size,
      holdings: holdings?.length ?? 0,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Cron refresh failed.",
      },
      { status: 500 },
    );
  }
}
