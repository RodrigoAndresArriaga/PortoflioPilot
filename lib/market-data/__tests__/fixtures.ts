import type { PriceBar } from "@/lib/market-data/types";

// generate ascending daily bars for indicator tests
export function buildFixtureBars(
  count: number,
  startPrice = 100,
  dailyDrift = 0.002,
): PriceBar[] {
  const bars: PriceBar[] = [];
  let price = startPrice;
  const start = new Date("2023-01-03");

  for (let index = 0; index < count; index += 1) {
    const date = new Date(start);
    date.setDate(date.getDate() + index);
    price *= 1 + dailyDrift;
    bars.push({
      date: date.toISOString().slice(0, 10),
      close: Number(price.toFixed(2)),
    });
  }

  return bars;
}

export const yahooChartFixture = {
  chart: {
    result: [
      {
        meta: {
          regularMarketPrice: 105.5,
          currency: "USD",
          symbol: "VOO",
        },
        timestamp: [1704067200, 1704153600],
        indicators: {
          quote: [{ close: [100, 105.5] }],
        },
      },
    ],
  },
};
