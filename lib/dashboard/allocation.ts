import { sumValues } from "@/lib/engine/math";
import { normalizePlanSymbol } from "@/lib/monthly-plan/format";
import type { Holding } from "@/types/database";

import type { AllocationSlice, DashboardExposureView } from "./types";

export function computeTotalPortfolioValue(holdings: Holding[]): number {
  return sumValues(holdings.map((holding) => holding.current_value));
}

// build current exposure slices from holdings
export function buildDashboardExposureView(
  holdings: Holding[],
): DashboardExposureView {
  const totalValue = computeTotalPortfolioValue(holdings);

  if (totalValue <= 0) {
    return { currentSlices: [] };
  }

  const valueBySymbol = new Map<string, { label: string; value: number }>();

  for (const holding of holdings) {
    const symbol = normalizePlanSymbol(holding.symbol);
    const label =
      holding.asset_name?.trim() ||
      (holding.asset_type === "cash" ? "Cash" : symbol);
    const existing = valueBySymbol.get(symbol);

    if (existing) {
      existing.value += holding.current_value;
    } else {
      valueBySymbol.set(symbol, {
        label,
        value: holding.current_value,
      });
    }
  }

  const currentSlices: AllocationSlice[] = Array.from(valueBySymbol.entries())
    .map(([key, entry]) => ({
      key,
      label: entry.label,
      percent: (entry.value / totalValue) * 100,
    }))
    .sort((left, right) => right.percent - left.percent);

  return { currentSlices };
}
