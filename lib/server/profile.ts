"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { parseZodError, requireAuthUser } from "@/lib/server/auth";
import { getUserPortfolio } from "@/lib/server/portfolio";
import { createClient } from "@/lib/supabase/server";
import {
  baseCurrencySchema,
  riskProfileSchema,
  timeHorizonSchema,
} from "@/lib/validation/common";
import type { Profile } from "@/types/database";

export type UpdateUserProfileResult =
  | { ok: true; data: Profile }
  | { ok: false; error: string };

const updateUserProfileSchema = z
  .object({
    full_name: z.string().trim().max(100).optional().nullable(),
    base_currency: baseCurrencySchema.optional(),
    monthly_investment_amount: z.coerce
      .number()
      .min(0, "Monthly amount must be zero or greater")
      .optional(),
    initial_investment_amount: z.coerce
      .number()
      .min(0, "Initial amount must be zero or greater")
      .nullable()
      .optional(),
    investment_day: z.coerce
      .number()
      .int()
      .min(1, "Day must be between 1 and 31")
      .max(31, "Day must be between 1 and 31")
      .optional(),
    risk_profile: riskProfileSchema.optional(),
    time_horizon: timeHorizonSchema.optional(),
  })
  .refine(
    (data) =>
      data.full_name !== undefined ||
      data.base_currency !== undefined ||
      data.monthly_investment_amount !== undefined ||
      data.initial_investment_amount !== undefined ||
      data.investment_day !== undefined ||
      data.risk_profile !== undefined ||
      data.time_horizon !== undefined,
    { message: "At least one field must be provided for update" },
  );

export async function getUserProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getCurrentUserProfile(): Promise<Profile | null> {
  return getUserProfile();
}

export async function requireCurrentUserProfile(): Promise<Profile> {
  const profile = await getUserProfile();

  if (!profile) {
    redirect("/auth");
  }

  return profile;
}

export async function updateUserProfile(
  raw: unknown,
): Promise<UpdateUserProfileResult> {
  const auth = await requireAuthUser();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  let payload;
  try {
    payload = updateUserProfileSchema.parse(raw);
  } catch (error) {
    return { ok: false, error: parseZodError(error) };
  }

  const { supabase, user } = auth;
  const updateFields: Record<string, unknown> = {};

  if (payload.full_name !== undefined) {
    updateFields.full_name = payload.full_name?.trim() || null;
  }
  if (payload.base_currency !== undefined) {
    updateFields.base_currency = payload.base_currency;
  }
  if (payload.monthly_investment_amount !== undefined) {
    updateFields.monthly_investment_amount = payload.monthly_investment_amount;
  }
  if (payload.initial_investment_amount !== undefined) {
    updateFields.initial_investment_amount = payload.initial_investment_amount;
  }
  if (payload.investment_day !== undefined) {
    updateFields.investment_day = payload.investment_day;
  }
  if (payload.risk_profile !== undefined) {
    updateFields.risk_profile = payload.risk_profile;
  }
  if (payload.time_horizon !== undefined) {
    updateFields.time_horizon = payload.time_horizon;
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(updateFields)
    .eq("id", user.id)
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Failed to update profile." };
  }

  if (payload.base_currency !== undefined) {
    const portfolio = await getUserPortfolio(user.id);
    if (portfolio) {
      await supabase
        .from("portfolios")
        .update({ base_currency: payload.base_currency })
        .eq("id", portfolio.id);
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings");
  revalidatePath("/monthly-plan");
  revalidatePath("/instructions");
  revalidatePath("/initial-recommendation");

  return { ok: true, data };
}
