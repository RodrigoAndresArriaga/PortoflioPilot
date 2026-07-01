"use server";

import { revalidatePath } from "next/cache";

import { requireAuthUser } from "@/lib/server/auth";
import { getHoldings } from "@/lib/server/holdings";
import { refreshPortfolioMarket } from "@/lib/server/market-data/refresh-portfolio-market";

export type RefreshPricesResult =
  | { ok: true }
  | { ok: false; error: string };

export async function refreshPortfolioPrices(): Promise<RefreshPricesResult> {
  const auth = await requireAuthUser();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const holdings = (await getHoldings()) ?? [];
  if (holdings.length === 0) {
    return { ok: true };
  }

  try {
    await refreshPortfolioMarket(auth.supabase, holdings, { force: true });
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Price refresh failed.",
    };
  }

  revalidatePath("/holdings");
  revalidatePath("/dashboard");
  revalidatePath("/monthly-plan");
  revalidatePath("/settings");

  return { ok: true };
}
