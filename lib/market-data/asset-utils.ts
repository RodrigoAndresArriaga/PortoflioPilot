import type { AssetType } from "@/types/database";

// etf/stock holdings get auto-valued from market quotes
export function isQuotedMarketAsset(assetType: AssetType): boolean {
  return assetType === "etf" || assetType === "stock";
}
