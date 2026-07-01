import type {
  MomentumInputs,
  TrendInputs,
  VolatilityInputs,
} from "@/lib/engine/scores";
import {
  computeBeta,
  computeDownsideVolatility90d,
  computeMaxDrawdown1y,
  computeReturnsFromBars,
  computeVolatility90d,
  getLatestClose,
  getMovingAverages,
  priceAboveMaScore,
  returnToScore,
  riskMetricToSafetyScore,
} from "@/lib/market-data/indicators";
import type { PriceBar, TechnicalInputBundle } from "@/lib/market-data/types";

const NEUTRAL_BETA = 1;

function betaToScore(beta: number): number {
  if (beta <= 0.5) {
    return 90;
  }
  if (beta >= 2) {
    return 10;
  }
  return 90 - ((beta - 0.5) / 1.5) * 80;
}

// map price history to technical score inputs
export function buildTechnicalInputsFromHistory(
  bars: PriceBar[],
  benchmarkBars: PriceBar[] = [],
): TechnicalInputBundle {
  const latest = getLatestClose(bars);
  const { sma50, sma200 } = getMovingAverages(bars);
  const returns = computeReturnsFromBars(bars);
  const vol90 = computeVolatility90d(bars);
  const maxDrawdown = computeMaxDrawdown1y(bars);
  const downsideVol = computeDownsideVolatility90d(bars);
  const beta =
    benchmarkBars.length > 0
      ? computeBeta(bars, benchmarkBars)
      : NEUTRAL_BETA;

  const momentum: MomentumInputs = {
    return_12m: returnToScore(returns.return_12m),
    return_6m: returnToScore(returns.return_6m),
    return_3m: returnToScore(returns.return_3m),
    price_above_200dma: priceAboveMaScore(latest, sma200),
  };

  const trend: TrendInputs = {
    price_above_200dma: priceAboveMaScore(latest, sma200),
    price_above_50dma: priceAboveMaScore(latest, sma50),
    ma50_above_200dma:
      sma50 && sma200 ? priceAboveMaScore(sma50, sma200) : 50,
  };

  const volatility: VolatilityInputs = {
    volatility_90d: riskMetricToSafetyScore(vol90, 50),
    max_drawdown_1y: riskMetricToSafetyScore(maxDrawdown, 50),
    beta: betaToScore(beta),
    downside_volatility: riskMetricToSafetyScore(downsideVol, 40),
  };

  return { momentum, trend, volatility };
}
