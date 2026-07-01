import { roundMoney } from "@/lib/engine/math";
import { buildPortfolioWeights } from "@/lib/engine/portfolio-weights";
import {
  MATERIAL_POSITION_PERCENT,
  MEGA_CAP_QQQ_THRESHOLD,
  MEGA_CAP_TECH_STOCKS,
  SP500_ETF_SYMBOLS,
  type ConcentrationHolding,
  type PortfolioWarning,
} from "@/lib/engine/warning-types";

const QQQ_SYMBOLS = new Set(["QQQ", "QQQM"]);

function findWeight(
  weights: ReturnType<typeof buildPortfolioWeights>,
  symbol: string,
): number {
  return weights.find((entry) => entry.symbol === symbol)?.weightPercent ?? 0;
}

function sumWeights(entries: { weightPercent: number }[]): number {
  return roundMoney(
    entries.reduce((total, entry) => total + entry.weightPercent, 0),
    2,
  );
}

// detect redundant ETF overlap warnings
export function detectOverlapWarnings(
  holdings: ConcentrationHolding[],
): PortfolioWarning[] {
  const weights = buildPortfolioWeights(holdings);
  if (weights.length === 0) {
    return [];
  }

  const warnings: PortfolioWarning[] = [];
  const vooWeight = findWeight(weights, "VOO");
  const vtiWeight = findWeight(weights, "VTI");

  if (
    vooWeight >= MATERIAL_POSITION_PERCENT &&
    vtiWeight >= MATERIAL_POSITION_PERCENT
  ) {
    warnings.push({
      code: "voo_vti_redundancy",
      severity: "warn",
      message:
        "VOO and VTI overlap heavily. Holding both as major positions adds redundant S&P 500 exposure.",
      symbols: ["VOO", "VTI"],
      actualPercent: roundMoney(vooWeight + vtiWeight, 2),
      thresholdPercent: MATERIAL_POSITION_PERCENT,
      blocksBuy: false,
    });
  }

  const sp500Etfs = weights.filter(
    (entry) => SP500_ETF_SYMBOLS.has(entry.symbol) && entry.weightPercent > 0,
  );

  if (sp500Etfs.length >= 2) {
    warnings.push({
      code: "multiple_sp500_etfs",
      severity: "warn",
      message: `Multiple S&P 500 ETFs detected (${sp500Etfs.map((entry) => entry.symbol).join(", ")}). Consider consolidating to reduce overlap.`,
      symbols: sp500Etfs.map((entry) => entry.symbol),
      actualPercent: sumWeights(sp500Etfs),
      blocksBuy: false,
    });
  }

  const hasQqq = weights.some(
    (entry) => QQQ_SYMBOLS.has(entry.symbol) && entry.weightPercent > 0,
  );
  const megaCapStocks = weights.filter(
    (entry) =>
      MEGA_CAP_TECH_STOCKS.has(entry.symbol) && entry.weightPercent > 0,
  );

  if (hasQqq && megaCapStocks.length >= MEGA_CAP_QQQ_THRESHOLD) {
    const qqqSymbols = weights
      .filter((entry) => QQQ_SYMBOLS.has(entry.symbol) && entry.weightPercent > 0)
      .map((entry) => entry.symbol);

    warnings.push({
      code: "qqq_mega_cap_concentration",
      severity: "warn",
      message:
        "QQQ plus multiple mega-cap tech stocks increases redundant tech concentration.",
      symbols: [...qqqSymbols, ...megaCapStocks.map((entry) => entry.symbol)],
      actualPercent: sumWeights([
        ...weights.filter((entry) => QQQ_SYMBOLS.has(entry.symbol)),
        ...megaCapStocks,
      ]),
      blocksBuy: false,
    });
  }

  return warnings;
}
