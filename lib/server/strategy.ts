"use server";

import { revalidatePath } from "next/cache";

import { parseZodError, requireAuthUser } from "@/lib/server/auth";
import {
  strategyPreferencesSchema,
  type StrategyPreferencesInput,
} from "@/lib/validation/strategy";
import type { Profile } from "@/types/database";

export type MutationResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function updateStrategyPreferences(
  raw: unknown,
): Promise<MutationResult<Profile>> {
  const auth = await requireAuthUser();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  let payload: StrategyPreferencesInput;
  try {
    payload = strategyPreferencesSchema.parse(raw);
  } catch (error) {
    return { ok: false, error: parseZodError(error) };
  }

  const { data, error } = await auth.supabase
    .from("profiles")
    .update({
      risk_profile: payload.risk_profile,
      time_horizon: payload.time_horizon,
      broad_etf_priority: payload.broad_etf_priority,
      cash_reserve_percent: payload.cash_reserve_percent,
      max_individual_stock_percent: payload.max_individual_stock_percent,
    })
    .eq("id", auth.user.id)
    .select("*")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? "Failed to update strategy preferences.",
    };
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/monthly-plan");

  return { ok: true, data };
}
