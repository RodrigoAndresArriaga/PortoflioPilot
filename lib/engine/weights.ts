import type { EngineHolding, EngineTargetAllocation } from "@/lib/engine/types";

// normalize symbol to uppercase trimmed key
export function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

// union symbols from holdings and targets
export function mergeSymbols(
  holdings: EngineHolding[],
  targets: EngineTargetAllocation[],
): string[] {
  const symbols = new Set<string>();

  for (const holding of holdings) {
    symbols.add(normalizeSymbol(holding.symbol));
  }

  for (const target of targets) {
    symbols.add(normalizeSymbol(target.symbol));
  }

  return Array.from(symbols).sort();
}

// map symbol to current portfolio value
export function buildValueMap(holdings: EngineHolding[]): Map<string, number> {
  const values = new Map<string, number>();

  for (const holding of holdings) {
    const symbol = normalizeSymbol(holding.symbol);
    values.set(symbol, (values.get(symbol) ?? 0) + holding.current_value);
  }

  return values;
}

// map symbol to target weight
export function buildWeightMap(
  targets: EngineTargetAllocation[],
): Map<string, number> {
  const weights = new Map<string, number>();

  for (const target of targets) {
    weights.set(normalizeSymbol(target.symbol), target.target_weight);
  }

  return weights;
}

// current weight as fraction of portfolio value
export function computeCurrentWeight(
  currentValue: number,
  portfolioValue: number,
): number {
  if (portfolioValue <= 0) {
    return 0;
  }

  return currentValue / portfolioValue;
}
