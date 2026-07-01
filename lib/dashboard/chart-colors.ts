// muted professional palette — distinct but restrained
export const CHART_PALETTE = [
  "#3D7A6E",
  "#4F6678",
  "#5C5A7A",
  "#8A7355",
  "#4A6278",
  "#6B7568",
  "#7A6368",
  "#526A72",
] as const;

const BUCKET_CHART_COLORS: Record<string, string> = {
  core_etf: "#3D7A6E",
  growth_tech: "#4F6678",
  cash_reserve: "#8A7355",
  individual_stock: "#5C5A7A",
};

export const DRIFT_STATUS_COLORS = {
  on_target: "#4A7D72",
  underweight: "#4F6678",
  overweight: "#926B52",
} as const;

// stable color per slice key for matching current/target charts
export function getSliceColor(key: string, index: number): string {
  return (
    BUCKET_CHART_COLORS[key] ??
    CHART_PALETTE[index % CHART_PALETTE.length]
  );
}

export function getDriftColor(
  status: keyof typeof DRIFT_STATUS_COLORS,
  driftPercent: number,
): string {
  if (status === "on_target") {
    return DRIFT_STATUS_COLORS.on_target;
  }
  if (driftPercent < 0) {
    return DRIFT_STATUS_COLORS.underweight;
  }
  return DRIFT_STATUS_COLORS.overweight;
}
