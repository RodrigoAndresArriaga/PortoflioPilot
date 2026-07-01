import { z } from "zod";

export const baseCurrencySchema = z.enum([
  "MXN",
  "USD",
  "EUR",
  "CAD",
  "GBP",
]);

export const riskProfileSchema = z.enum([
  "conservative",
  "balanced",
  "growth",
  "aggressive_growth",
]);

export const timeHorizonSchema = z.enum([
  "1_3_years",
  "3_5_years",
  "5_10_years",
  "10_plus_years",
]);

export const assetTypeSchema = z.enum([
  "etf",
  "stock",
  "cash",
  "crypto",
  "other",
]);

export const allocationModeSchema = z.enum(["auto", "bucket", "symbol"]);

export const targetBucketKeySchema = z.enum([
  "core_etf",
  "growth_tech",
  "cash_reserve",
  "individual_stock",
]);

export const watchlistAssetTypeSchema = z.enum(["etf", "stock"]);

export const watchlistBucketSchema = z.enum(["core_etf", "growth"]);

export const BUCKET_DEFINITIONS = [
  {
    bucket_key: "core_etf" as const,
    label: "Broad U.S. / global market ETF",
  },
  {
    bucket_key: "growth_tech" as const,
    label: "Growth / tech ETF or individual stocks",
  },
  {
    bucket_key: "cash_reserve" as const,
    label: "Brokerage cash reserve",
  },
  {
    bucket_key: "individual_stock" as const,
    label: "Individual stocks",
    optional: true,
  },
] as const;

export const currencyStepSchema = z.object({
  base_currency: baseCurrencySchema,
  monthly_investment_amount: z.coerce
    .number()
    .min(0, "Monthly amount must be zero or greater"),
  investment_day: z.coerce
    .number()
    .int()
    .min(1, "Day must be between 1 and 31")
    .max(31, "Day must be between 1 and 31"),
});

export const investorProfileStepSchema = z.object({
  risk_profile: riskProfileSchema,
  time_horizon: timeHorizonSchema,
});

export const holdingInputSchema = z.object({
  symbol: z
    .string()
    .trim()
    .min(1, "Symbol is required")
    .max(20, "Symbol is too long"),
  asset_name: z.string().trim().max(100).optional().nullable(),
  asset_type: assetTypeSchema,
  currency: baseCurrencySchema,
  current_value: z.coerce
    .number()
    .min(0, "Current value must be zero or greater"),
  cost_basis: z.coerce
    .number()
    .min(0, "Cost basis must be zero or greater")
    .optional()
    .nullable(),
  shares: z.coerce.number().min(0).optional().nullable(),
  broker: z.string().trim().max(100).optional().nullable(),
});

export const holdingsStepSchema = z
  .object({
    holdings: z.array(holdingInputSchema).min(1, "Add at least one holding"),
  })
  .superRefine((data, ctx) => {
    const symbols = data.holdings.map((h) => h.symbol.trim().toUpperCase());
    const unique = new Set(symbols);
    if (unique.size !== symbols.length) {
      ctx.addIssue({
        code: "custom",
        message: "Duplicate symbols are not allowed",
        path: ["holdings"],
      });
    }
  });

export const targetBucketInputSchema = z.object({
  bucket_key: targetBucketKeySchema,
  target_percent: z.coerce
    .number()
    .min(0, "Target must be between 0 and 100")
    .max(100, "Target must be between 0 and 100"),
  enabled: z.boolean().default(true),
});

export const targetAssetInputSchema = z.object({
  symbol: z
    .string()
    .trim()
    .min(1, "Symbol is required")
    .max(20, "Symbol is too long"),
  bucket_key: targetBucketKeySchema,
  target_percent: z.coerce
    .number()
    .min(0, "Target must be between 0 and 100")
    .max(100, "Target must be between 0 and 100"),
});

export const allocationStepValueSchema = z.object({
  allocation_mode: allocationModeSchema,
  target_buckets: z
    .array(targetBucketInputSchema)
    .min(1, "Add at least one bucket target"),
  target_assets: z.array(targetAssetInputSchema),
  include_individual_stock_bucket: z.boolean(),
});

function validateBucketSum(
  buckets: z.infer<typeof targetBucketInputSchema>[],
  ctx: z.RefinementCtx,
  path: string,
) {
  const enabledBuckets = buckets.filter((bucket) => bucket.enabled);
  const sum = enabledBuckets.reduce(
    (total, bucket) => total + bucket.target_percent,
    0,
  );
  if (Math.abs(sum - 100) > 0.01) {
    ctx.addIssue({
      code: "custom",
      message: "Bucket targets must sum to 100%",
      path: [path],
    });
  }
}

function validateAssetSum(
  assets: z.infer<typeof targetAssetInputSchema>[],
  ctx: z.RefinementCtx,
) {
  const sum = assets.reduce((total, asset) => total + asset.target_percent, 0);
  if (Math.abs(sum - 100) > 0.01) {
    ctx.addIssue({
      code: "custom",
      message: "Symbol targets must sum to 100%",
      path: ["target_assets"],
    });
  }

  const symbols = assets.map((asset) => asset.symbol.trim().toUpperCase());
  const unique = new Set(symbols);
  if (unique.size !== symbols.length) {
    ctx.addIssue({
      code: "custom",
      message: "Duplicate allocation symbols are not allowed",
      path: ["target_assets"],
    });
  }
}

export const allocationStepSchema = allocationStepValueSchema.superRefine(
  (data, ctx) => {
    if (data.allocation_mode === "symbol") {
      if (data.target_assets.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Add at least one symbol target",
          path: ["target_assets"],
        });
        return;
      }
      validateAssetSum(data.target_assets, ctx);
      return;
    }

    validateBucketSum(data.target_buckets, ctx, "target_buckets");
  },
);

export const watchlistItemInputSchema = z.object({
  symbol: z
    .string()
    .trim()
    .min(1, "Symbol is required")
    .max(20, "Symbol is too long"),
  asset_name: z.string().trim().max(100).optional().nullable(),
  asset_type: watchlistAssetTypeSchema.optional().nullable(),
  bucket: watchlistBucketSchema.optional().nullable(),
  sort_order: z.number().int().min(0),
});

export const watchlistStepSchema = z.object({
  watchlist: z
    .array(watchlistItemInputSchema)
    .min(1, "Select at least one watchlist symbol"),
});

export const onboardingPayloadSchema = z
  .object({
    base_currency: baseCurrencySchema,
    monthly_investment_amount: z.coerce
      .number()
      .min(0, "Monthly amount must be zero or greater"),
    investment_day: z.coerce
      .number()
      .int()
      .min(1, "Day must be between 1 and 31")
      .max(31, "Day must be between 1 and 31"),
    risk_profile: riskProfileSchema,
    time_horizon: timeHorizonSchema,
    holdings: z.array(holdingInputSchema).min(1, "Add at least one holding"),
    allocation_mode: allocationModeSchema,
    target_buckets: z.array(targetBucketInputSchema).min(1),
    target_assets: z.array(targetAssetInputSchema),
    include_individual_stock_bucket: z.boolean(),
    watchlist: z
      .array(watchlistItemInputSchema)
      .min(1, "Select at least one watchlist symbol"),
  })
  .superRefine((data, ctx) => {
    const holdingSymbols = data.holdings.map((h) =>
      h.symbol.trim().toUpperCase(),
    );
    const uniqueHoldings = new Set(holdingSymbols);
    if (uniqueHoldings.size !== holdingSymbols.length) {
      ctx.addIssue({
        code: "custom",
        message: "Duplicate symbols are not allowed",
        path: ["holdings"],
      });
    }

    if (data.allocation_mode === "symbol") {
      if (data.target_assets.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Add at least one symbol target",
          path: ["target_assets"],
        });
      } else {
        validateAssetSum(data.target_assets, ctx);
      }
      return;
    }

    validateBucketSum(data.target_buckets, ctx, "target_buckets");
  });

export type CurrencyStepData = z.infer<typeof currencyStepSchema>;
export type InvestorProfileStepData = z.infer<typeof investorProfileStepSchema>;
export type HoldingInput = z.infer<typeof holdingInputSchema>;
export type HoldingsStepData = z.infer<typeof holdingsStepSchema>;
export type AllocationMode = z.infer<typeof allocationModeSchema>;
export type TargetBucketKey = z.infer<typeof targetBucketKeySchema>;
export type TargetBucketInput = z.infer<typeof targetBucketInputSchema>;
export type TargetAssetInput = z.infer<typeof targetAssetInputSchema>;
export type AllocationStepValue = z.infer<typeof allocationStepValueSchema>;
export type AllocationStepData = z.infer<typeof allocationStepSchema>;
export type WatchlistItemInput = z.infer<typeof watchlistItemInputSchema>;
export type WatchlistStepData = z.infer<typeof watchlistStepSchema>;
export type OnboardingPayload = z.infer<typeof onboardingPayloadSchema>;
export type OnboardingFormData = OnboardingPayload;

export const DEFAULT_WATCHLIST_OPTIONS = [
  { symbol: "VOO", asset_name: "Vanguard S&P 500 ETF", asset_type: "etf" as const, bucket: "core_etf" as const },
  { symbol: "VTI", asset_name: "Vanguard Total Stock Market ETF", asset_type: "etf" as const, bucket: "core_etf" as const },
  { symbol: "QQQ", asset_name: "Invesco QQQ Trust", asset_type: "etf" as const, bucket: "core_etf" as const },
  { symbol: "SCHD", asset_name: "Schwab US Dividend Equity ETF", asset_type: "etf" as const, bucket: "core_etf" as const },
  { symbol: "VXUS", asset_name: "Vanguard Total International Stock ETF", asset_type: "etf" as const, bucket: "core_etf" as const },
  { symbol: "BND", asset_name: "Vanguard Total Bond Market ETF", asset_type: "etf" as const, bucket: "core_etf" as const },
  { symbol: "NVDA", asset_name: "NVIDIA Corporation", asset_type: "stock" as const, bucket: "growth" as const },
  { symbol: "MSFT", asset_name: "Microsoft Corporation", asset_type: "stock" as const, bucket: "growth" as const },
  { symbol: "AAPL", asset_name: "Apple Inc.", asset_type: "stock" as const, bucket: "growth" as const },
  { symbol: "AMD", asset_name: "Advanced Micro Devices", asset_type: "stock" as const, bucket: "growth" as const },
  { symbol: "GOOGL", asset_name: "Alphabet Inc.", asset_type: "stock" as const, bucket: "growth" as const },
  { symbol: "AMZN", asset_name: "Amazon.com Inc.", asset_type: "stock" as const, bucket: "growth" as const },
  { symbol: "META", asset_name: "Meta Platforms Inc.", asset_type: "stock" as const, bucket: "growth" as const },
] as const;

export type WatchlistOption = {
  symbol: string;
  asset_name: string;
  asset_type: "etf" | "stock";
  bucket: "core_etf" | "growth";
};

export function buildWatchlistOptions(holdings: HoldingInput[]): WatchlistOption[] {
  const options: WatchlistOption[] = DEFAULT_WATCHLIST_OPTIONS.map((item) => ({
    ...item,
  }));
  const knownSymbols = new Set(options.map((item) => item.symbol));

  for (const holding of holdings) {
    const symbol = holding.symbol.trim().toUpperCase();
    if (!symbol || knownSymbols.has(symbol)) {
      continue;
    }

    if (holding.asset_type === "cash") {
      continue;
    }

    knownSymbols.add(symbol);
    options.push({
      symbol,
      asset_name: holding.asset_name?.trim() || symbol,
      asset_type:
        holding.asset_type === "stock" || holding.asset_type === "etf"
          ? holding.asset_type
          : "stock",
      bucket: holding.asset_type === "etf" ? "core_etf" : "growth",
    });
  }

  return options;
}

function holdingToWatchlistItem(
  holding: HoldingInput,
  sortOrder: number,
): WatchlistItemInput | null {
  const symbol = holding.symbol.trim().toUpperCase();
  if (!symbol || holding.asset_type === "cash") {
    return null;
  }

  const defaultOption = DEFAULT_WATCHLIST_OPTIONS.find(
    (option) => option.symbol === symbol,
  );

  if (defaultOption) {
    return {
      symbol: defaultOption.symbol,
      asset_name: defaultOption.asset_name,
      asset_type: defaultOption.asset_type,
      bucket: defaultOption.bucket,
      sort_order: sortOrder,
    };
  }

  return {
    symbol,
    asset_name: holding.asset_name?.trim() || null,
    asset_type:
      holding.asset_type === "stock" || holding.asset_type === "etf"
        ? holding.asset_type
        : "stock",
    bucket: holding.asset_type === "etf" ? "core_etf" : "growth",
    sort_order: sortOrder,
  };
}

export function mergeHoldingsIntoWatchlist(
  watchlist: WatchlistItemInput[],
  holdings: HoldingInput[],
): WatchlistItemInput[] {
  const selected = new Set(
    watchlist.map((item) => item.symbol.trim().toUpperCase()),
  );
  const merged = [...watchlist];

  for (const holding of holdings) {
    const item = holdingToWatchlistItem(holding, merged.length);
    if (!item || selected.has(item.symbol)) {
      continue;
    }

    merged.push(item);
    selected.add(item.symbol);
  }

  return merged;
}

const RISK_BUCKET_PRESETS: Record<
  z.infer<typeof riskProfileSchema>,
  TargetBucketInput[]
> = {
  conservative: [
    { bucket_key: "core_etf", target_percent: 80, enabled: true },
    { bucket_key: "growth_tech", target_percent: 10, enabled: true },
    { bucket_key: "cash_reserve", target_percent: 10, enabled: true },
  ],
  balanced: [
    { bucket_key: "core_etf", target_percent: 65, enabled: true },
    { bucket_key: "growth_tech", target_percent: 25, enabled: true },
    { bucket_key: "cash_reserve", target_percent: 10, enabled: true },
  ],
  growth: [
    { bucket_key: "core_etf", target_percent: 70, enabled: true },
    { bucket_key: "growth_tech", target_percent: 20, enabled: true },
    { bucket_key: "cash_reserve", target_percent: 10, enabled: true },
  ],
  aggressive_growth: [
    { bucket_key: "core_etf", target_percent: 55, enabled: true },
    { bucket_key: "growth_tech", target_percent: 35, enabled: true },
    { bucket_key: "cash_reserve", target_percent: 10, enabled: true },
  ],
};

export function getRecommendedBucketsForRisk(
  riskProfile: z.infer<typeof riskProfileSchema>,
  includeIndividualStock = false,
): TargetBucketInput[] {
  const buckets = RISK_BUCKET_PRESETS[riskProfile].map((bucket) => ({
    ...bucket,
  }));

  if (includeIndividualStock) {
    buckets.push({
      bucket_key: "individual_stock",
      target_percent: 10,
      enabled: true,
    });
    const core = buckets.find((bucket) => bucket.bucket_key === "core_etf");
    if (core) {
      core.target_percent = Math.max(0, core.target_percent - 10);
    }
  }

  return buckets;
}

export function getDefaultAllocationStepValue(
  riskProfile: z.infer<typeof riskProfileSchema>,
): AllocationStepValue {
  return {
    allocation_mode: "bucket",
    target_buckets: getRecommendedBucketsForRisk(riskProfile),
    target_assets: [],
    include_individual_stock_bucket: false,
  };
}

export function getDefaultOnboardingFormData(
  baseCurrency = "MXN",
): OnboardingFormData {
  const riskProfile = "growth";
  const allocation = getDefaultAllocationStepValue(riskProfile);

  return {
    base_currency: baseCurrency as OnboardingFormData["base_currency"],
    monthly_investment_amount: 4000,
    investment_day: 1,
    risk_profile: riskProfile,
    time_horizon: "10_plus_years",
    holdings: [],
    allocation_mode: allocation.allocation_mode,
    target_buckets: allocation.target_buckets,
    target_assets: allocation.target_assets,
    include_individual_stock_bucket: allocation.include_individual_stock_bucket,
    watchlist: [],
  };
}

export function getSymbolTargetsFromHoldings(
  holdings: HoldingInput[],
  riskProfile: z.infer<typeof riskProfileSchema> = "growth",
): TargetAssetInput[] {
  const symbols = new Set(
    holdings.map((holding) => holding.symbol.trim().toUpperCase()),
  );
  const buckets = getRecommendedBucketsForRisk(riskProfile);
  const bucketPercent = (key: TargetBucketKey) =>
    buckets.find((bucket) => bucket.bucket_key === key)?.target_percent ?? 0;

  const assets: TargetAssetInput[] = [];

  if (symbols.has("VOO")) {
    assets.push({
      symbol: "VOO",
      bucket_key: "core_etf",
      target_percent: bucketPercent("core_etf"),
    });
  } else if (symbols.has("VTI")) {
    assets.push({
      symbol: "VTI",
      bucket_key: "core_etf",
      target_percent: bucketPercent("core_etf"),
    });
  } else if (symbols.has("VXUS")) {
    assets.push({
      symbol: "VXUS",
      bucket_key: "core_etf",
      target_percent: bucketPercent("core_etf"),
    });
  }

  if (symbols.has("QQQ")) {
    assets.push({
      symbol: "QQQ",
      bucket_key: "growth_tech",
      target_percent: bucketPercent("growth_tech"),
    });
  }

  if (symbols.has("CASH")) {
    assets.push({
      symbol: "CASH",
      bucket_key: "cash_reserve",
      target_percent: bucketPercent("cash_reserve"),
    });
  } else if (holdings.some((holding) => holding.asset_type === "cash")) {
    const cashHolding = holdings.find((holding) => holding.asset_type === "cash");
    assets.push({
      symbol: cashHolding?.symbol.trim().toUpperCase() || "CASH",
      bucket_key: "cash_reserve",
      target_percent: bucketPercent("cash_reserve"),
    });
  } else if (assets.length > 0) {
    assets.push({
      symbol: "CASH",
      bucket_key: "cash_reserve",
      target_percent: bucketPercent("cash_reserve"),
    });
  }

  return assets;
}

export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!errors[key]) {
      errors[key] = issue.message;
    }
  }
  return errors;
}
