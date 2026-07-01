import { normalizePlanSymbol } from "@/lib/monthly-plan/format";
import type { AssetType, TargetBucketKey } from "@/types/database";

export type HoldingForBucketInference = {
  symbol: string;
  asset_type: AssetType;
};

export type InferredTargetAsset = {
  symbol: string;
  bucket_key: TargetBucketKey;
};

const GROWTH_TECH_ETF_SYMBOLS = new Set([
  "ARKK",
  "IGV",
  "QQQ",
  "QQQM",
  "SMH",
  "SOXX",
  "VGT",
  "XLK",
]);

const KNOWN_SYMBOL_BUCKETS: Record<string, TargetBucketKey> = {
  AAPL: "individual_stock",
  AMD: "individual_stock",
  AMZN: "individual_stock",
  BND: "core_etf",
  GOOGL: "individual_stock",
  META: "individual_stock",
  MSFT: "individual_stock",
  NVDA: "individual_stock",
  QQQ: "growth_tech",
  QQQM: "growth_tech",
  SCHD: "core_etf",
  VOO: "core_etf",
  VTI: "core_etf",
  VXUS: "core_etf",
};

const STOCK_FALLBACK_BUCKETS: TargetBucketKey[] = [
  "individual_stock",
  "growth_tech",
  "core_etf",
];

const ETF_FALLBACK_BUCKETS: TargetBucketKey[] = [
  "core_etf",
  "growth_tech",
  "individual_stock",
];

function pickEnabledBucket(
  preferred: TargetBucketKey,
  enabledBuckets: Set<TargetBucketKey>,
  fallbacks: TargetBucketKey[],
): TargetBucketKey | null {
  if (enabledBuckets.has(preferred)) {
    return preferred;
  }

  for (const bucket of fallbacks) {
    if (enabledBuckets.has(bucket)) {
      return bucket;
    }
  }

  return null;
}

// map one holding to a target bucket
export function inferBucketKeyForHolding(
  holding: HoldingForBucketInference,
  enabledBuckets: Set<TargetBucketKey>,
): TargetBucketKey | null {
  const symbol = normalizePlanSymbol(holding.symbol);

  if (holding.asset_type === "cash") {
    return pickEnabledBucket("cash_reserve", enabledBuckets, []);
  }

  const knownBucket = KNOWN_SYMBOL_BUCKETS[symbol];
  if (knownBucket) {
    const fallbacks =
      knownBucket === "individual_stock" || knownBucket === "growth_tech"
        ? STOCK_FALLBACK_BUCKETS
        : ETF_FALLBACK_BUCKETS;
    return pickEnabledBucket(knownBucket, enabledBuckets, fallbacks);
  }

  if (holding.asset_type === "stock") {
    return pickEnabledBucket(
      "individual_stock",
      enabledBuckets,
      STOCK_FALLBACK_BUCKETS,
    );
  }

  if (holding.asset_type === "etf") {
    const preferred = GROWTH_TECH_ETF_SYMBOLS.has(symbol)
      ? "growth_tech"
      : "core_etf";
    return pickEnabledBucket(preferred, enabledBuckets, ETF_FALLBACK_BUCKETS);
  }

  return pickEnabledBucket("growth_tech", enabledBuckets, [
    "growth_tech",
    "individual_stock",
    "core_etf",
  ]);
}

// assign each held symbol to a bucket for auto/bucket allocation modes
export function inferTargetAssetsFromHoldings(
  holdings: HoldingForBucketInference[],
  enabledBucketKeys: Iterable<TargetBucketKey>,
): InferredTargetAsset[] {
  const enabledBuckets = new Set(enabledBucketKeys);
  const assets: InferredTargetAsset[] = [];
  const seen = new Set<string>();

  for (const holding of holdings) {
    const symbol = normalizePlanSymbol(holding.symbol);
    if (!symbol || seen.has(symbol)) {
      continue;
    }

    const bucketKey = inferBucketKeyForHolding(holding, enabledBuckets);
    if (!bucketKey) {
      continue;
    }

    seen.add(symbol);
    assets.push({ symbol, bucket_key: bucketKey });
  }

  return assets;
}
