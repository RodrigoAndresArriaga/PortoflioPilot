import { roundMoney } from "@/lib/engine/math";
import {
  clampScore,
  type MomentumInputs,
  type TrendInputs,
  type VolatilityInputs,
} from "@/lib/engine/scores";

// weighted momentum score from seeded inputs
export function computeMomentumScore(input: MomentumInputs): number {
  const score =
    0.4 * clampScore(input.return_12m) +
    0.3 * clampScore(input.return_6m) +
    0.2 * clampScore(input.return_3m) +
    0.1 * clampScore(input.price_above_200dma);

  return clampScore(roundMoney(score, 2));
}

// weighted trend score from seeded inputs
export function computeTrendScore(input: TrendInputs): number {
  const score =
    0.4 * clampScore(input.price_above_200dma) +
    0.3 * clampScore(input.price_above_50dma) +
    0.3 * clampScore(input.ma50_above_200dma);

  return clampScore(roundMoney(score, 2));
}

// weighted volatility risk score from seeded inputs
export function computeVolatilityRiskScore(input: VolatilityInputs): number {
  const score =
    0.35 * clampScore(input.volatility_90d) +
    0.25 * clampScore(input.max_drawdown_1y) +
    0.2 * clampScore(input.beta) +
    0.2 * clampScore(input.downside_volatility);

  return clampScore(roundMoney(score, 2));
}
