import { describe, expect, it } from "vitest";

import {
  computeMaxDrawdown1y,
  computeReturnsFromBars,
  computeSma,
  computeVolatility90d,
  priceAboveMaScore,
  returnToScore,
  riskMetricToSafetyScore,
} from "@/lib/market-data/indicators";
import { buildFixtureBars } from "@/lib/market-data/__tests__/fixtures";

describe("market-data indicators", () => {
  const bars = buildFixtureBars(300, 100, 0.003);

  it("maps positive returns to higher scores", () => {
    expect(returnToScore(30)).toBe(100);
    expect(returnToScore(-30)).toBe(0);
    expect(returnToScore(0)).toBe(50);
  });

  it("computes multi-month returns from bars", () => {
    const returns = computeReturnsFromBars(bars);
    expect(returns.return_3m).toBeGreaterThan(0);
    expect(returns.return_12m).toBeGreaterThan(returns.return_3m);
  });

  it("computes SMA and MA score", () => {
    const closes = bars.map((bar) => bar.close);
    const sma50 = computeSma(closes, 50);
    expect(sma50).not.toBeNull();
    expect(priceAboveMaScore(bars[bars.length - 1].close, sma50)).toBeGreaterThan(
      50,
    );
  });

  it("computes drawdown and volatility safety scores", () => {
    const drawdown = computeMaxDrawdown1y(bars);
    const vol = computeVolatility90d(bars);
    expect(drawdown).toBeGreaterThanOrEqual(0);
    expect(riskMetricToSafetyScore(vol, 50)).toBeLessThan(100);
  });
});
