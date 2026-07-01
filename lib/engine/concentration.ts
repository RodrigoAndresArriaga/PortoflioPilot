import { buildPortfolioWeights } from "@/lib/engine/portfolio-weights";
import { detectOverlapWarnings } from "@/lib/engine/overlap";
import { normalizePlanSymbol } from "@/lib/monthly-plan/format";
import {
  SINGLE_STOCK_CONCENTRATION_PERCENT,
  TECH_EXPOSURE_PERCENT,
  TECH_EXPOSURE_SYMBOLS,
  type ConcentrationHolding,
  type PortfolioWarning,
} from "@/lib/engine/warning-types";
import { roundMoney } from "@/lib/engine/math";

export type {
  ConcentrationHolding,
  PortfolioWarning,
  WarningCode,
  WarningSeverity,
} from "@/lib/engine/warning-types";

export {
  MEGA_CAP_TECH_STOCKS,
  SINGLE_STOCK_CONCENTRATION_PERCENT,
  TECH_EXPOSURE_PERCENT,
} from "@/lib/engine/warning-types";

// detect single-stock and tech exposure warnings
export function detectConcentrationWarnings(
  holdings: ConcentrationHolding[],
): PortfolioWarning[] {
  const weights = buildPortfolioWeights(holdings);
  if (weights.length === 0) {
    return [];
  }

  const warnings: PortfolioWarning[] = [];

  for (const entry of weights) {
    if (entry.asset_type !== "stock") {
      continue;
    }

    if (entry.weightPercent > SINGLE_STOCK_CONCENTRATION_PERCENT) {
      warnings.push({
        code: "single_stock_concentration",
        severity: "block",
        message: `${entry.symbol} is ${entry.weightPercent.toFixed(1)}% of the portfolio. Single stocks above ${SINGLE_STOCK_CONCENTRATION_PERCENT}% block additional buys.`,
        symbols: [entry.symbol],
        actualPercent: entry.weightPercent,
        thresholdPercent: SINGLE_STOCK_CONCENTRATION_PERCENT,
        blocksBuy: true,
      });
    }
  }

  const techWeight = roundMoney(
    weights
      .filter((entry) => TECH_EXPOSURE_SYMBOLS.has(entry.symbol))
      .reduce((total, entry) => total + entry.weightPercent, 0),
    2,
  );

  if (techWeight > TECH_EXPOSURE_PERCENT) {
    const techSymbols = weights
      .filter((entry) => TECH_EXPOSURE_SYMBOLS.has(entry.symbol))
      .map((entry) => entry.symbol);

    warnings.push({
      code: "tech_exposure",
      severity: "warn",
      message: `Tech exposure is ${techWeight.toFixed(1)}% of the portfolio. Concentration above ${TECH_EXPOSURE_PERCENT}% increases sector risk.`,
      symbols: techSymbols,
      actualPercent: techWeight,
      thresholdPercent: TECH_EXPOSURE_PERCENT,
      blocksBuy: false,
    });
  }

  return warnings;
}

// merge concentration and overlap warnings
export function detectPortfolioWarnings(
  holdings: ConcentrationHolding[],
): PortfolioWarning[] {
  return [
    ...detectConcentrationWarnings(holdings),
    ...detectOverlapWarnings(holdings),
  ];
}

// symbols with blocked-buy warnings
export function getBlockedBuySymbols(
  warnings: PortfolioWarning[],
): Set<string> {
  const blocked = new Set<string>();

  for (const warning of warnings) {
    if (!warning.blocksBuy) {
      continue;
    }

    for (const symbol of warning.symbols) {
      blocked.add(normalizePlanSymbol(symbol));
    }
  }

  return blocked;
}
