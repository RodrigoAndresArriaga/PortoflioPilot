import { roundMoney, sumValues } from "@/lib/engine/math";
import type {
  ConcentrationHolding,
  PortfolioWeightEntry,
} from "@/lib/engine/warning-types";
import { normalizePlanSymbol } from "@/lib/monthly-plan/format";

// aggregate holdings into portfolio weight percent by symbol
export function buildPortfolioWeights(
  holdings: ConcentrationHolding[],
): PortfolioWeightEntry[] {
  const totalValue = sumValues(holdings.map((holding) => holding.current_value));
  if (totalValue <= 0) {
    return [];
  }

  const valueBySymbol = new Map<
    string,
    { asset_type: ConcentrationHolding["asset_type"]; value: number }
  >();

  for (const holding of holdings) {
    const symbol = normalizePlanSymbol(holding.symbol);
    if (!symbol) {
      continue;
    }

    const existing = valueBySymbol.get(symbol);
    valueBySymbol.set(symbol, {
      asset_type: holding.asset_type,
      value: roundMoney((existing?.value ?? 0) + holding.current_value),
    });
  }

  return Array.from(valueBySymbol.entries()).map(([symbol, entry]) => ({
    symbol,
    asset_type: entry.asset_type,
    weightPercent: roundMoney((entry.value / totalValue) * 100, 2),
  }));
}
