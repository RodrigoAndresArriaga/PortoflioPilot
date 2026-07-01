// sum numeric values
export function sumValues(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

// clamp negative buy amounts to zero
export function maxZero(value: number): number {
  return Math.max(0, value);
}

// round currency for stable output
export function roundMoney(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
