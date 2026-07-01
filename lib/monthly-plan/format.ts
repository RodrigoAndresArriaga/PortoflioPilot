export function normalizePlanSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

export function isCashSymbol(symbol: string): boolean {
  return normalizePlanSymbol(symbol) === "CASH";
}

export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export function formatPlanCurrency(amount: number, currency: string): string {
  return amount.toLocaleString(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function formatWeightPercent(weight: number): string {
  return `${(weight * 100).toFixed(1)}%`;
}
