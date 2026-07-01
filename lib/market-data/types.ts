export type PriceBar = {
  date: string;
  close: number;
};

export type PriceHistory = {
  symbol: string;
  currency: string;
  bars: PriceBar[];
  latestPrice: number;
  quotedAt: string;
};

export type Quote = {
  symbol: string;
  price: number;
  currency: string;
  quotedAt: string;
};

export type TechnicalInputBundle = {
  momentum: import("@/lib/engine/scores").MomentumInputs;
  trend: import("@/lib/engine/scores").TrendInputs;
  volatility: import("@/lib/engine/scores").VolatilityInputs;
};

export type MarketSnapshot = {
  holdings: import("@/types/database").Holding[];
  quotes: Record<string, Quote>;
  technicalScores: import("@/lib/engine/scores").AssetScoreResult[];
  refreshedAt: string;
};
