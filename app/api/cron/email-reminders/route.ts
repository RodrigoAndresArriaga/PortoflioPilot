import { NextResponse } from "next/server";

import {
  dispatchInvestmentReminder,
  isInvestmentDayToday,
} from "@/lib/server/email-dispatch";
import { getCurrentMonthKey } from "@/lib/server/monthly-plan-generation";
import { createAdminClient } from "@/lib/supabase/admin";

function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return false;
  }
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

// daily investment-day reminder emails
export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const monthKey = getCurrentMonthKey();
    const today = new Date();

    const { data: profiles, error } = await supabase
      .from("profiles")
      .select(
        "id, investment_day, monthly_investment_amount, base_currency, email_alerts_enabled, email_investment_reminder, onboarding_completed",
      )
      .eq("onboarding_completed", true)
      .eq("email_alerts_enabled", true)
      .eq("email_investment_reminder", true);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let sent = 0;
    let skipped = 0;

    for (const profile of profiles ?? []) {
      if (!isInvestmentDayToday(profile.investment_day, today)) {
        skipped += 1;
        continue;
      }

      const { data: portfolio } = await supabase
        .from("portfolios")
        .select("id")
        .eq("user_id", profile.id)
        .maybeSingle();

      if (!portfolio) {
        skipped += 1;
        continue;
      }

      const { data: plan } = await supabase
        .from("monthly_plans")
        .select("status")
        .eq("user_id", profile.id)
        .eq("portfolio_id", portfolio.id)
        .eq("month", monthKey)
        .maybeSingle();

      if (plan?.status === "completed") {
        skipped += 1;
        continue;
      }

      await dispatchInvestmentReminder(profile.id, profile, monthKey);
      sent += 1;
    }

    return NextResponse.json({
      ok: true,
      month: monthKey,
      candidates: profiles?.length ?? 0,
      sent,
      skipped,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Email reminder cron failed.",
      },
      { status: 500 },
    );
  }
}
