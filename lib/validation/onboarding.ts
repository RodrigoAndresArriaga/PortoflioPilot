import { z } from "zod";

export {
  assetTypeSchema,
  baseCurrencySchema,
  riskProfileSchema,
  timeHorizonSchema,
  watchlistAssetTypeSchema,
  watchlistBucketSchema,
} from "@/lib/validation/common";

import {
  baseCurrencySchema,
  riskProfileSchema,
  timeHorizonSchema,
} from "@/lib/validation/common";
import {
  holdingInputSchema,
  type HoldingInput,
} from "@/lib/validation/holdings";
import {
  watchlistItemInputSchema,
  type WatchlistItemInput,
} from "@/lib/validation/watchlist";

export { holdingInputSchema, type HoldingInput } from "@/lib/validation/holdings";
export {
  watchlistItemInputSchema,
  type WatchlistItemInput,
} from "@/lib/validation/watchlist";

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

export const watchlistStepSchema = z.object({
  watchlist: z
    .array(watchlistItemInputSchema)
    .min(1, "Select at least one watchlist symbol"),
});

export const onboardingPayloadSchema = z.object({
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
  watchlist: z
    .array(watchlistItemInputSchema)
    .min(1, "Select at least one watchlist symbol"),
});

export type CurrencyStepData = z.infer<typeof currencyStepSchema>;
export type InvestorProfileStepData = z.infer<typeof investorProfileStepSchema>;
export type HoldingsStepData = z.infer<typeof holdingsStepSchema>;
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

export function getDefaultOnboardingFormData(
  baseCurrency = "MXN",
): OnboardingFormData {
  return {
    base_currency: baseCurrency as OnboardingFormData["base_currency"],
    monthly_investment_amount: 4000,
    investment_day: 1,
    risk_profile: "growth",
    time_horizon: "10_plus_years",
    holdings: [],
    watchlist: [],
  };
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
