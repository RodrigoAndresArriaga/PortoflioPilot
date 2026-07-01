import type { AssetType } from "@/types/database";

export const SINGLE_STOCK_CONCENTRATION_PERCENT = 10;
export const TECH_EXPOSURE_PERCENT = 35;
export const MATERIAL_POSITION_PERCENT = 5;
export const MEGA_CAP_QQQ_THRESHOLD = 2;

export type WarningCode =
  | "single_stock_concentration"
  | "tech_exposure"
  | "voo_vti_redundancy"
  | "multiple_sp500_etfs"
  | "qqq_mega_cap_concentration";

export type WarningSeverity = "warn" | "block";

export type ConcentrationHolding = {
  symbol: string;
  asset_type: AssetType;
  current_value: number;
};

export type PortfolioWarning = {
  code: WarningCode;
  severity: WarningSeverity;
  message: string;
  symbols: string[];
  actualPercent?: number;
  thresholdPercent?: number;
  blocksBuy: boolean;
};

export const MEGA_CAP_TECH_STOCKS = new Set([
  "AAPL",
  "AMD",
  "AMZN",
  "GOOGL",
  "META",
  "MSFT",
  "NVDA",
]);

export const TECH_EXPOSURE_SYMBOLS = new Set([
  ...MEGA_CAP_TECH_STOCKS,
  "ARKK",
  "IGV",
  "QQQ",
  "QQQM",
  "SMH",
  "SOXX",
  "VGT",
  "XLK",
]);

export const SP500_ETF_SYMBOLS = new Set(["IVV", "SPY", "VOO", "VTI"]);

export type PortfolioWeightEntry = {
  symbol: string;
  asset_type: AssetType;
  weightPercent: number;
};
