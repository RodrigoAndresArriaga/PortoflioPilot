import type { InvestmentStatus, Profile } from "@/types/database";

export type SetupAttentionContext = {
  shouldShow: boolean;
  isNotInvestedYet: boolean;
  hasNoHoldings: boolean;
};

// determine whether setup attention banner should appear
export function getSetupAttentionContext(
  profile: Pick<
    Profile,
    "investment_status" | "setup_attention_dismissed"
  >,
  holdingsCount: number,
): SetupAttentionContext {
  const isNotInvestedYet = profile.investment_status === "not_invested_yet";
  const hasNoHoldings = holdingsCount === 0;
  const needsAttention = isNotInvestedYet || hasNoHoldings;

  return {
    shouldShow: needsAttention && !profile.setup_attention_dismissed,
    isNotInvestedYet,
    hasNoHoldings,
  };
}

export function normalizeInvestmentStatus(
  status: string | null | undefined,
): InvestmentStatus {
  if (
    status === "not_invested_yet" ||
    status === "has_investments" ||
    status === "unknown"
  ) {
    return status;
  }
  return "unknown";
}
