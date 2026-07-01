"use server";

import { revalidatePath } from "next/cache";

import { requireAuthUser } from "@/lib/server/auth";

export type DismissSetupAttentionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function dismissSetupAttention(): Promise<DismissSetupAttentionResult> {
  const auth = await requireAuthUser();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const { error } = await auth.supabase
    .from("profiles")
    .update({ setup_attention_dismissed: true })
    .eq("id", auth.user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/holdings");
  revalidatePath("/monthly-plan");
  revalidatePath("/instructions");
  revalidatePath("/news-input");
  revalidatePath("/initial-recommendation");
  revalidatePath("/settings");

  return { ok: true };
}

export async function getHoldingsCount(): Promise<number> {
  const auth = await requireAuthUser();
  if (!auth.ok) {
    return 0;
  }

  const { count, error } = await auth.supabase
    .from("holdings")
    .select("id", { count: "exact", head: true })
    .eq("user_id", auth.user.id);

  if (error) {
    return 0;
  }

  return count ?? 0;
}
