import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const baseCurrencySchema = z.enum(["MXN", "USD", "EUR", "CAD", "GBP"]);
const riskProfileSchema = z.enum([
  "conservative",
  "balanced",
  "growth",
  "aggressive_growth",
]);
const timeHorizonSchema = z.enum([
  "1_3_years",
  "3_5_years",
  "5_10_years",
  "10_plus_years",
]);
const assetTypeSchema = z.enum(["etf", "stock", "cash", "crypto", "other"]);
const allocationBucketSchema = z.enum([
  "core_etf",
  "growth",
  "individual_stock",
  "cash",
]);
const watchlistAssetTypeSchema = z.enum(["etf", "stock"]);
const watchlistBucketSchema = z.enum(["core_etf", "growth"]);

const onboardingPayloadSchema = z
  .object({
    base_currency: baseCurrencySchema,
    monthly_investment_amount: z.coerce.number().min(0),
    investment_day: z.coerce.number().int().min(1).max(31),
    risk_profile: riskProfileSchema,
    time_horizon: timeHorizonSchema,
    holdings: z
      .array(
        z.object({
          symbol: z.string().trim().min(1),
          asset_name: z.string().nullable().optional(),
          asset_type: assetTypeSchema,
          currency: baseCurrencySchema,
          current_value: z.coerce.number().min(0),
          cost_basis: z.coerce.number().min(0).nullable().optional(),
          shares: z.coerce.number().min(0).nullable().optional(),
          broker: z.string().nullable().optional(),
        }),
      )
      .min(1),
    target_allocations: z
      .array(
        z.object({
          symbol: z.string().trim().min(1),
          bucket: allocationBucketSchema,
          target_percent: z.coerce.number().min(0).max(100),
        }),
      )
      .min(1),
    watchlist: z
      .array(
        z.object({
          symbol: z.string().trim().min(1),
          asset_name: z.string().nullable().optional(),
          asset_type: watchlistAssetTypeSchema.nullable().optional(),
          bucket: watchlistBucketSchema.nullable().optional(),
          sort_order: z.number().int().min(0),
        }),
      )
      .min(1),
  })
  .superRefine((data, ctx) => {
    const sum = data.target_allocations.reduce(
      (total, row) => total + row.target_percent,
      0,
    );
    if (Math.abs(sum - 100) > 0.01) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Target allocations must sum to 100%",
        path: ["target_allocations"],
      });
    }
  });

const samplePayload = {
  base_currency: "MXN",
  monthly_investment_amount: 4000,
  investment_day: 1,
  risk_profile: "growth",
  time_horizon: "10_plus_years",
  holdings: [
    {
      symbol: "VOO",
      asset_name: "Vanguard S&P 500 ETF",
      asset_type: "etf",
      currency: "MXN",
      current_value: 5000,
      cost_basis: 4800,
      shares: null,
      broker: null,
    },
    {
      symbol: "QQQ",
      asset_name: "Invesco QQQ Trust",
      asset_type: "etf",
      currency: "MXN",
      current_value: 2000,
      cost_basis: 1900,
      shares: null,
      broker: null,
    },
    {
      symbol: "NVDA",
      asset_name: "NVIDIA Corporation",
      asset_type: "stock",
      currency: "MXN",
      current_value: 1500,
      cost_basis: 1300,
      shares: null,
      broker: null,
    },
  ],
  target_allocations: [
    { symbol: "VOO", bucket: "core_etf", target_percent: 70 },
    { symbol: "QQQ", bucket: "growth", target_percent: 20 },
    { symbol: "CASH", bucket: "cash", target_percent: 10 },
  ],
  watchlist: [
    {
      symbol: "VOO",
      asset_name: "Vanguard S&P 500 ETF",
      asset_type: "etf",
      bucket: "core_etf",
      sort_order: 0,
    },
    {
      symbol: "QQQ",
      asset_name: "Invesco QQQ Trust",
      asset_type: "etf",
      bucket: "core_etf",
      sort_order: 1,
    },
    {
      symbol: "NVDA",
      asset_name: "NVIDIA Corporation",
      asset_type: "stock",
      bucket: "growth",
      sort_order: 2,
    },
  ],
};

function loadEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Missing Supabase env vars.");
  }
  return { url, serviceKey };
}

async function verifyTables() {
  const { url, serviceKey } = loadEnv();
  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const tables = [
    "profiles",
    "portfolios",
    "holdings",
    "target_allocations",
    "watchlist_items",
  ];

  for (const table of tables) {
    const { error } = await supabase.from(table).select("*", { head: true });
    if (error) {
      throw new Error(`${table}: ${error.message}`);
    }
  }
}

async function main() {
  const parsed = onboardingPayloadSchema.parse(samplePayload);
  console.log("PASS: sample onboarding payload validates");
  console.log(`  currency=${parsed.base_currency} amount=${parsed.monthly_investment_amount}`);
  console.log(`  holdings=${parsed.holdings.length} allocations=${parsed.target_allocations.length} watchlist=${parsed.watchlist.length}`);

  await verifyTables();
  console.log("PASS: all onboarding write tables are reachable");
}

main().catch((error) => {
  console.error("FAIL:", error.message);
  process.exit(1);
});
