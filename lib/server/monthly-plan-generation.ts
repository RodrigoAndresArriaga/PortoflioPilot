import { allocateMonthlyBudget } from "@/lib/engine/final-position-sizing";
import { newsInputsToSignals } from "@/lib/engine/news-signals";
import type { NewsModifierSignal } from "@/lib/engine/news-modifier";
import type { AssetScoreResult } from "@/lib/engine/scores";
import { baseCurrencySchema } from "@/lib/validation/common";
import type { SaveMonthlyPlanInput } from "@/lib/validation/monthly-plan";
import type { Holding, Profile, WatchlistItem } from "@/types/database";

// current month key in UTC
export function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

type BuildMonthlyPlanPayloadInput = {
  profile: Profile;
  holdings: Holding[];
  watchlist: WatchlistItem[];
  month: string;
  technicalScores?: AssetScoreResult[];
  newsSignals?: NewsModifierSignal[];
};

// run recommendation engine and map results to a save payload
export function buildMonthlyPlanPayload(
  input: BuildMonthlyPlanPayloadInput,
): { ok: true; data: SaveMonthlyPlanInput } | { ok: false; error: string } {
  const { profile, holdings, watchlist, month } = input;

  if (holdings.length === 0 && watchlist.length === 0) {
    return {
      ok: false,
      error: "Add at least one holding or watchlist symbol before generating a plan.",
    };
  }

  const nonCashHoldings = holdings.filter(
    (holding) => holding.asset_type !== "cash",
  );

  if (nonCashHoldings.length === 0 && watchlist.length === 0) {
    return {
      ok: false,
      error: "Add at least one investable holding or watchlist symbol.",
    };
  }

  const newsSignals = input.newsSignals ?? [];
  const technicalScores = input.technicalScores ?? [];

  const sized = allocateMonthlyBudget({
    profile,
    holdings,
    watchlist,
    newsSignals,
    technicalScores,
    monthlyAmount: profile.monthly_investment_amount,
  });

  const currencyResult = baseCurrencySchema.safeParse(profile.base_currency);
  const currency = currencyResult.success ? currencyResult.data : "MXN";

  const items = sized
    .filter(
      (candidate) =>
        candidate.recommended_amount > 0 || candidate.blocked,
    )
    .map((candidate) => ({
      symbol: candidate.symbol,
      recommendation_score: candidate.recommendation_score,
      technical_score: candidate.technical_score,
      news_modifier_score: candidate.news_modifier_score,
      risk_score: candidate.risk_score,
      concentration_flag: candidate.concentration_flag,
      manual_review_required: candidate.manual_review_required,
      decision_basis: candidate.decision_basis,
      recommended_amount: candidate.recommended_amount,
      adjusted_amount: candidate.recommended_amount,
      reason: candidate.reason,
    }));

  if (items.length === 0) {
    return {
      ok: false,
      error: "No buy recommendations could be generated for this month.",
    };
  }

  return {
    ok: true,
    data: {
      month,
      monthly_amount: profile.monthly_investment_amount,
      currency,
      status: "draft",
      items,
    },
  };
}

export { newsInputsToSignals };
