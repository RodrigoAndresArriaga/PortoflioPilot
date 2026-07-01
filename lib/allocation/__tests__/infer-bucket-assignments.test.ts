import { describe, expect, it } from "vitest";

import {
  inferBucketKeyForHolding,
  inferTargetAssetsFromHoldings,
} from "@/lib/allocation/infer-bucket-assignments";

const ENABLED = new Set([
  "core_etf",
  "growth_tech",
  "cash_reserve",
] as const);

describe("inferBucketKeyForHolding", () => {
  it("maps broad ETFs to core and growth ETFs to growth_tech", () => {
    expect(
      inferBucketKeyForHolding(
        { symbol: "VOO", asset_type: "etf" },
        ENABLED,
      ),
    ).toBe("core_etf");

    expect(
      inferBucketKeyForHolding(
        { symbol: "QQQ", asset_type: "etf" },
        ENABLED,
      ),
    ).toBe("growth_tech");
  });

  it("maps stocks to individual_stock when that bucket is enabled", () => {
    expect(
      inferBucketKeyForHolding(
        { symbol: "MSFT", asset_type: "stock" },
        new Set(["core_etf", "growth_tech", "individual_stock"]),
      ),
    ).toBe("individual_stock");
  });

  it("maps stocks to growth_tech when individual_stock bucket is disabled", () => {
    expect(
      inferBucketKeyForHolding(
        { symbol: "MSFT", asset_type: "stock" },
        ENABLED,
      ),
    ).toBe("growth_tech");
  });

  it("maps cash holdings to cash_reserve", () => {
    expect(
      inferBucketKeyForHolding(
        { symbol: "CASH", asset_type: "cash" },
        ENABLED,
      ),
    ).toBe("cash_reserve");
  });
});

describe("inferTargetAssetsFromHoldings", () => {
  it("returns one assignment per held symbol", () => {
    const assets = inferTargetAssetsFromHoldings(
      [
        { symbol: "VOO", asset_type: "etf" },
        { symbol: "QQQ", asset_type: "etf" },
        { symbol: "MSFT", asset_type: "stock" },
        { symbol: "CASH", asset_type: "cash" },
      ],
      ENABLED,
    );

    expect(assets).toEqual([
      { symbol: "VOO", bucket_key: "core_etf" },
      { symbol: "QQQ", bucket_key: "growth_tech" },
      { symbol: "MSFT", bucket_key: "growth_tech" },
      { symbol: "CASH", bucket_key: "cash_reserve" },
    ]);
  });
});
