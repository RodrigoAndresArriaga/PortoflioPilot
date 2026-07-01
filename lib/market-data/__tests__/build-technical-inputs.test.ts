import { describe, expect, it } from "vitest";

import { buildTechnicalInputsFromHistory } from "@/lib/market-data/build-technical-inputs";
import { buildFixtureBars } from "@/lib/market-data/__tests__/fixtures";

describe("buildTechnicalInputsFromHistory", () => {
  it("maps price history to momentum, trend, and volatility inputs", () => {
    const bars = buildFixtureBars(280, 80, 0.004);
    const benchmark = buildFixtureBars(280, 120, 0.002);
    const bundle = buildTechnicalInputsFromHistory(bars, benchmark);

    expect(bundle.momentum.return_12m).toBeGreaterThan(50);
    expect(bundle.trend.price_above_50dma).toBeGreaterThan(50);
    expect(bundle.volatility.beta).toBeGreaterThan(0);
    expect(bundle.volatility.volatility_90d).toBeGreaterThan(0);
  });
});
