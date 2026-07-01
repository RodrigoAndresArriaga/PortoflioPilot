import { describe, expect, it } from "vitest";

import { buildAssetScoresFromHistory } from "@/lib/market-data/build-asset-scores";
import { buildFixtureBars } from "@/lib/market-data/__tests__/fixtures";

describe("buildAssetScoresFromHistory", () => {
  it("derives non-neutral scores from live price history", () => {
    const bars = buildFixtureBars(280, 90, 0.005);
    const benchmark = buildFixtureBars(280, 110, 0.001);
    const result = buildAssetScoresFromHistory({
      symbol: "VOO",
      assetType: "etf",
      bars,
      benchmarkBars: benchmark,
    });

    expect(result.momentum_score).not.toBe(80);
    expect(result.trend_score).not.toBe(80);
    expect(result.volatility_risk_score).not.toBe(80);
    expect(result.etf_final_score).not.toBeNull();
    expect(result.etf_final_score).toBeGreaterThan(0);
  });
});
