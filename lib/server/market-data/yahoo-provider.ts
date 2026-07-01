import { normalizePlanSymbol } from "@/lib/monthly-plan/format";
import type { PriceBar, PriceHistory } from "@/lib/market-data/types";
import type { QuoteProvider } from "@/lib/server/market-data/quote-provider";

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      meta?: {
        regularMarketPrice?: number;
        currency?: string;
        symbol?: string;
      };
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          close?: Array<number | null>;
        }>;
      };
    }>;
  };
};

const YAHOO_CHART_URL =
  "https://query1.finance.yahoo.com/v8/finance/chart";

type YahooChartResult = NonNullable<
  NonNullable<YahooChartResponse["chart"]>["result"]
>[number];

function parseBars(result: YahooChartResult | undefined): PriceBar[] {
  const timestamps = result?.timestamp ?? [];
  const closes = result?.indicators?.quote?.[0]?.close ?? [];
  const bars: PriceBar[] = [];

  for (let index = 0; index < timestamps.length; index += 1) {
    const close = closes[index];
    if (close === null || close === undefined || Number.isNaN(close)) {
      continue;
    }
    bars.push({
      date: new Date(timestamps[index] * 1000).toISOString().slice(0, 10),
      close,
    });
  }

  return bars;
}

export class YahooQuoteProvider implements QuoteProvider {
  async fetchHistory(symbol: string): Promise<PriceHistory> {
    const normalized = normalizePlanSymbol(symbol);
    const url = `${YAHOO_CHART_URL}/${encodeURIComponent(normalized)}?range=2y&interval=1d`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 PortfolioPilot/1.0",
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      throw new Error(`Yahoo quote fetch failed for ${normalized}.`);
    }

    const payload = (await response.json()) as YahooChartResponse;
    const result = payload.chart?.result?.[0];
    if (!result) {
      throw new Error(`No Yahoo chart data for ${normalized}.`);
    }

    const bars = parseBars(result);
    if (bars.length === 0) {
      throw new Error(`Empty Yahoo price history for ${normalized}.`);
    }

    const latestPrice =
      result.meta?.regularMarketPrice ?? bars[bars.length - 1].close;
    const currency = result.meta?.currency ?? "USD";

    return {
      symbol: normalized,
      currency,
      bars,
      latestPrice,
      quotedAt: new Date().toISOString(),
    };
  }
}

export const yahooQuoteProvider = new YahooQuoteProvider();
