import { z } from "zod";

const baseCurrencySchema = z.enum(["MXN", "USD", "EUR", "CAD", "GBP"]);
const assetTypeSchema = z.enum(["etf", "stock", "cash", "crypto", "other"]);
const allocationModeSchema = z.enum(["auto", "bucket", "symbol"]);
const targetBucketKeySchema = z.enum([
  "core_etf",
  "growth_tech",
  "cash_reserve",
  "individual_stock",
]);
const watchlistAssetTypeSchema = z.enum(["etf", "stock"]);
const watchlistBucketSchema = z.enum(["core_etf", "growth"]);

const createHoldingSchema = z.object({
  symbol: z.string().trim().min(1).max(20),
  asset_name: z.string().trim().max(100).optional().nullable(),
  asset_type: assetTypeSchema,
  currency: baseCurrencySchema,
  current_value: z.coerce.number().min(0),
  cost_basis: z.coerce.number().min(0).optional().nullable(),
  shares: z.coerce.number().min(0).optional().nullable(),
  broker: z.string().trim().max(100).optional().nullable(),
});

const updateHoldingSchema = z
  .object({
    id: z.string().uuid(),
    symbol: z.string().trim().min(1).max(20).optional(),
    asset_name: z.string().trim().max(100).optional().nullable(),
    asset_type: assetTypeSchema.optional(),
    currency: baseCurrencySchema.optional(),
    current_value: z.coerce.number().min(0).optional(),
    cost_basis: z.coerce.number().min(0).optional().nullable(),
    shares: z.coerce.number().min(0).optional().nullable(),
    broker: z.string().trim().max(100).optional().nullable(),
  })
  .refine(
    (data) =>
      data.symbol !== undefined ||
      data.asset_name !== undefined ||
      data.asset_type !== undefined ||
      data.currency !== undefined ||
      data.current_value !== undefined ||
      data.cost_basis !== undefined ||
      data.shares !== undefined ||
      data.broker !== undefined,
    { message: "At least one field must be provided for update" },
  );

const targetBucketInputSchema = z.object({
  bucket_key: targetBucketKeySchema,
  target_percent: z.coerce.number().min(0).max(100),
  enabled: z.boolean().default(true),
});

const targetAssetInputSchema = z.object({
  symbol: z.string().trim().min(1).max(20),
  bucket_key: targetBucketKeySchema,
  target_percent: z.coerce.number().min(0).max(100),
});

const upsertTargetAllocationsSchema = z.object({
  allocation_mode: allocationModeSchema,
  target_buckets: z.array(targetBucketInputSchema).min(1),
  target_assets: z.array(targetAssetInputSchema),
  include_individual_stock_bucket: z.boolean(),
});

const watchlistItemInputSchema = z.object({
  symbol: z.string().trim().min(1).max(20),
  asset_name: z.string().trim().max(100).optional().nullable(),
  asset_type: watchlistAssetTypeSchema.optional().nullable(),
  bucket: watchlistBucketSchema.optional().nullable(),
  sort_order: z.number().int().min(0),
});

const upsertWatchlistSchema = z.object({
  watchlist: z.array(watchlistItemInputSchema).min(1),
});

const sampleHolding = {
  symbol: "VOO",
  asset_name: "Vanguard S&P 500 ETF",
  asset_type: "etf",
  currency: "USD",
  current_value: 10000,
  cost_basis: 9000,
  shares: 20,
  broker: "IBKR",
};

const sampleAllocations = {
  allocation_mode: "bucket",
  target_buckets: [
    { bucket_key: "core_etf", target_percent: 70, enabled: true },
    { bucket_key: "growth_tech", target_percent: 20, enabled: true },
    { bucket_key: "cash_reserve", target_percent: 10, enabled: true },
  ],
  target_assets: [],
  include_individual_stock_bucket: false,
};

const sampleWatchlist = {
  watchlist: [
    {
      symbol: "VOO",
      asset_name: "Vanguard S&P 500 ETF",
      asset_type: "etf",
      bucket: "core_etf",
      sort_order: 0,
    },
  ],
};

function runSchemaChecks() {
  const checks = [
    {
      name: "createHoldingSchema",
      run: () => createHoldingSchema.parse(sampleHolding),
    },
    {
      name: "updateHoldingSchema",
      run: () =>
        updateHoldingSchema.parse({
          id: "00000000-0000-4000-8000-000000000001",
          current_value: 12000,
        }),
    },
    {
      name: "upsertTargetAllocationsSchema",
      run: () => upsertTargetAllocationsSchema.parse(sampleAllocations),
    },
    {
      name: "upsertWatchlistSchema",
      run: () => upsertWatchlistSchema.parse(sampleWatchlist),
    },
  ];

  let passed = 0;
  for (const check of checks) {
    try {
      check.run();
      console.log(`  ${check.name}: ok`);
      passed += 1;
    } catch (error) {
      const message =
        error instanceof z.ZodError
          ? error.issues.map((i) => i.message).join("; ")
          : String(error);
      console.log(`  ${check.name}: FAIL (${message})`);
    }
  }

  return passed === checks.length;
}

console.log("=== B3 CRUD Validation Smoke Test ===\n");
console.log("Schema checks:");
const ok = runSchemaChecks();

if (!ok) {
  console.log("\nOne or more schema checks failed.");
  process.exit(1);
}

console.log("\nAll B3 validation schemas parse sample payloads.");
