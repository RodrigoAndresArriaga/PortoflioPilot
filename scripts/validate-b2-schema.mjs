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

const tables = ["portfolios", "holdings", "target_allocations", "watchlist_items"];

async function checkTablesExist() {
  const results = [];
  for (const table of tables) {
    const { error } = await admin.from(table).select("id").limit(1);
    results.push({ table, exists: !error, detail: error?.message ?? "ok" });
  }
  return results;
}

async function runValidation() {
  console.log("=== B2 Schema Validation ===\n");

  const tableResults = await checkTablesExist();
  const missing = tableResults.filter((r) => !r.exists);

  console.log("5a. Tables exist:");
  for (const row of tableResults) {
    console.log(`  ${row.table}: ${row.exists ? "yes" : "no"} (${row.detail})`);
  }

  if (missing.length > 0) {
    console.log("\nMigration not applied yet. Run in Supabase SQL Editor:");
    console.log("  supabase/migrations/002_portfolio_schema.sql");
    console.log("\nThen re-run: node scripts/validate-b2-schema.mjs");
    process.exit(1);
  }

  const userA = crypto.randomUUID();
  const userB = crypto.randomUUID();

  const { error: userAError } = await admin.auth.admin.createUser({
    email: `b2-validate-a-${Date.now()}@example.com`,
    password: "TestPassword123!",
    email_confirm: true,
    user_metadata: { full_name: "B2 Validate A" },
  });

  const { error: userBError } = await admin.auth.admin.createUser({
    email: `b2-validate-b-${Date.now()}@example.com`,
    password: "TestPassword123!",
    email_confirm: true,
    user_metadata: { full_name: "B2 Validate B" },
  });

  if (userAError || userBError) {
    console.error("Failed to create test users:", userAError?.message ?? userBError?.message);
    process.exit(1);
  }

  const { data: usersList } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const testUsers = usersList.users
    .filter((u) => u.email?.startsWith("b2-validate-"))
    .slice(-2);

  if (testUsers.length < 2) {
    console.error("Could not resolve test user ids");
    process.exit(1);
  }

  const [userARecord, userBRecord] = testUsers;
  const userAId = userARecord.id;
  const userBId = userBRecord.id;

  const { data: portfolio, error: portfolioError } = await admin
    .from("portfolios")
    .insert({
      user_id: userAId,
      name: "Validate Portfolio",
      base_currency: "MXN",
    })
    .select("id")
    .single();

  if (portfolioError) {
    console.error("Setup failed (portfolio):", portfolioError.message);
    process.exit(1);
  }

  const portfolioId = portfolio.id;

  await admin.from("holdings").insert({
    user_id: userAId,
    portfolio_id: portfolioId,
    symbol: "VOO",
    asset_type: "etf",
    current_value: 1000,
  });

  await admin.from("target_allocations").insert({
    user_id: userAId,
    portfolio_id: portfolioId,
    symbol: "VOO",
    bucket: "core_etf",
    target_percent: 55,
  });

  await admin.from("watchlist_items").insert({
    user_id: userAId,
    symbol: "NVDA",
    asset_type: "stock",
    bucket: "growth",
  });

  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const clientA = createClient(url, anonKey);
  const clientB = createClient(url, anonKey);

  const { data: sessionA } = await clientA.auth.signInWithPassword({
    email: userARecord.email,
    password: "TestPassword123!",
  });

  const { data: sessionB } = await clientB.auth.signInWithPassword({
    email: userBRecord.email,
    password: "TestPassword123!",
  });

  if (!sessionA.session || !sessionB.session) {
    console.error("Failed to sign in test users");
    process.exit(1);
  }

  const { data: bHoldings } = await clientB
    .from("holdings")
    .select("*")
    .eq("user_id", userAId);

  const { error: crossInsertError } = await clientB.from("holdings").insert({
    user_id: userBId,
    portfolio_id: portfolioId,
    symbol: "MSFT",
    asset_type: "stock",
    current_value: 500,
  });

  const { count: bUpdateCount } = await clientB
    .from("holdings")
    .update({ current_value: 9999 })
    .eq("user_id", userAId)
    .select("*", { count: "exact", head: true });

  console.log("\n5d. Cross-user isolation:");
  console.log(`  User B reads User A holdings: ${bHoldings?.length ?? 0} rows (expected 0)`);
  console.log(
    `  User B insert into User A portfolio: ${crossInsertError ? "blocked" : "allowed"} (expected blocked)`
  );
  console.log(`  User B update User A holdings: ${bUpdateCount ?? 0} rows (expected 0)`);

  await admin.from("holdings").delete().eq("user_id", userAId);
  await admin.from("target_allocations").delete().eq("user_id", userAId);
  await admin.from("watchlist_items").delete().eq("user_id", userAId);
  await admin.from("portfolios").delete().eq("user_id", userAId);
  await admin.auth.admin.deleteUser(userAId);
  await admin.auth.admin.deleteUser(userBId);

  const isolationOk =
    (bHoldings?.length ?? 0) === 0 &&
    !!crossInsertError &&
    (bUpdateCount ?? 0) === 0;

  console.log("\n=== Result ===");
  console.log(isolationOk ? "PASS — RLS isolation verified" : "FAIL — review RLS policies");

  process.exit(isolationOk ? 0 : 1);
}

runValidation().catch((err) => {
  console.error(err);
  process.exit(1);
});
