"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { parseZodError, requireAuthUser } from "@/lib/server/auth";
import { createClient } from "@/lib/supabase/server";
import { baseCurrencySchema } from "@/lib/validation/common";
import type { Portfolio } from "@/types/database";

export type CreatePortfolioResult =
  | { ok: true; data: Portfolio }
  | { ok: false; error: string };

const createPortfolioSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  base_currency: baseCurrencySchema.optional(),
});

export async function getUserPortfolio(userId: string): Promise<Portfolio | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("portfolios")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function requireUserPortfolio(
  userId: string,
): Promise<Portfolio | null> {
  return getUserPortfolio(userId);
}

export async function getPortfolio(): Promise<Portfolio | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return getUserPortfolio(user.id);
}

export async function createPortfolio(
  raw?: unknown,
): Promise<CreatePortfolioResult> {
  const auth = await requireAuthUser();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  let payload: z.infer<typeof createPortfolioSchema> = {};
  if (raw !== undefined) {
    try {
      payload = createPortfolioSchema.parse(raw);
    } catch (error) {
      return { ok: false, error: parseZodError(error) };
    }
  }

  const { supabase, user } = auth;

  const { data: existing, error: checkError } = await supabase
    .from("portfolios")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (checkError) {
    return { ok: false, error: checkError.message };
  }

  if (existing) {
    return { ok: false, error: "A portfolio already exists." };
  }

  const { data, error } = await supabase
    .from("portfolios")
    .insert({
      user_id: user.id,
      name: payload.name?.trim() || "My Portfolio",
      base_currency: payload.base_currency ?? "MXN",
    })
    .select("*")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? "Failed to create portfolio.",
    };
  }

  revalidatePath("/dashboard");

  return { ok: true, data };
}
