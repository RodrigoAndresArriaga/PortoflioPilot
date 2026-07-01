import type { NewsModifierSignal } from "@/lib/engine/news-modifier";
import type { ManualNewsInput } from "@/types/database";

// map manual news child rows to engine signals
export function newsInputsToSignals(
  children: ManualNewsInput[],
): NewsModifierSignal[] {
  return children
    .filter((child) => child.symbol)
    .map((child) => ({
      symbol: child.symbol!,
      asset_type: child.asset_type ?? undefined,
      ai_bias: child.ai_bias ?? undefined,
      news_confidence: child.news_confidence ?? undefined,
      impact_horizon: child.impact_horizon ?? undefined,
      suggested_frontend_status: child.suggested_frontend_status ?? undefined,
    }));
}
