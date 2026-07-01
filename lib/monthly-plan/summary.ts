import { roundMoney } from "@/lib/engine/math";
import { isCashSymbol } from "@/lib/monthly-plan/format";
import type { MonthlyPlanItem } from "@/types/database";

export type MonthlyPlanSummary = {
  cashReserve: number;
  allocatedToAssets: number;
  manualTradeCount: number;
  totalAllocated: number;
  unallocated: number;
};

// compute budget breakdown from plan line items
export function computeMonthlyPlanSummary(
  monthlyAmount: number,
  items: Pick<MonthlyPlanItem, "symbol" | "adjusted_amount">[],
): MonthlyPlanSummary {
  let cashReserve = 0;
  let allocatedToAssets = 0;
  let manualTradeCount = 0;

  for (const item of items) {
    const amount = roundMoney(item.adjusted_amount);

    if (isCashSymbol(item.symbol)) {
      cashReserve = roundMoney(cashReserve + amount);
      continue;
    }

    allocatedToAssets = roundMoney(allocatedToAssets + amount);
    if (amount > 0) {
      manualTradeCount += 1;
    }
  }

  const totalAllocated = roundMoney(cashReserve + allocatedToAssets);
  const unallocated = roundMoney(monthlyAmount - totalAllocated);

  return {
    cashReserve,
    allocatedToAssets,
    manualTradeCount,
    totalAllocated,
    unallocated,
  };
}
