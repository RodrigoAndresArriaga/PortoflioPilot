"use server";

import { revalidatePath } from "next/cache";

import { parseZodError, requireAuthUser } from "@/lib/server/auth";
import { getUserPortfolio } from "@/lib/server/portfolio";
import { createClient } from "@/lib/supabase/server";
import {
  createHoldingSchema,
  updateHoldingSchema,
} from "@/lib/validation/holdings";
import type { Holding } from "@/types/database";

export type MutationResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

function isDuplicateSymbolError(message: string): boolean {
  return message.includes("holdings_portfolio_id_symbol_key");
}

export async function getHoldings(): Promise<Holding[] | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const portfolio = await getUserPortfolio(user.id);
  if (!portfolio) {
    return [];
  }

  const { data, error } = await supabase
    .from("holdings")
    .select("*")
    .eq("user_id", user.id)
    .eq("portfolio_id", portfolio.id)
    .order("symbol");

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createHolding(
  raw: unknown,
): Promise<MutationResult<Holding>> {
  const auth = await requireAuthUser();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  let payload;
  try {
    payload = createHoldingSchema.parse(raw);
  } catch (error) {
    return { ok: false, error: parseZodError(error) };
  }

  const { supabase, user } = auth;
  const portfolio = await getUserPortfolio(user.id);

  if (!portfolio) {
    return { ok: false, error: "Portfolio not found." };
  }

  const { data, error } = await supabase
    .from("holdings")
    .insert({
      user_id: user.id,
      portfolio_id: portfolio.id,
      symbol: normalizeSymbol(payload.symbol),
      asset_name: payload.asset_name?.trim() || null,
      asset_type: payload.asset_type,
      currency: payload.currency,
      current_value: payload.current_value,
      cost_basis: payload.cost_basis ?? null,
      shares: payload.shares ?? null,
      broker: payload.broker?.trim() || null,
    })
    .select("*")
    .single();

  if (error || !data) {
    if (error && isDuplicateSymbolError(error.message)) {
      return {
        ok: false,
        error: "A holding with this symbol already exists in your portfolio.",
      };
    }
    return {
      ok: false,
      error: error?.message ?? "Failed to create holding.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/holdings");

  return { ok: true, data };
}

export async function updateHolding(
  raw: unknown,
): Promise<MutationResult<Holding>> {
  const auth = await requireAuthUser();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  let payload;
  try {
    payload = updateHoldingSchema.parse(raw);
  } catch (error) {
    return { ok: false, error: parseZodError(error) };
  }

  const { supabase, user } = auth;
  const { id, ...fields } = payload;
  const updateFields: Record<string, unknown> = {};

  if (fields.symbol !== undefined) {
    updateFields.symbol = normalizeSymbol(fields.symbol);
  }
  if (fields.asset_name !== undefined) {
    updateFields.asset_name = fields.asset_name?.trim() || null;
  }
  if (fields.asset_type !== undefined) {
    updateFields.asset_type = fields.asset_type;
  }
  if (fields.currency !== undefined) {
    updateFields.currency = fields.currency;
  }
  if (fields.current_value !== undefined) {
    updateFields.current_value = fields.current_value;
  }
  if (fields.cost_basis !== undefined) {
    updateFields.cost_basis = fields.cost_basis;
  }
  if (fields.shares !== undefined) {
    updateFields.shares = fields.shares;
  }
  if (fields.broker !== undefined) {
    updateFields.broker = fields.broker?.trim() || null;
  }

  const { data, error } = await supabase
    .from("holdings")
    .update(updateFields)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error || !data) {
    if (error && isDuplicateSymbolError(error.message)) {
      return {
        ok: false,
        error: "A holding with this symbol already exists in your portfolio.",
      };
    }
    return {
      ok: false,
      error: error?.message ?? "Failed to update holding.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/holdings");

  return { ok: true, data };
}

export async function deleteHolding(
  holdingId: string,
): Promise<MutationResult> {
  const auth = await requireAuthUser();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const { supabase, user } = auth;

  const { error } = await supabase
    .from("holdings")
    .delete()
    .eq("id", holdingId)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/holdings");

  return { ok: true, data: undefined };
}
