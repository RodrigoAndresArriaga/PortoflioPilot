import type { PriceBar, PriceHistory, Quote } from "@/lib/market-data/types";

export type QuoteProvider = {
  fetchHistory(symbol: string): Promise<PriceHistory>;
};

export type { Quote, PriceBar, PriceHistory };
