import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadEnv() {
  const envPath = join(root, ".env");
  const env = {};
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
  }
  return env;
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const noUrgentPayload = {
  report_type: "daily_urgent_scan",
  report_date: "2026-07-01",
  urgent_news: false,
  action_required: false,
  summary: "Validation smoke test — no urgent news.",
};

async function runValidation() {
  console.log("=== B5 Manual News Inputs Validation ===\n");

  const { error: tableError } = await admin
    .from("manual_news_inputs")
    .select("id")
    .limit(1);

  if (tableError) {
    console.error("manual_news_inputs table missing or inaccessible:");
    console.error(`  ${tableError.message}`);
    console.log("\nApply migration: supabase/migrations/006_manual_news_inputs.sql");
    process.exit(1);
  }

  console.log("1. Table exists: yes");

  const { data: portfolio, error: portfolioError } = await admin
    .from("portfolios")
    .select("id, user_id")
    .limit(1)
    .maybeSingle();

  if (portfolioError || !portfolio) {
    console.error("Need at least one portfolio row to smoke-test inserts.");
    process.exit(1);
  }

  const reportPeriod = `validate-${Date.now()}`;

  const { data: header, error: insertError } = await admin
    .from("manual_news_inputs")
    .insert({
      user_id: portfolio.user_id,
      portfolio_id: portfolio.id,
      parent_id: null,
      is_report_header: true,
      report_type: "daily_urgent_scan",
      report_period: reportPeriod,
      payload: noUrgentPayload,
    })
    .select("id")
    .single();

  if (insertError || !header) {
    console.error("Header insert failed:", insertError?.message);
    process.exit(1);
  }

  console.log("2. Service-role header insert: ok");

  const { error: deleteError } = await admin
    .from("manual_news_inputs")
    .delete()
    .eq("id", header.id);

  if (deleteError) {
    console.error("Cleanup failed:", deleteError.message);
    process.exit(1);
  }

  console.log("3. Cleanup: ok");
  console.log("\nRLS policies are defined in 006_manual_news_inputs.sql.");
  console.log("Run authenticated CRUD tests via the app once D6 UI ships.");
  console.log("\nAll checks passed.");
}

runValidation().catch((error) => {
  console.error(error);
  process.exit(1);
});
