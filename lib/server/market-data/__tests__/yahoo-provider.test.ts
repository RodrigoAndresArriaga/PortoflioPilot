import { afterEach, describe, expect, it, vi } from "vitest";

import { yahooChartFixture } from "@/lib/market-data/__tests__/fixtures";
import { YahooQuoteProvider } from "@/lib/server/market-data/yahoo-provider";

describe("YahooQuoteProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("parses chart JSON into price history", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => yahooChartFixture,
      }),
    );

    const provider = new YahooQuoteProvider();
    const history = await provider.fetchHistory("VOO");

    expect(history.symbol).toBe("VOO");
    expect(history.latestPrice).toBe(105.5);
    expect(history.bars).toHaveLength(2);
    expect(history.bars[1].close).toBe(105.5);
  });
});
