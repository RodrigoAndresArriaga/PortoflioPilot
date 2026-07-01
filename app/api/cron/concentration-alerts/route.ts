import { NextResponse } from "next/server";

import { detectPortfolioWarnings } from "@/lib/engine/concentration";
import { dispatchConcentrationWarnings } from "@/lib/server/email-dispatch";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Holding } from "@/types/database";

function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return false;
  }
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

// daily concentration warning emails for eligible users
export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id")
      .eq("onboarding_completed", true)
      .eq("email_alerts_enabled", true)
      .eq("email_concentration_warning", true);

    if (profilesError) {
      return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

    const eligibleUserIds = new Set((profiles ?? []).map((profile) => profile.id));
    const { data: holdings, error: holdingsError } = await supabase
      .from("holdings")
      .select("*");

    if (holdingsError) {
      return NextResponse.json({ error: holdingsError.message }, { status: 500 });
    }

    const holdingsByUser = new Map<string, Holding[]>();
    for (const holding of (holdings ?? []) as Holding[]) {
      if (!eligibleUserIds.has(holding.user_id)) {
        continue;
      }

      const bucket = holdingsByUser.get(holding.user_id) ?? [];
      bucket.push(holding);
      holdingsByUser.set(holding.user_id, bucket);
    }

    let usersChecked = 0;
    let usersWithWarnings = 0;

    for (const [userId, userHoldings] of holdingsByUser.entries()) {
      usersChecked += 1;
      const warnings = detectPortfolioWarnings(
        userHoldings.map((holding) => ({
          symbol: holding.symbol,
          asset_type: holding.asset_type,
          current_value: holding.current_value,
        })),
      );

      if (warnings.length === 0) {
        continue;
      }

      usersWithWarnings += 1;
      await dispatchConcentrationWarnings(userId, warnings);
    }

    return NextResponse.json({
      ok: true,
      usersChecked,
      usersWithWarnings,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Concentration alert cron failed.",
      },
      { status: 500 },
    );
  }
}
