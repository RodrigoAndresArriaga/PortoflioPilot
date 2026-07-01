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
