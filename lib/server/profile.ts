import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  full_name: string | null;
  base_currency: string;
  monthly_investment_amount: number;
  investment_day: number;
  risk_profile: string;
  time_horizon: string;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
};

export async function getCurrentUserProfile(): Promise<Profile | null> {
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

export async function requireCurrentUserProfile(): Promise<Profile> {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/auth");
  }

  return profile;
}
