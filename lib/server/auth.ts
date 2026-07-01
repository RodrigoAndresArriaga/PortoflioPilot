import type { User } from "@supabase/supabase-js";
import { ZodError } from "zod";

import { createClient } from "@/lib/supabase/server";

type AuthSuccess = {
  ok: true;
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: User;
};

type AuthFailure = {
  ok: false;
  error: string;
};

export type AuthResult = AuthSuccess | AuthFailure;

export async function requireAuthUser(): Promise<AuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { ok: false, error: "You must be signed in." };
  }

  return { ok: true, supabase, user };
}

export function parseZodError(error: unknown): string {
  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? "Invalid input.";
  }
  return "Invalid input.";
}
